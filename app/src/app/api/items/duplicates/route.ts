import { NextRequest, NextResponse } from 'next/server';
import { and, eq, gt, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items, categories, itemRelations } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';

const SIMILARITY_THRESHOLD = 0.95;

export async function GET(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  // Find item_relations where similarity > 0.95
  const pairs = await db
    .select({
      relationId: itemRelations.id,
      itemAId: itemRelations.itemAId,
      itemBId: itemRelations.itemBId,
      similarity: itemRelations.similarity,
    })
    .from(itemRelations)
    .where(
      and(
        eq(itemRelations.relationType, 'similar'),
        gt(itemRelations.similarity, SIMILARITY_THRESHOLD)
      )
    )
    .orderBy(sql`${itemRelations.similarity} DESC`)
    .limit(200);

  if (pairs.length === 0) {
    return NextResponse.json({ duplicates: [] });
  }

  // Collect all unique item IDs
  const itemIdSet = new Set<string>();
  for (const p of pairs) {
    itemIdSet.add(p.itemAId);
    itemIdSet.add(p.itemBId);
  }
  const allItemIds = Array.from(itemIdSet);

  // Fetch item details for all involved items
  const itemRows = await db
    .select({
      id: items.id,
      title: items.title,
      url: items.url,
      sourceType: items.sourceType,
      summary: items.summary,
      createdAt: items.createdAt,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(sql`${items.id} = ANY(${allItemIds}::uuid[])`);

  const itemMap = new Map(itemRows.map((r) => [r.id, r]));

  const duplicates = pairs
    .map((p) => {
      const itemA = itemMap.get(p.itemAId);
      const itemB = itemMap.get(p.itemBId);
      if (!itemA || !itemB) return null;
      return {
        similarity: p.similarity,
        itemA,
        itemB,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ duplicates });
}
