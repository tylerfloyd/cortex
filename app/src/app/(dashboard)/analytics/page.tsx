import { eq, sql, desc, gt } from 'drizzle-orm'
import { db } from '@/lib/db'
import { items, categories, tags } from '@/lib/db/schema'
import { AnalyticsDashboard, type AnalyticsData } from '@/components/analytics/AnalyticsDashboard'

function estimateCost(itemRows: { aiModelUsed: string | null }[]): number {
  let cost = 0
  for (const item of itemRows) {
    const model = item.aiModelUsed ?? 'anthropic/claude-haiku-4-5'
    // Summarization: ~2000 input + 500 output tokens
    if (model.includes('sonnet')) {
      cost += (2000 * 3 + 500 * 15) / 1_000_000 // ~$0.0135/item
    } else {
      cost += (2000 * 0.8 + 500 * 4) / 1_000_000 // ~$0.0036/item
    }
    // Categorization (haiku): ~500 input + 50 output
    cost += (500 * 0.8 + 50 * 4) / 1_000_000
    // Embedding: ~500 tokens
    cost += (500 * 0.02) / 1_000_000
  }
  return Math.round(cost * 100) / 100
}

async function getAnalyticsData(): Promise<AnalyticsData> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalRow,
    weekRow,
    monthRow,
    sourceTypeRows,
    categoryRows,
    itemsByDateRows,
    topTagRows,
    readStatsRows,
    processedItems,
  ] = await Promise.all([
    // Total items
    db.select({ count: sql<number>`count(*)::int` }).from(items).then((r) => r[0]),

    // Items this week
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(items)
      .where(gt(items.createdAt, sevenDaysAgo))
      .then((r) => r[0]),

    // Items this month
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(items)
      .where(gt(items.createdAt, startOfMonth))
      .then((r) => r[0]),

    // By source type
    db
      .select({
        source_type: items.sourceType,
        count: sql<number>`count(*)::int`,
      })
      .from(items)
      .groupBy(items.sourceType)
      .orderBy(desc(sql`count(*)`)),

    // By category
    db
      .select({
        name: categories.name,
        color: categories.color,
        count: sql<number>`count(${items.id})::int`,
      })
      .from(items)
      .innerJoin(categories, eq(items.categoryId, categories.id))
      .groupBy(categories.id, categories.name, categories.color)
      .orderBy(desc(sql`count(${items.id})`))
      .limit(15),

    // Items by date (last 30 days)
    db
      .select({
        date: sql<string>`date_trunc('day', ${items.createdAt})::date::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(items)
      .where(gt(items.createdAt, thirtyDaysAgo))
      .groupBy(sql`date_trunc('day', ${items.createdAt})`)
      .orderBy(sql`date_trunc('day', ${items.createdAt})`),

    // Top tags
    db
      .select({
        name: tags.name,
        slug: tags.slug,
        count: tags.usageCount,
      })
      .from(tags)
      .where(gt(tags.usageCount, 0))
      .orderBy(desc(tags.usageCount))
      .limit(30),

    // Read stats
    db
      .select({
        total_saved: sql<number>`count(*)::int`,
        total_read: sql<number>`count(*) filter (where ${items.readCount} > 0)::int`,
      })
      .from(items)
      .then((r) => r[0]),

    // Processed items for cost
    db
      .select({ aiModelUsed: items.aiModelUsed })
      .from(items)
      .where(eq(items.processingStatus, 'completed')),
  ])

  const { total_saved, total_read } = readStatsRows
  const read_rate = total_saved > 0 ? Math.round((total_read / total_saved) * 100) / 100 : 0

  return {
    total_items: totalRow.count,
    items_this_week: weekRow.count,
    items_this_month: monthRow.count,
    by_source_type: sourceTypeRows,
    by_category: categoryRows,
    items_by_date: itemsByDateRows,
    top_tags: topTagRows,
    read_stats: { total_saved, total_read, read_rate },
    estimated_cost_usd: estimateCost(processedItems),
  }
}

export default async function AnalyticsPage() {
  let data: AnalyticsData
  try {
    data = await getAnalyticsData()
  } catch {
    data = {
      total_items: 0,
      items_this_week: 0,
      items_this_month: 0,
      by_source_type: [],
      by_category: [],
      items_by_date: [],
      top_tags: [],
      read_stats: { total_saved: 0, total_read: 0, read_rate: 0 },
      estimated_cost_usd: 0,
    }
  }

  return <AnalyticsDashboard data={data} />
}
