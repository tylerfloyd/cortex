import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items, categories, tags, itemTags } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';
import { deleteItemMarkdown, moveItemMarkdown, getCategoryFolder, writeItemMarkdown } from '@/lib/export/markdown';
import type { FullItem } from '@/lib/export/markdown';
import { regenerateIndex } from '@/lib/export/index-generator';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const { id } = await params;

  const rows = await db
    .select({
      id: items.id,
      url: items.url,
      sourceType: items.sourceType,
      title: items.title,
      author: items.author,
      publishedAt: items.publishedAt,
      summary: items.summary,
      keyInsights: items.keyInsights,
      categoryId: items.categoryId,
      aiModelUsed: items.aiModelUsed,
      processingStatus: items.processingStatus,
      captureSource: items.captureSource,
      discordChannel: items.discordChannel,
      userNotes: items.userNotes,
      isFavorite: items.isFavorite,
      readCount: items.readCount,
      createdAt: items.createdAt,
      updatedAt: items.updatedAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryColor: categories.color,
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(eq(items.id, id))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  const item = rows[0];

  // Fetch associated tags
  const itemTagRows = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
    })
    .from(itemTags)
    .innerJoin(tags, eq(itemTags.tagId, tags.id))
    .where(eq(itemTags.itemId, id));

  const category =
    item.categoryId
      ? {
          id: item.categoryId,
          name: item.categoryName,
          slug: item.categorySlug,
          color: item.categoryColor,
        }
      : null;

  return NextResponse.json({
    id: item.id,
    url: item.url,
    sourceType: item.sourceType,
    title: item.title,
    author: item.author,
    publishedAt: item.publishedAt,
    summary: item.summary,
    keyInsights: item.keyInsights,
    aiModelUsed: item.aiModelUsed,
    processingStatus: item.processingStatus,
    captureSource: item.captureSource,
    discordChannel: item.discordChannel,
    userNotes: item.userNotes,
    isFavorite: item.isFavorite,
    readCount: item.readCount,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    category,
    tags: itemTagRows,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const { id } = await params;

  const existing = await db
    .select({ id: items.id, markdownFilePath: items.markdownFilePath })
    .from(items)
    .where(eq(items.id, id))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  const markdownFilePath = existing[0].markdownFilePath;

  await db.delete(items).where(eq(items.id, id));

  // Delete the markdown file if one was written
  if (markdownFilePath) {
    try {
      await deleteItemMarkdown(markdownFilePath);
    } catch (err) {
      // Log but do not fail the request if the file was already missing
      console.warn(`[delete] Could not remove markdown file ${markdownFilePath}:`, err);
    }
    try {
      await regenerateIndex();
    } catch (err) {
      console.warn('[delete] Could not regenerate index after markdown removal:', err);
    }
  }

  return new NextResponse(null, { status: 204 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const { id } = await params;

  const existing = await db
    .select({
      id: items.id,
      markdownFilePath: items.markdownFilePath,
      title: items.title,
      categoryId: items.categoryId,
    })
    .from(items)
    .where(eq(items.id, id))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  let body: {
    category_slug?: string;
    tags_to_add?: string[];
    tags_to_remove?: string[];
    user_notes?: string;
    is_favorite?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Update item fields
  const updateData: Partial<typeof items.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (body.user_notes !== undefined) {
    updateData.userNotes = body.user_notes;
  }

  if (body.is_favorite !== undefined) {
    updateData.isFavorite = body.is_favorite;
  }

  if (body.category_slug !== undefined) {
    if (body.category_slug === null || body.category_slug === '') {
      updateData.categoryId = null;
    } else {
      const catRows = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, body.category_slug))
        .limit(1);
      if (catRows.length === 0) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
      updateData.categoryId = catRows[0].id;
    }
  }

  const oldMarkdownFilePath = existing[0].markdownFilePath;
  const oldCategoryId = existing[0].categoryId;
  const categoryChanged =
    body.category_slug !== undefined && updateData.categoryId !== oldCategoryId;

  await db.update(items).set(updateData).where(eq(items.id, id));

  // If category changed and the item has a markdown file, move it to the new folder
  if (categoryChanged && oldMarkdownFilePath) {
    try {
      const newCategorySlug = body.category_slug || 'uncategorized';
      const newDir = getCategoryFolder(newCategorySlug);
      const fileName = path.basename(oldMarkdownFilePath);
      const newFilePath = path.join(newDir, fileName);

      await moveItemMarkdown(oldMarkdownFilePath, newFilePath);

      // Update the stored path in DB
      await db
        .update(items)
        .set({ markdownFilePath: newFilePath })
        .where(eq(items.id, id));
    } catch (err) {
      console.warn(`[patch] Could not move markdown file for item ${id}:`, err);
    }
    try {
      await regenerateIndex();
    } catch (err) {
      console.warn('[patch] Could not regenerate index after category change:', err);
    }
  }

  // Handle tag additions
  if (body.tags_to_add && body.tags_to_add.length > 0) {
    for (const tagName of body.tags_to_add) {
      const slug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      // Upsert tag
      const tagRow = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.slug, slug))
        .limit(1);

      let tagId: string;
      if (tagRow.length === 0) {
        const inserted = await db
          .insert(tags)
          .values({ name: tagName, slug, isAiGenerated: false })
          .returning({ id: tags.id });
        tagId = inserted[0].id;
      } else {
        tagId = tagRow[0].id;
      }

      // Insert item_tag if not already present (ignore conflict)
      await db
        .insert(itemTags)
        .values({ itemId: id, tagId })
        .onConflictDoNothing();
    }
  }

  // Handle tag removals
  if (body.tags_to_remove && body.tags_to_remove.length > 0) {
    const slugsToRemove = body.tags_to_remove.map((t) =>
      t.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    );
    const tagRowsToRemove = await db
      .select({ id: tags.id })
      .from(tags)
      .where(inArray(tags.slug, slugsToRemove));

    if (tagRowsToRemove.length > 0) {
      const tagIdsToRemove = tagRowsToRemove.map((t) => t.id);
      await db
        .delete(itemTags)
        .where(and(eq(itemTags.itemId, id), inArray(itemTags.tagId, tagIdsToRemove)));
    }
  }

  // Re-generate the markdown file with the latest data (spec: "On item change: regenerate the corresponding markdown file")
  try {
    // Re-fetch the item with all fields needed by writeItemMarkdown
    const updatedRows = await db
      .select({
        id: items.id,
        title: items.title,
        url: items.url,
        sourceType: items.sourceType,
        author: items.author,
        publishedAt: items.publishedAt,
        createdAt: items.createdAt,
        captureSource: items.captureSource,
        contentType: items.contentType,
        difficultyLevel: items.difficultyLevel,
        estimatedReadTimeMinutes: items.estimatedReadTimeMinutes,
        summary: items.summary,
        keyInsights: items.keyInsights,
        rawContent: items.rawContent,
        markdownFilePath: items.markdownFilePath,
        categorySlug: categories.slug,
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(eq(items.id, id))
      .limit(1);

    if (updatedRows.length > 0) {
      const row = updatedRows[0];

      // Fetch current tags for this item
      const currentTagRows = await db
        .select({ name: tags.name })
        .from(itemTags)
        .innerJoin(tags, eq(itemTags.tagId, tags.id))
        .where(eq(itemTags.itemId, id));

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
        tags: currentTagRows.map((t) => t.name),
        contentType: row.contentType ?? null,
        difficultyLevel: row.difficultyLevel ?? null,
        estimatedReadTimeMinutes: row.estimatedReadTimeMinutes ?? null,
        summary: row.summary ?? null,
        keyInsights: row.keyInsights,
        rawContent: row.rawContent ?? null,
      };

      const writtenPath = await writeItemMarkdown(fullItem);

      // Persist the markdown file path if it changed (e.g. first write or rename)
      if (writtenPath !== row.markdownFilePath) {
        await db
          .update(items)
          .set({ markdownFilePath: writtenPath })
          .where(eq(items.id, id));
      }

      // Regenerate index if markdown was written (category may not have changed,
      // but content definitely changed)
      if (!categoryChanged) {
        await regenerateIndex();
      }
    }
  } catch (err) {
    console.warn(`[patch] Could not regenerate markdown for item ${id}:`, err);
  }

  return NextResponse.json({ success: true });
}
