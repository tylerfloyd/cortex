import { NextRequest } from 'next/server';
import { eq, and, isNotNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { items, categories } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';
import { createEmbedding, chatCompletionStream, MODELS } from '@/lib/ai/openrouter';

const askSchema = z.object({
  question: z.string().min(1),
  category: z.string().optional(),
});

// NDJSON line helpers
function ndjson(obj: unknown): string {
  return JSON.stringify(obj) + '\n';
}

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      ndjson({ type: 'error', error: 'Invalid JSON body' }),
      { status: 400, headers: { 'Content-Type': 'application/x-ndjson' } }
    );
  }

  const parsed = askSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      ndjson({ type: 'error', error: 'Validation failed' }),
      { status: 400, headers: { 'Content-Type': 'application/x-ndjson' } }
    );
  }

  const { question, category: categoryFilter } = parsed.data;

  let embedding: number[];
  try {
    embedding = await createEmbedding(question.trim());
  } catch (err) {
    console.error('[ask/stream] Failed to generate embedding:', err);
    return new Response(
      ndjson({ type: 'error', error: 'Failed to generate query embedding' }),
      { status: 500, headers: { 'Content-Type': 'application/x-ndjson' } }
    );
  }

  // sql.raw is safe here: embedding values come from OpenRouter's API, not user input
  const embeddingLiteral = sql.raw(`'[${embedding.join(',')}]'`);
  const similarityExpr = sql<number>`1 - (${items.embedding} <=> ${embeddingLiteral})`;

  const contextResults = await db
    .select({
      id: items.id,
      title: items.title,
      url: items.url,
      summary: items.summary,
      sourceType: items.sourceType,
      categorySlug: categories.slug,
      similarity: similarityExpr,
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(
      and(
        eq(items.processingStatus, 'completed'),
        isNotNull(items.embedding),
        categoryFilter ? eq(categories.slug, categoryFilter) : undefined
      )
    )
    .orderBy(sql`${items.embedding} <=> ${embeddingLiteral}`)
    .limit(5);

  const sources = contextResults.map((r) => ({
    id: r.id,
    title: r.title ?? r.url,
    url: r.url,
    relevance: r.similarity,
  }));

  if (contextResults.length === 0) {
    const stream = new ReadableStream({
      start(controller) {
        const enc = new TextEncoder();
        controller.enqueue(enc.encode(ndjson({ type: 'chunk', content: 'I could not find any relevant items in your knowledge base to answer that question.' })));
        controller.enqueue(enc.encode(ndjson({ type: 'sources', sources: [] })));
        controller.enqueue(enc.encode(ndjson({ type: 'done' })));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'application/x-ndjson', 'Transfer-Encoding': 'chunked' },
    });
  }

  const contextBlock = contextResults
    .map((r, i) => {
      const title = r.title ?? r.url;
      const summary = r.summary ?? '(no summary available)';
      return `[${i + 1}] Title: ${title}\nURL: ${r.url}\nSummary: ${summary}`;
    })
    .join('\n\n');

  const systemPrompt = `You are Cortex, a personal knowledge assistant. Answer the user's question using only the provided knowledge base excerpts. Be concise and factual. If the context does not contain enough information, say so honestly.`;
  const userPrompt = `Knowledge base excerpts:\n\n${contextBlock}\n\nQuestion: ${question}`;

  let openRouterResponse: Response;
  try {
    openRouterResponse = await chatCompletionStream(MODELS.chat, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
  } catch (err) {
    console.error('[ask/stream] Chat completion stream failed:', err);
    return new Response(
      ndjson({ type: 'error', error: 'Failed to start answer stream' }),
      { status: 500, headers: { 'Content-Type': 'application/x-ndjson' } }
    );
  }

  // Forward the OpenRouter SSE stream as NDJSON to the client
  const encoder = new TextEncoder();
  const upstreamBody = openRouterResponse.body;

  const stream = new ReadableStream({
    async start(controller) {
      if (!upstreamBody) {
        controller.enqueue(encoder.encode(ndjson({ type: 'error', error: 'No upstream body' })));
        controller.close();
        return;
      }

      const reader = upstreamBody.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6); // strip "data: "
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data) as {
                choices?: Array<{
                  delta?: { content?: string };
                  finish_reason?: string | null;
                }>;
              };
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(ndjson({ type: 'chunk', content })));
              }
            } catch {
              // Ignore malformed SSE lines
            }
          }
        }
      } catch (err) {
        console.error('[ask/stream] Error reading upstream stream:', err);
        controller.enqueue(encoder.encode(ndjson({ type: 'error', error: 'Stream read error' })));
      } finally {
        reader.releaseLock();
      }

      // Emit sources after the answer is complete
      controller.enqueue(encoder.encode(ndjson({ type: 'sources', sources })));
      controller.enqueue(encoder.encode(ndjson({ type: 'done' })));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked',
      'X-Accel-Buffering': 'no',
    },
  });
}
