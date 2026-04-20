export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { eq, sql, desc, or, ne, notInArray, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { items, categories, tags, itemTags, itemRelations } from '@/lib/db/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SourceIcon } from '@/components/items/SourceIcon'
import { relativeTime, truncateUrl } from '@/lib/format'
import { cn } from '@/lib/utils'

async function getDashboardData() {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Total completed items
    const [totalRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(items)
      .where(eq(items.processingStatus, 'completed'))

    // Items this week
    const [weekRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(items)
      .where(
        sql`${items.processingStatus} = 'completed' AND ${items.createdAt} >= ${sevenDaysAgo}`
      )

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
      .limit(1)

    // Source type breakdown
    const sourceTypeRows = await db
      .select({
        sourceType: items.sourceType,
        count: sql<number>`count(*)::int`,
      })
      .from(items)
      .where(eq(items.processingStatus, 'completed'))
      .groupBy(items.sourceType)
      .orderBy(desc(sql`count(*)`))

    // Recently saved (last 10 completed)
    const recentRows = await db
      .select({
        id: items.id,
        url: items.url,
        title: items.title,
        sourceType: items.sourceType,
        summary: items.summary,
        categoryId: items.categoryId,
        createdAt: items.createdAt,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(eq(items.processingStatus, 'completed'))
      .orderBy(desc(items.createdAt))
      .limit(10)

    // Get tags for recent items
    const recentItemIds = recentRows.map((r) => r.id)
    let recentItemTags: Array<{ itemId: string; tagName: string; tagSlug: string }> = []
    if (recentItemIds.length > 0) {
      const tagRows = await db
        .select({
          itemId: itemTags.itemId,
          tagName: tags.name,
          tagSlug: tags.slug,
        })
        .from(itemTags)
        .innerJoin(tags, eq(itemTags.tagId, tags.id))
        .where(inArray(itemTags.itemId, recentItemIds))
      recentItemTags = tagRows
    }

    // Processing queue (pending/processing)
    const queueRows = await db
      .select({
        id: items.id,
        url: items.url,
        title: items.title,
        processingStatus: items.processingStatus,
        createdAt: items.createdAt,
      })
      .from(items)
      .where(
        sql`${items.processingStatus} IN ('pending', 'processing')`
      )
      .orderBy(desc(items.createdAt))
      .limit(20)

    const result = {
      total: totalRow.count,
      thisWeek: weekRow.count,
      topCategory: topCategoryRows[0] ?? null,
      sourceTypes: sourceTypeRows,
      recentItems: recentRows,
      recentItemTags,
      processingQueue: queueRows,
    }
    console.log('[dashboard] data:', JSON.stringify({ total: result.total, thisWeek: result.thisWeek, recentItems: result.recentItems.length }))
    return result
  } catch (err) {
    console.error('[dashboard] getDashboardData error:', err)
    return {
      total: 0,
      thisWeek: 0,
      topCategory: null,
      sourceTypes: [],
      recentItems: [],
      recentItemTags: [],
      processingQueue: [],
    }
  }
}

type DiscoverItem = {
  id: string
  title: string | null
  url: string
  sourceType: string
  summary: string | null
  similarity: number
  relatedToTitle: string | null
  relatedToId: string
}

async function getDiscoverItems(): Promise<DiscoverItem[]> {
  try {
    // Get the 3 most recently saved completed items
    const recentItems = await db
      .select({ id: items.id, title: items.title })
      .from(items)
      .where(eq(items.processingStatus, 'completed'))
      .orderBy(desc(items.createdAt))
      .limit(3)

    if (recentItems.length === 0) return []

    const recentIds = recentItems.map((r) => r.id)

    // Fetch relations where one side is a recent item
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
          inArray(itemRelations.itemAId, recentIds),
          inArray(itemRelations.itemBId, recentIds),
        )
      )

    if (relationRows.length === 0) return []

    // Map neighbour ID -> { similarity, relatedToId }
    const neighbourMap = new Map<string, { similarity: number; relatedToId: string }>()
    for (const rel of relationRows) {
      if (rel.relationType === 'contradicts') continue
      const [recentSideId, neighbourId] = recentIds.includes(rel.itemAId)
        ? [rel.itemAId, rel.itemBId]
        : [rel.itemBId, rel.itemAId]

      // Skip if the neighbour is itself a recently saved item
      if (recentIds.includes(neighbourId)) continue

      const existing = neighbourMap.get(neighbourId)
      const sim = rel.similarity ?? 0
      if (!existing || sim > existing.similarity) {
        neighbourMap.set(neighbourId, { similarity: sim, relatedToId: recentSideId })
      }
    }

    if (neighbourMap.size === 0) return []

    // Sort by similarity descending, take top 5
    const sorted = [...neighbourMap.entries()]
      .sort((a, b) => b[1].similarity - a[1].similarity)
      .slice(0, 5)

    const neighbourIds = sorted.map(([id]) => id)

    // Fetch item details for neighbours
    const neighbourRows = await db
      .select({
        id: items.id,
        title: items.title,
        url: items.url,
        sourceType: items.sourceType,
        summary: items.summary,
      })
      .from(items)
      .where(inArray(items.id, neighbourIds))

    const neighbourById = new Map(neighbourRows.map((r) => [r.id, r]))
    const recentById = new Map(recentItems.map((r) => [r.id, r]))

    return sorted
      .map(([neighbourId, { similarity, relatedToId }]) => {
        const neighbour = neighbourById.get(neighbourId)
        const recentItem = recentById.get(relatedToId)
        if (!neighbour) return null
        return {
          id: neighbour.id,
          title: neighbour.title,
          url: neighbour.url,
          sourceType: neighbour.sourceType,
          summary: neighbour.summary,
          similarity,
          relatedToTitle: recentItem?.title ?? null,
          relatedToId,
        }
      })
      .filter((x): x is DiscoverItem => x !== null)
  } catch {
    return []
  }
}

export default async function DashboardPage() {
  const [data, discoverItems] = await Promise.all([
    getDashboardData(),
    getDiscoverItems(),
  ])

  const tagsByItemId = new Map<string, Array<{ name: string; slug: string }>>()
  for (const t of data.recentItemTags) {
    if (!tagsByItemId.has(t.itemId)) tagsByItemId.set(t.itemId, [])
    tagsByItemId.get(t.itemId)!.push({ name: t.tagName, slug: t.tagSlug })
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Your personal knowledge base at a glance.</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card size="sm" className="border-l-2 border-l-primary">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.total}</p>
          </CardContent>
        </Card>

        <Card size="sm" className="border-l-2 border-l-primary">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.thisWeek}</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topCategory ? (
              <>
                <p className="text-lg font-semibold truncate">{data.topCategory.name}</p>
                <p className="text-xs text-muted-foreground">{data.topCategory.count} items</p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">None yet</p>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">By Source</CardTitle>
          </CardHeader>
          <CardContent>
            {data.sourceTypes.length > 0 ? (
              <ul className="space-y-1">
                {data.sourceTypes.map((st) => (
                  <li key={st.sourceType} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <SourceIcon sourceType={st.sourceType} />
                      <span className="text-sm capitalize">{st.sourceType}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{st.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">None yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recently saved */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recently Saved</h2>
          <Link href="/library" className="text-sm text-primary hover:underline">
            View all →
          </Link>
        </div>

        {data.recentItems.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No items saved yet. Start by adding a URL through the extension or API.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.recentItems.map((item) => {
              const itemTagsList = tagsByItemId.get(item.id) ?? []
              const displayTitle = item.title ?? truncateUrl(item.url)
              const summaryPreview = item.summary
                ? item.summary.slice(0, 100) + (item.summary.length > 100 ? '…' : '')
                : null

              return (
                <Link
                  key={item.id}
                  href={`/library/${item.id}`}
                  className="block group"
                >
                  <Card className="h-full transition-all group-hover:shadow-md group-hover:border-primary/40">
                    <CardHeader>
                      <div className="flex items-start gap-2">
                        <SourceIcon sourceType={item.sourceType} className="mt-0.5 shrink-0" />
                        <CardTitle className="line-clamp-2 text-sm leading-snug">
                          {displayTitle}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {item.categoryName && (
                        <Badge variant="secondary" className="text-xs">
                          {item.categoryName}
                        </Badge>
                      )}
                      {itemTagsList.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {itemTagsList.slice(0, 3).map((tag) => (
                            <Badge key={tag.slug} variant="outline" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {summaryPreview && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{summaryPreview}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{relativeTime(item.createdAt)}</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Discover section */}
      {discoverItems.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold">Discover</h2>
              <p className="text-sm text-muted-foreground">You might want to revisit…</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {discoverItems.map((item) => {
              const displayTitle = item.title ?? truncateUrl(item.url)
              const summaryPreview = item.summary
                ? item.summary.slice(0, 100) + (item.summary.length > 100 ? '…' : '')
                : null

              return (
                <Link
                  key={item.id}
                  href={`/library/${item.id}`}
                  className="block group"
                >
                  <Card className="h-full transition-all group-hover:shadow-md group-hover:border-primary/40">
                    <CardHeader>
                      <div className="flex items-start gap-2">
                        <SourceIcon sourceType={item.sourceType} className="mt-0.5 shrink-0" />
                        <CardTitle className="line-clamp-2 text-sm leading-snug">
                          {displayTitle}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {summaryPreview && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{summaryPreview}</p>
                      )}
                      <p className="text-xs text-muted-foreground/70">
                        Related to:{' '}
                        <Link
                          href={`/library/${item.relatedToId}`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.relatedToTitle ?? 'a recent item'}
                        </Link>
                        {' '}· {Math.round(item.similarity * 100)}% match
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Processing queue */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Processing Queue</h2>

        {data.processingQueue.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center text-muted-foreground text-sm">
              Nothing in the queue — all items processed.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {data.processingQueue.map((item) => {
                  const displayTitle = item.title ?? truncateUrl(item.url)
                  return (
                    <li key={item.id} className="flex items-center justify-between px-4 py-3 gap-3">
                      <span className="text-sm truncate flex-1">{displayTitle}</span>
                      <Badge
                        variant={item.processingStatus === 'processing' ? 'default' : 'outline'}
                        className={cn(
                          'shrink-0 capitalize',
                          item.processingStatus === 'processing' && 'bg-primary/20 text-primary border-primary/40'
                        )}
                      >
                        {item.processingStatus}
                      </Badge>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}
