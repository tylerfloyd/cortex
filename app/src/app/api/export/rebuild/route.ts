import { NextRequest, NextResponse } from 'next/server';
import { inArray, eq, getTableColumns } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items, categories, tags, itemTags } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';
import { writeItemMarkdown } from '@/lib/export/markdown';
import { regenerateIndex } from '@/lib/export/index-generator';
import type { FullItem } from '@/lib/export/markdown';

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  // Query all completed items with their category slugs
  const rows = await db
    .select({
      ...getTableColumns(items),
      categorySlug: categories.slug,
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(inArray(items.processingStatus, ['completed', 'ai-complete']));

  if (rows.length === 0) {
    await regenerateIndex();
    return NextResponse.json({ rebuilt: 0, errors: 0 });
  }

  // Fetch tags for all items in one query
  const itemIds = rows.map((r) => r.id);
  const allItemTagRows = await db
    .select({ itemId: itemTags.itemId, name: tags.name })
    .from(itemTags)
    .innerJoin(tags, eq(itemTags.tagId, tags.id))
    .where(inArray(itemTags.itemId, itemIds));

  // Group tags by item ID
  const tagsByItemId = new Map<string, string[]>();
  for (const row of allItemTagRows) {
    const existing = tagsByItemId.get(row.itemId) ?? [];
    existing.push(row.name);
    tagsByItemId.set(row.itemId, existing);
  }

  let rebuilt = 0;
  let errors = 0;
  const errorIds: string[] = [];

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
      await writeItemMarkdown(fullItem);
      rebuilt++;
    } catch (err) {
      console.error(`[rebuild] Failed to write markdown for item ${row.id}:`, err);
      errors++;
      errorIds.push(row.id);
    }
  }

  await regenerateIndex();

  return NextResponse.json({ rebuilt, errors, errorIds });
}
