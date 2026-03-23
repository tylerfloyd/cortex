import { eq, and, isNull, inArray, getTableColumns } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items, categories, tags, itemTags } from '@/lib/db/schema';
import { writeItemMarkdown } from './markdown';
import { regenerateIndex } from './index-generator';
import type { FullItem } from './markdown';

/**
 * Finds completed items that are missing a markdown file and writes them.
 * This acts as a safety net for cases where the BullMQ markdown-export worker
 * succeeded in updating `processing_status` to 'completed' but failed to
 * persist the `markdown_file_path` (e.g. the process was killed mid-write).
 */
export async function syncMissingMarkdown(): Promise<void> {
  const rows = await db
    .select({
      ...getTableColumns(items),
      categorySlug: categories.slug,
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(
      and(
        eq(items.processingStatus, 'completed'),
        isNull(items.markdownFilePath),
      ),
    );

  if (rows.length === 0) {
    return;
  }

  console.log(`[markdown-sync] Found ${rows.length} completed item(s) missing markdown files`);

  // Fetch tags for all items in one query
  const itemIds = rows.map((r) => r.id);
  const allItemTagRows =
    itemIds.length > 0
      ? await db
          .select({ itemId: itemTags.itemId, name: tags.name })
          .from(itemTags)
          .innerJoin(tags, eq(itemTags.tagId, tags.id))
          .where(inArray(itemTags.itemId, itemIds))
      : [];

  const tagsByItemId = new Map<string, string[]>();
  for (const row of allItemTagRows) {
    const existing = tagsByItemId.get(row.itemId) ?? [];
    existing.push(row.name);
    tagsByItemId.set(row.itemId, existing);
  }

  let written = 0;

  for (const row of rows) {
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
      tags: tagsByItemId.get(row.id) ?? [],
      contentType: row.contentType ?? null,
      difficultyLevel: row.difficultyLevel ?? null,
      estimatedReadTimeMinutes: row.estimatedReadTimeMinutes ?? null,
      summary: row.summary ?? null,
      keyInsights: row.keyInsights,
      rawContent: row.rawContent ?? null,
    };

    try {
      const filePath = await writeItemMarkdown(fullItem);
      await db
        .update(items)
        .set({ markdownFilePath: filePath, updatedAt: new Date() })
        .where(eq(items.id, row.id));
      written++;
      console.log(`[markdown-sync] Wrote markdown for item ${row.id}: ${filePath}`);
    } catch (err) {
      console.error(`[markdown-sync] Failed to write markdown for item ${row.id}:`, err);
    }
  }

  if (written > 0) {
    await regenerateIndex();
    console.log(`[markdown-sync] Regenerated index after writing ${written} file(s)`);
  }
}

/**
 * Starts a periodic sync that runs once at startup and then every `intervalMs`
 * milliseconds (default: 5 minutes). Returns the interval handle so callers
 * can cancel it on shutdown.
 */
export function startMarkdownSync(intervalMs = 5 * 60 * 1000): NodeJS.Timeout {
  // Run once immediately at startup
  syncMissingMarkdown().catch((err) => {
    console.error('[markdown-sync] Initial sync failed:', err);
  });

  return setInterval(() => {
    syncMissingMarkdown().catch((err) => {
      console.error('[markdown-sync] Periodic sync failed:', err);
    });
  }, intervalMs);
}
