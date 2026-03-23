import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { items, categories, tags, itemTags } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';

// Loose schema — we allow extra fields and use partial validation
const categorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  isAiSuggested: z.boolean().optional(),
  createdAt: z.string().optional(),
});

const tagSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  isAiGenerated: z.boolean().optional(),
  usageCount: z.number().optional(),
  createdAt: z.string().optional(),
});

const itemSchema = z.object({
  id: z.string().uuid(),
  url: z.string(),
  sourceType: z.string(),
  title: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  rawContent: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  keyInsights: z.unknown().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  aiModelUsed: z.string().nullable().optional(),
  contentType: z.string().nullable().optional(),
  difficultyLevel: z.string().nullable().optional(),
  estimatedReadTimeMinutes: z.number().nullable().optional(),
  processingStatus: z.string().nullable().optional(),
  captureSource: z.string().nullable().optional(),
  discordChannel: z.string().nullable().optional(),
  userNotes: z.string().nullable().optional(),
  isFavorite: z.boolean().optional(),
  readCount: z.number().optional(),
  markdownFilePath: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const itemTagSchema = z.object({
  itemId: z.string().uuid(),
  tagId: z.string().uuid(),
  confidence: z.number().nullable().optional(),
});

const importSchema = z.object({
  version: z.number().optional(),
  categories: z.array(categorySchema).optional().default([]),
  tags: z.array(tagSchema).optional().default([]),
  items: z.array(itemSchema).optional().default([]),
  itemTags: z.array(itemTagSchema).optional().default([]),
});

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  let rawData: unknown;

  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    const text = await (file as File).text();
    try {
      rawData = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in uploaded file' }, { status: 400 });
    }
  } else {
    try {
      rawData = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  }

  const parsed = importSchema.safeParse(rawData);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid import format', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const stats = {
    categories: { imported: 0, skipped: 0 },
    tags: { imported: 0, skipped: 0 },
    items: { imported: 0, skipped: 0 },
    itemTags: { imported: 0, skipped: 0 },
  };

  // Import categories (skip duplicates by id or name)
  for (const cat of data.categories) {
    try {
      await db.insert(categories).values({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description ?? null,
        color: cat.color ?? null,
        parentId: cat.parentId ?? null,
        isAiSuggested: cat.isAiSuggested ?? false,
      }).onConflictDoNothing();
      stats.categories.imported++;
    } catch {
      stats.categories.skipped++;
    }
  }

  // Import tags
  for (const tag of data.tags) {
    try {
      await db.insert(tags).values({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        isAiGenerated: tag.isAiGenerated ?? true,
        usageCount: tag.usageCount ?? 0,
      }).onConflictDoNothing();
      stats.tags.imported++;
    } catch {
      stats.tags.skipped++;
    }
  }

  // Import items
  for (const item of data.items) {
    try {
      await db.insert(items).values({
        id: item.id,
        url: item.url,
        sourceType: item.sourceType,
        title: item.title ?? null,
        author: item.author ?? null,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
        rawContent: item.rawContent ?? null,
        summary: item.summary ?? null,
        keyInsights: item.keyInsights ?? [],
        categoryId: item.categoryId ?? null,
        aiModelUsed: item.aiModelUsed ?? null,
        contentType: item.contentType as typeof items.$inferInsert['contentType'] ?? null,
        difficultyLevel: item.difficultyLevel as typeof items.$inferInsert['difficultyLevel'] ?? null,
        estimatedReadTimeMinutes: item.estimatedReadTimeMinutes ?? null,
        processingStatus: item.processingStatus as typeof items.$inferInsert['processingStatus'] ?? 'pending',
        captureSource: item.captureSource ?? null,
        discordChannel: item.discordChannel ?? null,
        userNotes: item.userNotes ?? null,
        isFavorite: item.isFavorite ?? false,
        readCount: item.readCount ?? 0,
        markdownFilePath: item.markdownFilePath ?? null,
        createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
      }).onConflictDoNothing();
      stats.items.imported++;
    } catch {
      stats.items.skipped++;
    }
  }

  // Import item-tag associations
  for (const it of data.itemTags) {
    try {
      await db.insert(itemTags).values({
        itemId: it.itemId,
        tagId: it.tagId,
        confidence: it.confidence ?? null,
      }).onConflictDoNothing();
      stats.itemTags.imported++;
    } catch {
      stats.itemTags.skipped++;
    }
  }

  return NextResponse.json({ imported: true, stats });
}
