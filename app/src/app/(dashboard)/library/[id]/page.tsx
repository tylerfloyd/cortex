import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq, or, sql, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { items, categories, tags, itemTags, itemRelations } from '@/lib/db/schema'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SourceIcon } from '@/components/items/SourceIcon'
import { ItemEditForm } from '@/components/items/ItemEditForm'
import { DeleteItemButton } from '@/components/items/DeleteItemButton'
import { deleteItem } from './actions'
import { updateItem } from './item-actions'
import { truncateUrl } from '@/lib/format'

async function getItem(id: string) {
  const rows = await db
    .select({
      id: items.id,
      url: items.url,
      sourceType: items.sourceType,
      title: items.title,
      author: items.author,
      publishedAt: items.publishedAt,
      rawContent: items.rawContent,
      summary: items.summary,
      keyInsights: items.keyInsights,
      categoryId: items.categoryId,
      contentType: items.contentType,
      difficultyLevel: items.difficultyLevel,
      estimatedReadTimeMinutes: items.estimatedReadTimeMinutes,
      processingStatus: items.processingStatus,
      captureSource: items.captureSource,
      userNotes: items.userNotes,
      isFavorite: items.isFavorite,
      createdAt: items.createdAt,
      updatedAt: items.updatedAt,
      embedding: items.embedding,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryColor: categories.color,
    })
    .from(items)
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .where(eq(items.id, id))
    .limit(1)

  if (rows.length === 0) return null

  const item = rows[0]

  const itemTagRows = await db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(itemTags)
    .innerJoin(tags, eq(itemTags.tagId, tags.id))
    .where(eq(itemTags.itemId, id))

  return { ...item, tags: itemTagRows }
}

type RelatedItem = {
  id: string
  title: string | null
  url: string
  sourceType: string
  summary: string | null
  createdAt: Date
  categoryName: string | null
  similarity: number
  relationType: string
}

async function getRelatedItems(itemId: string, embedding: number[] | null): Promise<RelatedItem[]> {
  // First, try to read pre-computed relations from item_relations table
  try {
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
          eq(itemRelations.itemAId, itemId),
          eq(itemRelations.itemBId, itemId),
        )
      )
      .limit(5)

    if (relationRows.length > 0) {
      // Collect the IDs of the related items (the "other" side of each relation)
      const relatedIds = relationRows.map((r) =>
        r.itemAId === itemId ? r.itemBId : r.itemAId
      )
      const simByNeighbourId = new Map(
        relationRows.map((r) => [
          r.itemAId === itemId ? r.itemBId : r.itemAId,
          { similarity: r.similarity ?? 0, relationType: r.relationType },
        ])
      )

      const neighbourRows = await db
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
        .where(inArray(items.id, relatedIds))

      return neighbourRows.map((row) => {
        const rel = simByNeighbourId.get(row.id) ?? { similarity: 0, relationType: 'related' }
        return {
          ...row,
          categoryName: row.categoryName ?? null,
          createdAt: row.createdAt ?? new Date(),
          similarity: rel.similarity,
          relationType: rel.relationType,
        }
      }).sort((a, b) => b.similarity - a.similarity)
    }
  } catch {
    // Fall through to pgvector fallback
  }

  // Fallback: real-time pgvector query (used when item_relations is not yet populated)
  if (!embedding) return []

  try {
    const vectorLiteral = `[${embedding.join(',')}]`
    const related = await db.execute(sql`
      SELECT
        i.id,
        i.title,
        i.url,
        i.source_type as "sourceType",
        i.summary,
        i.created_at as "createdAt",
        c.name as "categoryName",
        1 - (i.embedding <=> ${vectorLiteral}::vector) as similarity
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.id != ${itemId}
        AND i.embedding IS NOT NULL
        AND i.processing_status = 'completed'
      ORDER BY i.embedding <=> ${vectorLiteral}::vector
      LIMIT 5
    `)

    return (related.rows as Array<{
      id: string
      title: string | null
      url: string
      sourceType: string
      summary: string | null
      createdAt: Date
      categoryName: string | null
      similarity: number
    }>).map((row) => ({ ...row, relationType: 'related' }))
  } catch {
    return []
  }
}

async function getAllCategories() {
  try {
    return await db
      .select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(categories)
      .orderBy(categories.name)
  } catch {
    return []
  }
}

function formatDate(date: Date | string | null): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [item, allCategories] = await Promise.all([
    getItem(id),
    getAllCategories(),
  ])

  if (!item) {
    notFound()
  }

  const relatedItems = await getRelatedItems(id, item.embedding)

  const keyInsights = Array.isArray(item.keyInsights) ? item.keyInsights as string[] : []
  const displayTitle = item.title ?? truncateUrl(item.url)

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left column — main content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Back link */}
          <Link
            href="/library"
            className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            ← Back to Library
          </Link>

          {/* Title & source link */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <SourceIcon sourceType={item.sourceType} className="mt-1 shrink-0" />
              <h1 className="text-2xl font-bold leading-snug">{displayTitle}</h1>
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline break-all"
            >
              {item.url} ↗
            </a>
          </div>

          {/* Summary */}
          {item.summary && (
            <section>
              <h2 className="text-base font-semibold mb-2">Summary</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
            </section>
          )}

          {/* Key insights */}
          {keyInsights.length > 0 && (
            <section>
              <h2 className="text-base font-semibold mb-2">Key Insights</h2>
              <ul className="space-y-1 list-disc list-inside">
                {keyInsights.map((insight, i) => (
                  <li key={i} className="text-sm text-muted-foreground">{insight}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Source content */}
          {item.rawContent && (
            <details className="group">
              <summary className="cursor-pointer text-sm font-semibold hover:text-foreground text-muted-foreground py-2">
                Source Content ▸
              </summary>
              <div className="mt-2 p-4 bg-muted/30 rounded-lg border text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {item.rawContent}
              </div>
            </details>
          )}
        </div>

        {/* Right column — metadata + edit sidebar */}
        <div className="lg:w-72 xl:w-80 shrink-0 space-y-4">
          {/* Metadata card */}
          <Card size="sm">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Source type</span>
                <SourceIcon sourceType={item.sourceType} showLabel />
              </div>
              {item.author && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Author</span>
                  <span className="text-right">{item.author}</span>
                </div>
              )}
              {item.publishedAt && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Published</span>
                  <span>{formatDate(item.publishedAt)}</span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Captured</span>
                <span>{formatDate(item.createdAt)}</span>
              </div>
              {item.estimatedReadTimeMinutes && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Read time</span>
                  <span>{item.estimatedReadTimeMinutes} min</span>
                </div>
              )}
              {item.difficultyLevel && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Difficulty</span>
                  <span className="capitalize">{item.difficultyLevel}</span>
                </div>
              )}
              {item.captureSource && (
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Captured via</span>
                  <span className="capitalize">{item.captureSource}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category badge */}
          {item.categoryName && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Category</p>
              <Link href={`/library?category=${item.categorySlug}`}>
                <Badge variant="secondary" className="hover:bg-muted cursor-pointer">
                  {item.categoryName}
                </Badge>
              </Link>
            </div>
          )}

          {/* Tags list */}
          {item.tags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Tags</p>
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag) => (
                  <Link key={tag.slug} href={`/library?tags=${tag.slug}`}>
                    <Badge variant="outline" className="text-xs hover:bg-muted cursor-pointer">
                      {tag.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related items */}
          {relatedItems.length > 0 && (
            <Card size="sm">
              <CardHeader>
                <CardTitle>Related Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 p-0 px-4 pb-3">
                {relatedItems.map((related) => (
                  <Link
                    key={related.id}
                    href={`/library/${related.id}`}
                    className="block py-2 border-b last:border-0 group"
                  >
                    <div className="flex items-start gap-1.5">
                      <SourceIcon sourceType={related.sourceType} className="mt-0.5 shrink-0" />
                      <span className="text-sm line-clamp-2 text-muted-foreground group-hover:text-foreground flex-1">
                        {related.title ?? truncateUrl(related.url)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 pl-5">
                      <span className="text-xs text-muted-foreground/70">
                        {Math.round(related.similarity * 100)}% match
                      </span>
                      {related.relationType === 'contradicts' && (
                        <Badge variant="destructive" className="text-xs py-0 h-4">
                          contradicts
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Edit section */}
          <Card size="sm">
            <CardHeader>
              <CardTitle>Edit</CardTitle>
            </CardHeader>
            <CardContent>
              <ItemEditForm
                categories={allCategories}
                currentCategorySlug={item.categorySlug ?? null}
                currentTags={item.tags}
                currentUserNotes={item.userNotes ?? null}
                isFavorite={item.isFavorite ?? false}
                updateAction={updateItem.bind(null, item.id)}
              />
            </CardContent>
          </Card>

          {/* Delete */}
          <DeleteItemButton deleteAction={deleteItem.bind(null, item.id)} />
        </div>
      </div>
    </div>
  )
}
