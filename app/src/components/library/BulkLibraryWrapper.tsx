'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SourceIcon } from '@/components/items/SourceIcon'
import { BulkActionBar } from '@/components/library/BulkActionBar'
import { relativeTime, truncateUrl } from '@/lib/format'

type ItemRow = {
  id: string
  url: string
  title: string | null
  sourceType: string
  summary: string | null
  categoryId: string | null
  isFavorite: boolean | null
  createdAt: Date | null
  categoryName: string | null
  categorySlug: string | null
}

type TagInfo = { name: string; slug: string }

type Category = {
  id: string
  name: string
  slug: string
}

type BulkLibraryWrapperProps = {
  rows: ItemRow[]
  tagMap: Map<string, TagInfo[]>
  viewParam: 'grid' | 'list'
  categories: Category[]
}

async function callBulkApi(action: string, itemIds: string[], extra: Record<string, unknown> = {}) {
  const res = await fetch('/api/items/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, item_ids: itemIds, ...extra }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'Bulk operation failed')
  }
  return res.json()
}

export function BulkLibraryWrapper({
  rows,
  tagMap,
  viewParam,
  categories,
}: BulkLibraryWrapperProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [anySelected, setAnySelected] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      setAnySelected(next.size > 0)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setAnySelected(false)
  }, [])

  const handleCategorize = useCallback(
    async (categorySlug: string) => {
      setBulkError(null)
      try {
        await callBulkApi('categorize', Array.from(selectedIds), { category_slug: categorySlug })
        // Reload page to reflect changes
        window.location.reload()
      } catch (err) {
        setBulkError(err instanceof Error ? err.message : 'Categorize failed')
      }
    },
    [selectedIds]
  )

  const handleDelete = useCallback(async () => {
    setBulkError(null)
    try {
      await callBulkApi('delete', Array.from(selectedIds))
      window.location.reload()
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Delete failed')
    }
  }, [selectedIds])

  return (
    <div>
      {viewParam === 'grid' ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((item) => {
            const itemTagsList: TagInfo[] = tagMap?.get(item.id) ?? []
            const displayTitle = item.title ?? truncateUrl(item.url)
            const summaryPreview = item.summary
              ? item.summary.slice(0, 120) + (item.summary.length > 120 ? '…' : '')
              : null
            const isSelected = selectedIds.has(item.id)

            return (
              <div key={item.id} className="relative group">
                {/* Checkbox overlay */}
                {(anySelected || isSelected) && (
                  <button
                    aria-label={isSelected ? 'Deselect item' : 'Select item'}
                    className="absolute top-2 left-2 z-10 h-5 w-5 rounded border border-border bg-background flex items-center justify-center shadow-sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleItem(item.id)
                    }}
                  >
                    {isSelected && (
                      <svg
                        className="h-3 w-3 text-primary"
                        fill="currentColor"
                        viewBox="0 0 12 12"
                        aria-hidden="true"
                      >
                        <path d="M10 3L5 8.5 2 5.5 1 6.5l4 4 6-7z" />
                      </svg>
                    )}
                  </button>
                )}
                {/* Hover-reveal checkbox when none selected */}
                {!anySelected && (
                  <button
                    aria-label="Select item"
                    className="absolute top-2 left-2 z-10 h-5 w-5 rounded border border-border bg-background items-center justify-center shadow-sm hidden group-hover:flex"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleItem(item.id)
                    }}
                  >
                  </button>
                )}

                <Link
                  href={`/library/${item.id}`}
                  className={`block group ${isSelected ? 'ring-2 ring-primary rounded-lg' : ''}`}
                  onClick={anySelected ? (e) => { e.preventDefault(); toggleItem(item.id) } : undefined}
                >
                  <Card className="h-full transition-shadow group-hover:shadow-md">
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
              </div>
            )
          })}
        </div>
      ) : (
        <Card className="divide-y p-0 overflow-hidden">
          {rows.map((item) => {
            const displayTitle = item.title ?? truncateUrl(item.url)
            const isSelected = selectedIds.has(item.id)
            return (
              <div key={item.id} className="relative group flex items-center">
                {/* Checkbox */}
                {(anySelected || isSelected) && (
                  <button
                    aria-label={isSelected ? 'Deselect item' : 'Select item'}
                    className="absolute left-2 z-10 h-4 w-4 rounded border border-border bg-background flex items-center justify-center shadow-sm shrink-0"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleItem(item.id)
                    }}
                  >
                    {isSelected && (
                      <svg
                        className="h-2.5 w-2.5 text-primary"
                        fill="currentColor"
                        viewBox="0 0 12 12"
                        aria-hidden="true"
                      >
                        <path d="M10 3L5 8.5 2 5.5 1 6.5l4 4 6-7z" />
                      </svg>
                    )}
                  </button>
                )}
                {!anySelected && (
                  <button
                    aria-label="Select item"
                    className="absolute left-2 z-10 h-4 w-4 rounded border border-border bg-background items-center justify-center shadow-sm hidden group-hover:flex shrink-0"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleItem(item.id)
                    }}
                  />
                )}
                <Link
                  href={`/library/${item.id}`}
                  className={`flex flex-1 items-center gap-3 px-3 py-2.5 hover:bg-accent/50 rounded-md group/row transition-colors min-w-0 ${isSelected ? 'bg-accent/30' : ''} ${anySelected ? 'pl-8' : ''}`}
                  onClick={anySelected ? (e) => { e.preventDefault(); toggleItem(item.id) } : undefined}
                >
                  <SourceIcon sourceType={item.sourceType} className="shrink-0 size-4 text-muted-foreground" />
                  <span className="flex-1 text-sm truncate group-hover/row:text-primary transition-colors">{displayTitle}</span>
                  {item.categoryName && (
                    <Badge variant="secondary" className="text-xs shrink-0">{item.categoryName}</Badge>
                  )}
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">{relativeTime(item.createdAt)}</span>
                </Link>
              </div>
            )
          })}
        </Card>
      )}

      {bulkError && (
        <div className="mt-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-2 text-sm text-destructive">
          {bulkError}
        </div>
      )}

      <BulkActionBar
        selectedCount={selectedIds.size}
        categories={categories}
        onCategorize={handleCategorize}
        onDelete={handleDelete}
        onClearSelection={clearSelection}
      />
    </div>
  )
}
