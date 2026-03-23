import { NextRequest, NextResponse } from 'next/server';
import { eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { items, categories, tags, itemTags } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';
import { deleteItemMarkdown } from '@/lib/export/markdown';
import { regenerateIndex } from '@/lib/export/index-generator';
import { extractionQueue } from '@/lib/queue/queues';

const bulkSchema = z.object({
  action: z.enum(['categorize', 'tag', 'delete', 'reprocess']),
  item_ids: z.array(z.string().uuid()).min(1).max(500),
  category_slug: z.string().optional(),
  tags_to_add: z.array(z.string()).optional(),
  tags_to_remove: z.array(z.string()).optional(),
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

  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { action, item_ids, category_slug, tags_to_add, tags_to_remove } = parsed.data;

  // ── categorize ──────────────────────────────────────────────────────────────
  if (action === 'categorize') {
    if (!category_slug && category_slug !== '') {
      return NextResponse.json(
        { error: 'category_slug is required for categorize action' },
        { status: 400 }
      );
    }

    let newCategoryId: string | null = null;
    if (category_slug !== '') {
      const catRows = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, category_slug))
        .limit(1);
      if (catRows.length === 0) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
      newCategoryId = catRows[0].id;
    }

    await db
      .update(items)
      .set({ categoryId: newCategoryId, updatedAt: new Date() })
      .where(inArray(items.id, item_ids));

    return NextResponse.json({ success: true, updated: item_ids.length });
  }

  // ── tag ─────────────────────────────────────────────────────────────────────
  if (action === 'tag') {
    // Add tags
    if (tags_to_add && tags_to_add.length > 0) {
      for (const tagName of tags_to_add) {
        const slug = tagName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');

        let tagId: string;
        const tagRow = await db
          .select({ id: tags.id })
          .from(tags)
          .where(eq(tags.slug, slug))
          .limit(1);

        if (tagRow.length === 0) {
          const inserted = await db
            .insert(tags)
            .values({ name: tagName, slug, isAiGenerated: false })
            .returning({ id: tags.id });
          tagId = inserted[0].id;
        } else {
          tagId = tagRow[0].id;
        }

        const values = item_ids.map((itemId) => ({ itemId, tagId }));
        await db.insert(itemTags).values(values).onConflictDoNothing();
      }
    }

    // Remove tags
    if (tags_to_remove && tags_to_remove.length > 0) {
      const slugsToRemove = tags_to_remove.map((t) =>
        t.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      );
      const tagRowsToRemove = await db
        .select({ id: tags.id })
        .from(tags)
        .where(inArray(tags.slug, slugsToRemove));

      if (tagRowsToRemove.length > 0) {
        const tagIdsToRemove = tagRowsToRemove.map((t) => t.id);
        // Delete rows where item_id IN (...) AND tag_id IN (...)
        await db
          .delete(itemTags)
          .where(
            sql`${itemTags.itemId} = ANY(${item_ids}::uuid[]) AND ${itemTags.tagId} = ANY(${tagIdsToRemove}::uuid[])`
          );
      }
    }

    return NextResponse.json({ success: true, updated: item_ids.length });
  }

  // ── delete ──────────────────────────────────────────────────────────────────
  if (action === 'delete') {
    const existingItems = await db
      .select({ id: items.id, markdownFilePath: items.markdownFilePath })
      .from(items)
      .where(inArray(items.id, item_ids));

    await db.delete(items).where(inArray(items.id, item_ids));

    let anyMarkdown = false;
    for (const item of existingItems) {
      if (item.markdownFilePath) {
        anyMarkdown = true;
        try {
          await deleteItemMarkdown(item.markdownFilePath);
        } catch (err) {
          console.warn(`[bulk delete] Could not remove markdown file ${item.markdownFilePath}:`, err);
        }
      }
    }

    if (anyMarkdown) {
      try {
        await regenerateIndex();
      } catch (err) {
        console.warn('[bulk delete] Could not regenerate index:', err);
      }
    }

    return NextResponse.json({ success: true, deleted: existingItems.length });
  }

  // ── reprocess ────────────────────────────────────────────────────────────────
  if (action === 'reprocess') {
    await db
      .update(items)
      .set({ processingStatus: 'pending', updatedAt: new Date() })
      .where(inArray(items.id, item_ids));

    for (const itemId of item_ids) {
      await extractionQueue.add('reprocess', { itemId });
    }

    return NextResponse.json({ success: true, enqueued: item_ids.length });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
