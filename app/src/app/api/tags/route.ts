import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { tags, itemTags } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';

export async function GET(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      isAiGenerated: tags.isAiGenerated,
      usageCount: sql<number>`count(${itemTags.tagId})::int`,
      createdAt: tags.createdAt,
    })
    .from(tags)
    .leftJoin(itemTags, sql`${itemTags.tagId} = ${tags.id}`)
    .groupBy(tags.id, tags.name, tags.slug, tags.isAiGenerated, tags.createdAt)
    .orderBy(sql`count(${itemTags.tagId}) desc`, tags.name);

  return NextResponse.json({ tags: rows });
}
