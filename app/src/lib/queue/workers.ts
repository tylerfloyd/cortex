import { Worker, type Job } from 'bullmq';
import { eq, desc, sql, getTableColumns } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items, jobLog, categories, tags, itemTags, itemRelations } from '@/lib/db/schema';
import { redisConnection } from './connection';
import {
  aiProcessingQueue,
  embeddingQueue,
  markdownExportQueue,
} from './queues';
import type {
  ExtractionJobData,
  AIProcessingJobData,
  EmbeddingJobData,
  MarkdownExportJobData,
} from './types';
import { extractArticle } from '@/lib/extractors/article';
import { extractYoutube } from '@/lib/extractors/youtube';
import { extractReddit } from '@/lib/extractors/reddit';
import { extractTwitter } from '@/lib/extractors/twitter';
import { extractPdf } from '@/lib/extractors/pdf';
import { summarizeContent } from '@/lib/ai/summarize';
import { categorizeContent } from '@/lib/ai/categorize';
import { generateEmbedding } from '@/lib/ai/embed';
import { MODELS, chatCompletion } from '@/lib/ai/openrouter';
import { writeItemMarkdown } from '@/lib/export/markdown';
import { regenerateIndex } from '@/lib/export/index-generator';
import type { FullItem } from '@/lib/export/markdown';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function insertJobLog(
  itemId: string,
  jobType: 'content-extraction' | 'ai-processing' | 'embedding' | 'markdown-export',
): Promise<string> {
  const rows = await db
    .insert(jobLog)
    .values({
      itemId,
      jobType,
      status: 'running' as const,
      startedAt: new Date(),
    })
    .returning({ id: jobLog.id });

  if (rows.length === 0) {
    throw new Error(`Failed to insert job_log entry for item ${itemId}, job type ${jobType}`);
  }
  return rows[0].id;
}

async function completeJobLog(logId: string): Promise<void> {
  await db
    .update(jobLog)
    .set({ status: 'completed', completedAt: new Date() })
    .where(eq(jobLog.id, logId));
}

async function failJobLog(logId: string, error: string): Promise<void> {
  await db
    .update(jobLog)
    .set({ status: 'failed', error })
    .where(eq(jobLog.id, logId));
}

// ---------------------------------------------------------------------------
// Helpers for item_relations population
// ---------------------------------------------------------------------------

/**
 * Fire-and-forget contradiction check between two items.
 * If the AI determines they contradict each other, inserts a 'contradicts' relation.
 */
async function checkContradiction(
  itemId: string,
  neighborId: string,
  summaryA: string,
  summaryB: string,
): Promise<void> {
  try {
    const [idA, idB] = [itemId, neighborId].sort();
    const response = await chatCompletion(MODELS.categorize, [
      {
        role: 'system',
        content:
          'You are a fact-checking assistant. Given two article summaries, determine if they contradict each other — i.e., they make opposing claims about the same topic. Reply with only "yes" or "no".',
      },
      {
        role: 'user',
        content: `Summary A:\n${summaryA}\n\nSummary B:\n${summaryB}\n\nDo these summaries contradict each other?`,
      },
    ]);
    if (response.trim().toLowerCase().startsWith('yes')) {
      await db
        .insert(itemRelations)
        .values({
          itemAId: idA,
          itemBId: idB,
          relationType: 'contradicts',
          similarity: null,
        })
        .onConflictDoNothing();
      console.log(`[embedder] Flagged contradiction between ${idA} and ${idB}`);
    }
  } catch (err) {
    console.warn('[embedder] Contradiction check failed:', err);
  }
}

/**
 * After storing an embedding, find nearest neighbours via pgvector and
 * populate the item_relations table. Also triggers async contradiction checks
 * for very high-similarity pairs.
 */
async function populateItemRelations(itemId: string, embeddingVector: number[]): Promise<void> {
  try {
    // Query top 10 nearest neighbours (excluding self), only completed items with embeddings
    const vectorLiteral = `[${embeddingVector.join(',')}]`;
    const neighbours = await db.execute<{
      id: string;
      summary: string | null;
      similarity: number;
    }>(sql`
      SELECT
        i.id,
        i.summary,
        1 - (i.embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM items i
      WHERE i.id != ${itemId}
        AND i.embedding IS NOT NULL
        AND i.processing_status = 'completed'
      ORDER BY i.embedding <=> ${vectorLiteral}::vector
      LIMIT 10
    `);

    // Fetch current item summary (lazy — only loaded when a high-similarity neighbour is found)
    let currentSummary: string | null | undefined = undefined;

    for (const neighbour of neighbours.rows) {
      const sim = neighbour.similarity as number;
      if (sim < 0.7) continue;

      // Always store with lower UUID first to avoid duplicates
      const [idA, idB] = [itemId, neighbour.id].sort();

      await db
        .insert(itemRelations)
        .values({
          itemAId: idA,
          itemBId: idB,
          relationType: 'related',
          similarity: sim,
        })
        .onConflictDoNothing();

      // For very high similarity, do an async contradiction check
      if (sim > 0.92 && neighbour.summary) {
        // Lazy-load current item summary only when needed
        if (currentSummary === undefined) {
          const rows = await db
            .select({ summary: items.summary })
            .from(items)
            .where(eq(items.id, itemId))
            .limit(1);
          currentSummary = rows[0]?.summary ?? null;
        }
        if (currentSummary) {
          // Fire-and-forget: don't await so the embedding worker isn't blocked
          checkContradiction(itemId, neighbour.id, currentSummary, neighbour.summary).catch(
            (err) => console.warn('[embedder] Contradiction check error:', err),
          );
        }
      }
    }

    console.log(
      `[embedder] Populated item_relations for item ${itemId} (${neighbours.rows.length} neighbours checked)`,
    );
  } catch (err) {
    console.warn('[embedder] Failed to populate item_relations:', err);
  }
}

// ---------------------------------------------------------------------------
// content-extraction worker
// ---------------------------------------------------------------------------

export const extractionWorker = new Worker<ExtractionJobData>(
  'content-extraction',
  async (job: Job<ExtractionJobData>) => {
    const { itemId } = job.data;
    const logId = await insertJobLog(itemId, 'content-extraction');

    try {
      // Mark item as processing
      await db
        .update(items)
        .set({ processingStatus: 'processing', updatedAt: new Date() })
        .where(eq(items.id, itemId));

      // Fetch the item to determine source type and URL
      const rows = await db
        .select({
          url: items.url,
          sourceType: items.sourceType,
          title: items.title,
          author: items.author,
          publishedAt: items.publishedAt,
        })
        .from(items)
        .where(eq(items.id, itemId))
        .limit(1);

      if (rows.length === 0) {
        throw new Error(`Item ${itemId} not found`);
      }

      const { url, sourceType, title: existingTitle, author: existingAuthor, publishedAt: existingPublishedAt } = rows[0];

      // Validate URL before calling any extractor
      try {
        new URL(url);
      } catch {
        throw new Error(`Invalid URL for item ${itemId}: ${url}`);
      }

      let rawContent = '';
      let extractedTitle: string | null = null;
      let extractedAuthor: string | null = null;
      let extractedPublishedAt: Date | null = null;

      if (sourceType === 'article') {
        console.log(`[extractor] Extracting article for item ${itemId}: ${url}`);
        const extracted = await extractArticle(url);
        rawContent = extracted.content;
        extractedTitle = extracted.title;
        extractedAuthor = extracted.author;
        extractedPublishedAt = extracted.published_at;

        if (extracted.partial) {
          console.warn(`[extractor] Partial extraction for item ${itemId}: ${extracted.warning}`);
        }
      } else if (sourceType === 'youtube') {
        console.log(`[extractor] Extracting YouTube transcript for item ${itemId}: ${url}`);
        const extracted = await extractYoutube(url);
        rawContent = extracted.content;
        extractedTitle = extracted.title;
        extractedAuthor = extracted.author;
        extractedPublishedAt = extracted.published_at;

        if (extracted.partial) {
          console.warn(`[extractor] Partial extraction for item ${itemId}: ${extracted.warning}`);
        }
      } else if (sourceType === 'reddit') {
        console.log(`[extractor] Extracting Reddit post for item ${itemId}: ${url}`);
        const extracted = await extractReddit(url);
        rawContent = extracted.content;
        extractedTitle = extracted.title;
        extractedAuthor = extracted.author;
        extractedPublishedAt = extracted.published_at;

        if (extracted.partial) {
          console.warn(`[extractor] Partial extraction for item ${itemId}: ${extracted.warning}`);
        }
      } else if (sourceType === 'twitter') {
        console.log(`[extractor] Extracting Twitter/X content for item ${itemId}: ${url}`);
        const extracted = await extractTwitter(url);
        rawContent = extracted.content;
        extractedTitle = extracted.title;
        extractedAuthor = extracted.author;
        extractedPublishedAt = extracted.published_at;

        if (extracted.partial) {
          console.warn(`[extractor] Partial extraction for item ${itemId}: ${extracted.warning}`);
        }
      } else if (sourceType === 'pdf') {
        console.log(`[extractor] Extracting PDF for item ${itemId}: ${url}`);
        const extracted = await extractPdf(url);
        rawContent = extracted.content;
        extractedTitle = extracted.title;
        extractedAuthor = extracted.author;
        extractedPublishedAt = extracted.published_at;

        if (extracted.partial) {
          console.warn(`[extractor] Partial extraction for item ${itemId}: ${extracted.warning}`);
        }
      } else {
        throw new Error(`Unsupported source type: ${sourceType}`);
      }

      // Build the update payload — only set fields that were null and extractor found one
      const updatePayload: {
        rawContent: string;
        updatedAt: Date;
        title?: string;
        author?: string;
        publishedAt?: Date;
      } = { rawContent, updatedAt: new Date() };

      if (!existingTitle && extractedTitle) {
        updatePayload.title = extractedTitle;
      }
      if (!existingAuthor && extractedAuthor) {
        updatePayload.author = extractedAuthor;
      }
      if (!existingPublishedAt && extractedPublishedAt) {
        updatePayload.publishedAt = extractedPublishedAt;
      }

      await db
        .update(items)
        .set(updatePayload)
        .where(eq(items.id, itemId));

      await completeJobLog(logId);

      // Chain to next stage
      await aiProcessingQueue.add('ai-processing', { itemId });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      try {
        await failJobLog(logId, message);
      } catch (logErr) {
        console.error('[queue] Failed to update job_log on failure:', logErr);
      }
      await db
        .update(items)
        .set({ processingStatus: 'failed', updatedAt: new Date() })
        .where(eq(items.id, itemId));
      throw err;
    }
  },
  { connection: redisConnection },
);

// ---------------------------------------------------------------------------
// ai-processing worker
// ---------------------------------------------------------------------------

export const aiProcessingWorker = new Worker<AIProcessingJobData>(
  'ai-processing',
  async (job: Job<AIProcessingJobData>) => {
    const { itemId } = job.data;
    const logId = await insertJobLog(itemId, 'ai-processing');

    try {
      console.log(`[ai-processor] Processing item ${itemId}`);

      // 1. Get item from DB
      const itemRows = await db
        .select({
          url: items.url,
          rawContent: items.rawContent,
          title: items.title,
          categoryId: items.categoryId,
        })
        .from(items)
        .where(eq(items.id, itemId))
        .limit(1);

      if (itemRows.length === 0) {
        throw new Error(`Item ${itemId} not found`);
      }

      const item = itemRows[0];
      const rawContent = item.rawContent ?? '';

      // 2. Get existing categories
      const existingCategories = await db
        .select({ name: categories.name, slug: categories.slug })
        .from(categories);

      // 3. Get popular tags (top 20 by usage_count)
      const popularTagRows = await db
        .select({ name: tags.name })
        .from(tags)
        .orderBy(desc(tags.usageCount))
        .limit(20);
      const popularTags = popularTagRows.map((t) => t.name);

      // 4. Summarize content
      console.log(`[ai-processor] Summarizing item ${itemId}`);
      const summarizeResult = await summarizeContent(rawContent);

      // 5. Categorize content
      console.log(`[ai-processor] Categorizing item ${itemId}`);
      const categorizeResult = await categorizeContent(
        summarizeResult.summary,
        existingCategories,
        popularTags,
      );

      // 6. Resolve category ID
      let resolvedCategoryId: string | null = item.categoryId ?? null;

      if (categorizeResult.isSuggested && categorizeResult.suggestedCategoryName) {
        // 7. Create AI-suggested category
        const suggestedName = categorizeResult.suggestedCategoryName;
        const suggestedSlug = suggestedName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        const newCategoryRows = await db
          .insert(categories)
          .values({
            name: suggestedName,
            slug: suggestedSlug,
            isAiSuggested: true,
          })
          .onConflictDoUpdate({
            target: categories.slug,
            set: { name: suggestedName },
          })
          .returning({ id: categories.id });

        if (newCategoryRows.length > 0) {
          resolvedCategoryId = newCategoryRows[0].id;
          console.log(
            `[ai-processor] Created/resolved AI-suggested category "${suggestedName}" (id: ${resolvedCategoryId})`,
          );
        }
      } else if (categorizeResult.categorySlug && categorizeResult.categorySlug !== 'uncategorized') {
        // Look up existing category by slug
        const matchedCategory = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.slug, categorizeResult.categorySlug))
          .limit(1);

        if (matchedCategory.length > 0) {
          resolvedCategoryId = matchedCategory[0].id;
        }
      }

      // 6. Update item with AI results
      await db
        .update(items)
        .set({
          summary: summarizeResult.summary,
          keyInsights: summarizeResult.keyInsights,
          // Records the summarization model; categorization uses MODELS.categorize (claude-haiku-4-5)
          aiModelUsed: MODELS.summarize,
          contentType: summarizeResult.contentType as 'tutorial' | 'opinion' | 'news' | 'research' | 'reference' | 'discussion',
          difficultyLevel: summarizeResult.difficultyLevel as 'beginner' | 'intermediate' | 'advanced',
          estimatedReadTimeMinutes: summarizeResult.estimatedReadTimeMinutes,
          categoryId: resolvedCategoryId,
          processingStatus: 'ai-complete' as const,
          // Set AI-suggested title only if item has no title
          ...(summarizeResult.suggestedTitle && !item.title
            ? { title: summarizeResult.suggestedTitle }
            : {}),
          updatedAt: new Date(),
        })
        .where(eq(items.id, itemId));

      // 8. Upsert tags and link to item
      for (const tagName of categorizeResult.tags) {
        const tagSlug = tagName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        // Find or create tag, incrementing usage_count on conflict
        const upsertedTagRows = await db
          .insert(tags)
          .values({
            name: tagName,
            slug: tagSlug,
            isAiGenerated: true,
            usageCount: 1,
          })
          .onConflictDoUpdate({
            target: tags.name,
            set: { usageCount: sql`${tags.usageCount} + 1` },
          })
          .returning({ id: tags.id });

        if (upsertedTagRows.length > 0) {
          const tagId = upsertedTagRows[0].id;
          // Insert item_tag association, ignore if already exists
          await db
            .insert(itemTags)
            .values({
              itemId,
              tagId,
              confidence: categorizeResult.confidence,
            })
            .onConflictDoNothing();
        }
      }

      await completeJobLog(logId);

      // Chain to next stage
      await embeddingQueue.add('embedding', { itemId });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      try {
        await failJobLog(logId, message);
      } catch (logErr) {
        console.error('[queue] Failed to update job_log on failure:', logErr);
      }
      await db
        .update(items)
        .set({ processingStatus: 'failed', updatedAt: new Date() })
        .where(eq(items.id, itemId));
      throw err;
    }
  },
  { connection: redisConnection },
);

// ---------------------------------------------------------------------------
// embedding worker
// ---------------------------------------------------------------------------

export const embeddingWorker = new Worker<EmbeddingJobData>(
  'embedding',
  async (job: Job<EmbeddingJobData>) => {
    const { itemId } = job.data;
    const logId = await insertJobLog(itemId, 'embedding');

    try {
      console.log(`[embedder] Processing item ${itemId}`);

      // 1. Get item from DB
      const itemRows = await db
        .select({
          title: items.title,
          summary: items.summary,
          keyInsights: items.keyInsights,
        })
        .from(items)
        .where(eq(items.id, itemId))
        .limit(1);

      if (itemRows.length === 0) {
        throw new Error(`Item ${itemId} not found`);
      }

      const item = itemRows[0];
      const keyInsights = Array.isArray(item.keyInsights) ? (item.keyInsights as string[]) : [];

      // 2. Generate embedding
      const vector = await generateEmbedding(
        item.title ?? null,
        item.summary ?? '',
        keyInsights,
      );

      // 3. Store embedding vector
      await db
        .update(items)
        .set({ embedding: vector, updatedAt: new Date() })
        .where(eq(items.id, itemId));

      // 4. Populate item_relations for nearest neighbours (non-blocking on failure)
      await populateItemRelations(itemId, vector);

      await completeJobLog(logId);

      // Chain to next stage
      await markdownExportQueue.add('markdown-export', { itemId });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      try {
        await failJobLog(logId, message);
      } catch (logErr) {
        console.error('[queue] Failed to update job_log on failure:', logErr);
      }
      await db
        .update(items)
        .set({ processingStatus: 'failed', updatedAt: new Date() })
        .where(eq(items.id, itemId));
      throw err;
    }
  },
  { connection: redisConnection },
);

// ---------------------------------------------------------------------------
// markdown-export worker
// ---------------------------------------------------------------------------

export const markdownExportWorker = new Worker<MarkdownExportJobData>(
  'markdown-export',
  async (job: Job<MarkdownExportJobData>) => {
    const { itemId } = job.data;
    const logId = await insertJobLog(itemId, 'markdown-export');

    try {
      console.log(`[markdown-writer] Processing item ${itemId}`);

      // 1. Get full item from DB with category slug
      const itemRows = await db
        .select({
          ...getTableColumns(items),
          categorySlug: categories.slug,
        })
        .from(items)
        .leftJoin(categories, eq(items.categoryId, categories.id))
        .where(eq(items.id, itemId))
        .limit(1);

      if (itemRows.length === 0) {
        throw new Error(`Item ${itemId} not found`);
      }

      // 2. Fetch tags
      const itemTagRows = await db
        .select({ name: tags.name })
        .from(itemTags)
        .innerJoin(tags, eq(itemTags.tagId, tags.id))
        .where(eq(itemTags.itemId, itemId));

      const row = itemRows[0];
      const fullItem: FullItem = {
        id: row.id,
        title: row.title ?? null,
        url: row.url,
        sourceType: row.sourceType,
        author: row.author ?? null,
        publishedAt: row.publishedAt ?? null,
        createdAt: row.createdAt ?? new Date(),
        captureSource: row.captureSource ?? null,
        categorySlug: row.categorySlug ?? null,
        tags: itemTagRows.map((t) => t.name),
        contentType: row.contentType ?? null,
        difficultyLevel: row.difficultyLevel ?? null,
        estimatedReadTimeMinutes: row.estimatedReadTimeMinutes ?? null,
        summary: row.summary ?? null,
        keyInsights: row.keyInsights,
        rawContent: row.rawContent ?? null,
      };

      // 3. Write markdown file
      const filePath = await writeItemMarkdown(fullItem);

      // 4. Regenerate index (non-critical — log and swallow failures)
      try {
        await regenerateIndex();
      } catch (indexErr) {
        console.error('[markdown-worker] regenerateIndex failed (non-fatal):', indexErr);
      }

      // 5. Mark item as completed and persist the file path
      await db
        .update(items)
        .set({
          processingStatus: 'completed',
          markdownFilePath: filePath,
          updatedAt: new Date(),
        })
        .where(eq(items.id, itemId));

      await completeJobLog(logId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      try {
        await failJobLog(logId, message);
      } catch (logErr) {
        console.error('[queue] Failed to update job_log on failure:', logErr);
      }
      await db
        .update(items)
        .set({ processingStatus: 'failed', updatedAt: new Date() })
        .where(eq(items.id, itemId));
      throw err;
    }
  },
  { connection: redisConnection },
);
