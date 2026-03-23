import { NextRequest, NextResponse } from 'next/server';
import { eq, getTableColumns, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items, categories, tags, itemTags } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';

export async function GET(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  // Export all categories
  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(categories.name);

  // Export all tags
  const allTags = await db
    .select()
    .from(tags)
    .orderBy(tags.name);

  // Export all items (exclude embedding vector — too large and not useful for backup)
  const allItems = await db
    .select({
      id: items.id,
      url: items.url,
      sourceType: items.sourceType,
      title: items.title,
      author: items.author,
      publishedAt: items.publishedAt,
      rawContent: items.rawContent,
      summary: items.summary,
      keyInsights: items.keyInsights,
      categoryId: items.categoryId,
      aiModelUsed: items.aiModelUsed,
      contentType: items.contentType,
      difficultyLevel: items.difficultyLevel,
      estimatedReadTimeMinutes: items.estimatedReadTimeMinutes,
      processingStatus: items.processingStatus,
      captureSource: items.captureSource,
      discordChannel: items.discordChannel,
      userNotes: items.userNotes,
      isFavorite: items.isFavorite,
      readCount: items.readCount,
      markdownFilePath: items.markdownFilePath,
      createdAt: items.createdAt,
      updatedAt: items.updatedAt,
    })
    .from(items)
    .orderBy(items.createdAt);

  // Export item-tag associations
  const allItemTags = await db
    .select({
      itemId: itemTags.itemId,
      tagId: itemTags.tagId,
      confidence: itemTags.confidence,
    })
    .from(itemTags);

  const exportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    categories: allCategories,
    tags: allTags,
    items: allItems,
    itemTags: allItemTags,
  };

  const json = JSON.stringify(exportData, null, 2);

  return new NextResponse(json, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="cortex-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
