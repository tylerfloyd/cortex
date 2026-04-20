import { db } from '@/lib/db'
import { items, categories, tags, itemTags, itemRelations } from '@/lib/db/schema'
import { and, eq, gt, lt, sql, inArray } from 'drizzle-orm'
import { HygieneClient } from './HygieneClient'

const SIMILARITY_THRESHOLD = 0.95
const DEFAULT_STALE_MONTHS = 6

async function getDuplicates() {
  try {
    const pairs = await db
      .select({
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
      .limit(100)

    if (pairs.length === 0) return []

    const itemIdSet = new Set<string>()
    for (const p of pairs) {
      itemIdSet.add(p.itemAId)
      itemIdSet.add(p.itemBId)
    }
    const allItemIds = Array.from(itemIdSet)

    const itemRows = await db
      .select({
        id: items.id,
        title: items.title,
        url: items.url,
        sourceType: items.sourceType,
        summary: items.summary,
        createdAt: items.createdAt,
        categoryName: categories.name,
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(inArray(items.id, allItemIds))

    const itemMap = new Map(itemRows.map((r) => [r.id, r]))

    return pairs
      .map((p) => {
        const itemA = itemMap.get(p.itemAId)
        const itemB = itemMap.get(p.itemBId)
        if (!itemA || !itemB) return null
        return { similarity: p.similarity ?? 0, itemA, itemB }
      })
      .filter(Boolean) as Array<{
        similarity: number
        itemA: { id: string; title: string | null; url: string; sourceType: string; summary: string | null; createdAt: Date | null; categoryName: string | null }
        itemB: { id: string; title: string | null; url: string; sourceType: string; summary: string | null; createdAt: Date | null; categoryName: string | null }
      }>
  } catch {
    return []
  }
}

async function getStaleItems() {
  try {
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - DEFAULT_STALE_MONTHS)

    const rows = await db
      .select({
        id: items.id,
        title: items.title,
        url: items.url,
        sourceType: items.sourceType,
        summary: items.summary,
        createdAt: items.createdAt,
        categoryName: categories.name,
      })
      .from(items)
      .leftJoin(categories, eq(items.categoryId, categories.id))
      .where(
        and(
          eq(items.processingStatus, 'completed'),
          eq(items.readCount, 0),
          lt(items.createdAt, cutoff)
        )
      )
      .orderBy(items.createdAt)
      .limit(300)

    return rows
  } catch {
    return []
  }
}

async function getTagSuggestions() {
  try {
    const rows = await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        usageCount: sql<number>`count(${itemTags.tagId})::int`,
      })
      .from(tags)
      .leftJoin(itemTags, sql`${itemTags.tagId} = ${tags.id}`)
      .groupBy(tags.id, tags.name, tags.slug)
      .orderBy(tags.name)

    const norm = (s: string) => s.toLowerCase().replace(/[-_\s]/g, '')

    const suggestions: Array<{
      tagA: { id: string; name: string; slug: string; usageCount: number }
      tagB: { id: string; name: string; slug: string; usageCount: number }
      reason: string
    }> = []

    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const na = norm(rows[i].name)
        const nb = norm(rows[j].name)
        if (na === nb) {
          suggestions.push({ tagA: rows[i], tagB: rows[j], reason: 'case or separator variant' })
        } else if (na.includes(nb) || nb.includes(na)) {
          suggestions.push({ tagA: rows[i], tagB: rows[j], reason: 'one contains the other' })
        }
      }
    }

    return suggestions.slice(0, 100)
  } catch {
    return []
  }
}

export default async function HygienePage() {
  const [duplicates, staleItems, tagSuggestions] = await Promise.all([
    getDuplicates(),
    getStaleItems(),
    getTagSuggestions(),
  ])

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Hygiene</h1>
        <p className="text-sm text-muted-foreground">
          Find duplicates, clean up stale content, and merge similar tags.
        </p>
      </div>

      <HygieneClient
        duplicates={duplicates}
        staleItems={staleItems}
        tagSuggestions={tagSuggestions}
      />
    </div>
  )
}
