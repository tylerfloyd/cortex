import { NextRequest, NextResponse } from 'next/server';
import { eq, gte, sql, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items, categories } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';

export async function GET(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Total completed items
  const [totalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(items)
    .where(eq(items.processingStatus, 'completed'));

  // Items this week (completed, created in last 7 days)
  const [weekRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(items)
    .where(
      sql`${items.processingStatus} = 'completed' AND ${items.createdAt} >= ${sevenDaysAgo}`
    );

  // Top category
  const topCategoryRows = await db
    .select({
      name: categories.name,
      slug: categories.slug,
      count: sql<number>`count(${items.id})::int`,
    })
    .from(items)
    .innerJoin(categories, eq(items.categoryId, categories.id))
    .where(eq(items.processingStatus, 'completed'))
    .groupBy(categories.id, categories.name, categories.slug)
    .orderBy(desc(sql`count(${items.id})`))
    .limit(1);

  // Source type breakdown (completed items)
  const sourceTypeRows = await db
    .select({
      sourceType: items.sourceType,
      count: sql<number>`count(*)::int`,
    })
    .from(items)
    .where(eq(items.processingStatus, 'completed'))
    .groupBy(items.sourceType);

  const bySourceType: Record<string, number> = {};
  for (const row of sourceTypeRows) {
    bySourceType[row.sourceType] = row.count;
  }

  const topCategory = topCategoryRows.length > 0
    ? { name: topCategoryRows[0].name, count: topCategoryRows[0].count, slug: topCategoryRows[0].slug }
    : null;

  return NextResponse.json({
    total: totalRow.count,
    this_week: weekRow.count,
    top_category: topCategory,
    by_source_type: bySourceType,
  });
}
