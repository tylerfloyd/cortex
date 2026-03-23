import Link from 'next/link'
import { and, asc, desc, eq, gte, inArray, sql, SQL } from 'drizzle-orm'
import { db } from '@/lib/db'
import { items, categories, tags, itemTags } from '@/lib/db/schema'
import { Card, CardContent } from '@/components/ui/card'
import { LibraryFilters } from '@/components/items/LibraryFilters'
import { ViewToggle } from '@/components/items/ViewToggle'
import { SortSelector } from '@/components/items/SortSelector'
import { BulkLibraryWrapper } from '@/components/library/BulkLibraryWrapper'

const PAGE_SIZE = 24

async function getAllTags() {
  try {
    return await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
      })
      .from(tags)
      .orderBy(tags.name)
  } catch {
    return []
  }
}

async function getCategoriesWithCounts() {
  try {
    return await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        itemCount: sql<number>`count(${items.id})::int`,
      })
      .from(categories)
      .leftJoin(items, and(eq(items.categoryId, categories.id), eq(items.processingStatus, 'completed')))
      .groupBy(categories.id, categories.name, categories.slug)
      .orderBy(categories.name)
  } catch {
    return []
  }
}

async function getLibraryItems(params: {
  category?: string
  source_type?: string
  tags?: string
  sort?: string
  page?: number
  is_favorite?: boolean
  date_range?: string
}) {
  try {
    const page = Math.max(1, params.page ?? 1)
    const offset = (page - 1) * PAGE_SIZE

    const conditions: SQL[] = [eq(items.processingStatus, 'completed')]

    if (params.source_type) {
      conditions.push(eq(items.sourceType, params.source_type))
    }

    if (params.is_favorite) {
      conditions.push(eq(items.isFavorite, true))
    }

    // Date range filter
    if (params.date_range && params.date_range !== 'all') {
      const days = parseInt(params.date_range, 10)
      if (!isNaN(days)) {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - days)
        conditions.push(gte(items.createdAt, cutoff))
      }
    }

    // Category filter
    if (params.category) {
      const catRows = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, params.category))
        .limit(1)
      if (catRows.length === 0) {
        return { rows: [], total: 0, page, pages: 0, tagMap: new Map<string, Array<{ name: string; slug: string }>>() }
      }
      conditions.push(eq(items.categoryId, catRows[0].id))
    }

    // Tags filter
    if (params.tags) {
      const tagSlugs = params.tags.split(',').map((t) => t.trim()).filter(Boolean)
      if (tagSlugs.length > 0) {
        const matchedTags = await db
          .select({ id: tags.id })
          .from(tags)
          .where(inArray(tags.slug, tagSlugs))

        if (matchedTags.length < tagSlugs.length) {
          return { rows: [], total: 0, page, pages: 0, tagMap: new Map<string, Array<{ name: string; slug: string }>>() }
        }

        const tagIds = matchedTags.map((t) => t.id)
        const itemsWithTags = await db
          .select({ itemId: itemTags.itemId })
          .from(itemTags)
          .where(inArray(itemTags.tagId, tagIds))
          .groupBy(itemTags.itemId)
          .having(sql`count(distinct ${itemTags.tagId}) = ${tagIds.length}`)

        if (itemsWithTags.length === 0) {
          return { rows: [], total: 0, page, pages: 0, tagMap: new Map<string, Array<{ name: string; slug: string }>>() }
        }
        conditions.push(inArray(items.id, itemsWithTags.map((r) => r.itemId)))
      }
    }

    const whereClause = and(...conditions)

    const orderBy =
      params.sort === 'oldest'
        ? asc(items.createdAt)
        : params.sort === 'alphabetical'
          ? sql`${items.title} ASC NULLS LAST`
          : desc(items.createdAt)

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(items)
      .where(whereClause)

    const total = count
    const pages = Math.ceil(total / PAGE_SIZE)

    const rows = await db
      .select({
        id: items.id,
        url: items.url,
        title: items.title,
        sourceType: items.sourceType,
        summary: items.summary,
        categoryId: items.categoryId,
        isFavorite: items.isFavorite,
        createdAt: items.createdAt,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(PAGE_SIZE)
      .offset(offset)

    // Get tags for these items
    const itemIds = rows.map((r) => r.id)
    let tagMap = new Map<string, Array<{ name: string; slug: string }>>()
    if (itemIds.length > 0) {
      const tagRows = await db
        .select({
          itemId: itemTags.itemId,
          tagName: tags.name,
          tagSlug: tags.slug,
        })
        .from(itemTags)
        .innerJoin(tags, eq(itemTags.tagId, tags.id))
        .where(sql`${itemTags.itemId} = ANY(${itemIds}::uuid[])`)
      for (const t of tagRows) {
        if (!tagMap.has(t.itemId)) tagMap.set(t.itemId, [])
        tagMap.get(t.itemId)!.push({ name: t.tagName, slug: t.tagSlug })
      }
    }

    return { rows, total, page, pages, tagMap }
  } catch {
    return { rows: [], total: 0, page: 1, pages: 0, tagMap: new Map() }
  }
}

function buildPageUrl(
  searchParams: Record<string, string>,
  page: number
): string {
  const p = new URLSearchParams(searchParams)
  p.set('page', String(page))
  return `/library?${p.toString()}`
}

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const getString = (key: string) => {
    const v = sp[key]
    return typeof v === 'string' ? v : undefined
  }

  const categoryParam = getString('category')
  const sourceTypeParam = getString('source_type')
  const tagsParam = getString('tags')
  const sortParam = getString('sort') ?? 'newest'
  const pageParam = parseInt(getString('page') ?? '1', 10) || 1
  const viewParam = (getString('view') ?? 'grid') as 'grid' | 'list'
  const isFavoriteParam = getString('is_favorite') === 'true'
  const dateRangeParam = getString('date_range') ?? 'all'

  const [categoriesWithCounts, allTags, { rows, total, page, pages, tagMap }] = await Promise.all([
    getCategoriesWithCounts(),
    getAllTags(),
    getLibraryItems({
      category: categoryParam,
      source_type: sourceTypeParam,
      tags: tagsParam,
      sort: sortParam,
      page: pageParam,
      is_favorite: isFavoriteParam,
      date_range: dateRangeParam,
    }),
  ])

  // Build a plain string record for pagination link building
  const spRecord: Record<string, string> = {}
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === 'string') spRecord[k] = v
  }

  return (
    <div className="flex h-full">
      {/* Filter sidebar — desktop only */}
      <div className="hidden md:block border-r p-4 overflow-y-auto">
        <LibraryFilters categories={categoriesWithCounts} allTags={allTags} />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Library</h1>
            <p className="text-sm text-muted-foreground">{total} item{total !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Sort */}
            <SortSelector currentSort={sortParam} />
            <ViewToggle currentView={viewParam} />
          </div>
        </div>

        {/* Items */}
        {rows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No items match your current filters.
            </CardContent>
          </Card>
        ) : (
          <BulkLibraryWrapper
            rows={rows}
            tagMap={tagMap}
            viewParam={viewParam}
            categories={categoriesWithCounts}
          />
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between pt-2">
            {page > 1 ? (
              <Link
                href={buildPageUrl(spRecord, page - 1)}
                className="inline-flex items-center justify-center rounded-lg border border-input bg-background hover:bg-muted text-sm font-medium h-7 gap-1 px-2.5"
              >
                ← Previous
              </Link>
            ) : (
              <span className="inline-flex items-center justify-center rounded-lg border border-input bg-background text-sm font-medium h-7 gap-1 px-2.5 opacity-50 pointer-events-none">
                ← Previous
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              Page {page} of {pages}
            </span>
            {page < pages ? (
              <Link
                href={buildPageUrl(spRecord, page + 1)}
                className="inline-flex items-center justify-center rounded-lg border border-input bg-background hover:bg-muted text-sm font-medium h-7 gap-1 px-2.5"
              >
                Next →
              </Link>
            ) : (
              <span className="inline-flex items-center justify-center rounded-lg border border-input bg-background text-sm font-medium h-7 gap-1 px-2.5 opacity-50 pointer-events-none">
                Next →
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
