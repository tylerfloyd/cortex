import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNotNull, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { items, categories } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';
import { createEmbedding, chatCompletion, MODELS } from '@/lib/ai/openrouter';

const askSchema = z.object({
  question: z.string().min(1),
  category: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = askSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { question, category: categoryFilter } = parsed.data;

  let embedding: number[];
  try {
    embedding = await createEmbedding(question.trim());
  } catch (err) {
    console.error('[ask] Failed to generate embedding:', err);
    return NextResponse.json({ error: 'Failed to generate query embedding' }, { status: 500 });
  }

  // sql.raw is safe here: embedding values come from OpenRouter's API, not user input
  const embeddingLiteral = sql.raw(`'[${embedding.join(',')}]'`);
  const similarityExpr = sql<number>`1 - (${items.embedding} <=> ${embeddingLiteral})`;

  // Retrieve top 5 context items via semantic search
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

  if (contextResults.length === 0) {
    return NextResponse.json({
      answer: 'I could not find any relevant items in your knowledge base to answer that question.',
      sources: [],
    });
  }

  // Build context block for the prompt
  const contextBlock = contextResults
    .map((r, i) => {
      const title = r.title ?? r.url;
      const summary = r.summary ?? '(no summary available)';
      return `[${i + 1}] Title: ${title}\nURL: ${r.url}\nSummary: ${summary}`;
    })
    .join('\n\n');

  const systemPrompt = `You are Cortex, a personal knowledge assistant. Answer the user's question using only the provided knowledge base excerpts. Be concise and factual. If the context does not contain enough information, say so honestly.`;

  const userPrompt = `Knowledge base excerpts:\n\n${contextBlock}\n\nQuestion: ${question}`;

  let answer: string;
  try {
    answer = await chatCompletion(MODELS.chat, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
  } catch (err) {
    console.error('[ask] Chat completion failed:', err);
    return NextResponse.json({ error: 'Failed to generate answer' }, { status: 500 });
  }

  const sources = contextResults.map((r) => ({
    id: r.id,
    title: r.title ?? r.url,
    url: r.url,
    relevance: r.similarity,
  }));

  return NextResponse.json({ answer, sources });
}
