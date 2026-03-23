import { NextRequest, NextResponse } from 'next/server';
import { eq, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items, itemRelations } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const { id } = await params;

  // Check the item exists
  const existing = await db
    .select({ id: items.id })
    .from(items)
    .where(eq(items.id, id))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  // Fetch all relations involving this item
  const relationRows = await db
    .select({
      itemAId: itemRelations.itemAId,
      itemBId: itemRelations.itemBId,
      similarity: itemRelations.similarity,
      relationType: itemRelations.relationType,
    })
    .from(itemRelations)
    .where(
      or(
        eq(itemRelations.itemAId, id),
        eq(itemRelations.itemBId, id),
      )
    );

  if (relationRows.length === 0) {
    return NextResponse.json([]);
  }

  // Collect the neighbour IDs and their relation info
  const neighbourMap = new Map<string, { similarity: number | null; relationType: string }>();
  for (const rel of relationRows) {
    const neighbourId = rel.itemAId === id ? rel.itemBId : rel.itemAId;
    neighbourMap.set(neighbourId, {
      similarity: rel.similarity,
      relationType: rel.relationType,
    });
  }

  const neighbourIds = [...neighbourMap.keys()];

  // Fetch item details for all neighbours
  const neighbourRows = await db
    .select({
      id: items.id,
      title: items.title,
      url: items.url,
      sourceType: items.sourceType,
      summary: items.summary,
    })
    .from(items)
    .where(sql`${items.id} = ANY(${neighbourIds}::uuid[])`);

  const result = neighbourRows
    .map((row) => {
      const rel = neighbourMap.get(row.id)!;
      return {
        id: row.id,
        title: row.title,
        url: row.url,
        sourceType: row.sourceType,
        summary: row.summary,
        similarity: rel.similarity,
        relationType: rel.relationType,
      };
    })
    .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));

  return NextResponse.json(result);
}
