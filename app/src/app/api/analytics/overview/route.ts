import { NextResponse } from 'next/server';
import { eq, sql, desc, gt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items, categories, tags } from '@/lib/db/schema';

function estimateCost(itemRows: { aiModelUsed: string | null }[]): number {
  let cost = 0;
  for (const item of itemRows) {
    const model = item.aiModelUsed ?? 'anthropic/claude-haiku-4-5';
    // Summarization: ~2000 input + 500 output tokens
    if (model.includes('sonnet')) {
      cost += (2000 * 3 + 500 * 15) / 1_000_000; // ~$0.0135/item
    } else {
      cost += (2000 * 0.8 + 500 * 4) / 1_000_000; // ~$0.0036/item
    }
    // Categorization (haiku): ~500 input + 50 output
    cost += (500 * 0.8 + 50 * 4) / 1_000_000;
    // Embedding: ~500 tokens
    cost += (500 * 0.02) / 1_000_000;
  }
  return Math.round(cost * 100) / 100;
}

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total items
    const [totalRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(items);

    // Items this week
    const [weekRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(items)
      .where(gt(items.createdAt, sevenDaysAgo));

    // Items this month
    const [monthRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(items)
      .where(gt(items.createdAt, startOfMonth));

    // By source type
    const sourceTypeRows = await db
      .select({
        source_type: items.sourceType,
        count: sql<number>`count(*)::int`,
      })
      .from(items)
      .groupBy(items.sourceType)
      .orderBy(desc(sql`count(*)`));

    // By category
    const categoryRows = await db
      .select({
        name: categories.name,
        color: categories.color,
        count: sql<number>`count(${items.id})::int`,
      })
      .from(items)
      .innerJoin(categories, eq(items.categoryId, categories.id))
      .groupBy(categories.id, categories.name, categories.color)
      .orderBy(desc(sql`count(${items.id})`))
      .limit(15);

    // Items by date (last 30 days)
    const itemsByDateRows = await db
      .select({
        date: sql<string>`date_trunc('day', ${items.createdAt})::date::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(items)
      .where(gt(items.createdAt, thirtyDaysAgo))
      .groupBy(sql`date_trunc('day', ${items.createdAt})`)
      .orderBy(sql`date_trunc('day', ${items.createdAt})`);

    // Top tags
    const topTagRows = await db
      .select({
        name: tags.name,
        slug: tags.slug,
        count: tags.usageCount,
      })
      .from(tags)
      .where(gt(tags.usageCount, 0))
      .orderBy(desc(tags.usageCount))
      .limit(30);

    // Read stats
    const readStatsRows = await db
      .select({
        total_saved: sql<number>`count(*)::int`,
        total_read: sql<number>`count(*) filter (where ${items.readCount} > 0)::int`,
      })
      .from(items);

    const { total_saved, total_read } = readStatsRows[0];
    const read_rate = total_saved > 0 ? Math.round((total_read / total_saved) * 100) / 100 : 0;

    // Cost estimation — fetch all processed items with their AI model
    const processedItems = await db
      .select({ aiModelUsed: items.aiModelUsed })
      .from(items)
      .where(eq(items.processingStatus, 'completed'));

    const estimated_cost_usd = estimateCost(processedItems);

    return NextResponse.json({
      total_items: totalRow.count,
      items_this_week: weekRow.count,
      items_this_month: monthRow.count,
      by_source_type: sourceTypeRows,
      by_category: categoryRows,
      items_by_date: itemsByDateRows,
      top_tags: topTagRows,
      read_stats: {
        total_saved,
        total_read,
        read_rate,
      },
      estimated_cost_usd,
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
