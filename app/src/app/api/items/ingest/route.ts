import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items, categories, tags, itemTags } from '@/lib/db/schema';
import { extractionQueue } from '@/lib/queue/queues';
import { validateApiKey } from '@/lib/auth/api-key';

const ingestSchema = z.object({
  url: z.string().url().refine(
    (url) => url.startsWith('http://') || url.startsWith('https://'),
    { message: 'URL must use HTTP or HTTPS protocol' }
  ),
  capture_source: z.enum(['discord', 'extension', 'dashboard', 'api']),
  category_slug: z.string().optional(),
  tags: z.array(z.string()).optional(),
  user_notes: z.string().optional(),
  discord_channel: z.string().optional(),
});

function detectSourceType(url: string): string {
  if (/youtube\.com\/watch|youtu\.be\//.test(url)) return 'youtube';
  if (/twitter\.com\/|x\.com\//.test(url)) return 'twitter';
  if (/reddit\.com\/r\//.test(url)) return 'reddit';
  if (/\.pdf$/i.test(url.split('?')[0])) return 'pdf';
  return 'article';
}

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { url, capture_source, category_slug, user_notes, discord_channel } = parsed.data;

  const sourceType = detectSourceType(url);

  // Resolve category_id if category_slug provided
  let categoryId: string | null = null;
  if (category_slug) {
    const category = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, category_slug))
      .limit(1);

    if (category.length > 0) {
      categoryId = category[0].id;
    }
  }

  let inserted: { id: string; processingStatus: string | null };
  let appliedTags: string[] = [];

  try {
    inserted = await db.transaction(async (tx) => {
      const [newItem] = await tx
        .insert(items)
        .values({
          url,
          sourceType,
          captureSource: capture_source,
          categoryId: categoryId ?? undefined,
          userNotes: user_notes,
          discordChannel: discord_channel,
          processingStatus: 'pending',
        })
        .returning({ id: items.id, processingStatus: items.processingStatus });

      // Associate pre-set tags with the item (batched)
      if (parsed.data.tags && parsed.data.tags.length > 0) {
        const slugArray = parsed.data.tags;
        const matchedTags = await tx
          .select({ id: tags.id, slug: tags.slug })
          .from(tags)
          .where(inArray(tags.slug, slugArray));

        if (matchedTags.length > 0) {
          await tx.insert(itemTags).values(
            matchedTags.map((tag) => ({
              itemId: newItem.id,
              tagId: tag.id,
              confidence: null,
            }))
          );
          appliedTags = matchedTags.map((tag) => tag.slug);
        }
      }

      return newItem;
    });
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === '23505'
    ) {
      return NextResponse.json(
        { error: 'Item already exists' },
        { status: 409 }
      );
    }
    throw err;
  }

  // Enqueue extraction job after transaction commits
  await extractionQueue.add('extract', { itemId: inserted.id });

  return NextResponse.json(
    { id: inserted.id, status: 'queued', source_type: sourceType, applied_tags: appliedTags },
    { status: 201 }
  );
}
