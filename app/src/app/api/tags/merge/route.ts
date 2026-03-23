import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { tags, itemTags } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';

const mergeSchema = z.object({
  source_id: z.string().uuid(),
  target_id: z.string().uuid(),
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

  const parsed = mergeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { source_id, target_id } = parsed.data;

  if (source_id === target_id) {
    return NextResponse.json(
      { error: 'Source and target tags must be different' },
      { status: 400 },
    );
  }

  // Validate both tags exist
  const [source, target] = await Promise.all([
    db.select({ id: tags.id, name: tags.name }).from(tags).where(eq(tags.id, source_id)).limit(1),
    db.select({ id: tags.id, name: tags.name }).from(tags).where(eq(tags.id, target_id)).limit(1),
  ]);

  if (source.length === 0) {
    return NextResponse.json({ error: 'Source tag not found' }, { status: 404 });
  }
  if (target.length === 0) {
    return NextResponse.json({ error: 'Target tag not found' }, { status: 404 });
  }

  // Get all item_tags for source tag
  const sourceItemTags = await db
    .select({ itemId: itemTags.itemId })
    .from(itemTags)
    .where(eq(itemTags.tagId, source_id));

  // For each item that had the source tag, add target tag if not already present
  for (const { itemId } of sourceItemTags) {
    const existingTargetTag = await db
      .select({ itemId: itemTags.itemId })
      .from(itemTags)
      .where(and(eq(itemTags.itemId, itemId), eq(itemTags.tagId, target_id)))
      .limit(1);

    if (existingTargetTag.length === 0) {
      await db.insert(itemTags).values({ itemId, tagId: target_id });
    }
  }

  // Delete source tag (cascades to item_tags for source)
  await db.delete(tags).where(eq(tags.id, source_id));

  return NextResponse.json({
    merged: true,
    source: source[0],
    target: target[0],
    items_updated: sourceItemTags.length,
  });
}
