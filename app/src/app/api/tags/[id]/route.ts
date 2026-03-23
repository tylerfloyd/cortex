import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tags, itemTags } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const { id } = await params;

  const existing = await db
    .select({ id: tags.id })
    .from(tags)
    .where(eq(tags.id, id))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }

  // item_tags has onDelete: cascade, so deleting the tag removes references automatically
  await db.delete(tags).where(eq(tags.id, id));

  return NextResponse.json({ deleted: true, id });
}
