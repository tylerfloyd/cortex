'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { relativeTime, truncateUrl } from '@/lib/format'

type ItemSummary = {
  id: string
  title: string | null
  url: string
  sourceType: string
  summary: string | null
  createdAt: Date | null
  categoryName: string | null
}

type DuplicatePair = {
  similarity: number
  itemA: ItemSummary
  itemB: ItemSummary
}

type TagInfo = {
  id: string
  name: string
  slug: string
  usageCount: number
}

type TagSuggestion = {
  tagA: TagInfo
  tagB: TagInfo
  reason: string
}

type HygieneClientProps = {
  duplicates: DuplicatePair[]
  staleItems: ItemSummary[]
  tagSuggestions: TagSuggestion[]
}

async function callBulkApi(action: string, itemIds: string[]) {
  const res = await fetch('/api/items/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, item_ids: itemIds }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'Operation failed')
  }
  return res.json()
}

async function mergeTagApi(sourceId: string, targetId: string) {
  const res = await fetch('/api/tags/merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_id: sourceId, target_id: targetId }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? 'Merge failed')
  }
  return res.json()
}

// ── Duplicates Tab ───────────────────────────────────────────────────────────

function DuplicatesTab({ initialPairs }: { initialPairs: DuplicatePair[] }) {
  const [pairs, setPairs] = useState(initialPairs)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleDelete(deleteId: string, pairKey: string) {
    setLoading(pairKey + deleteId)
    try {
      await callBulkApi('delete', [deleteId])
      setPairs((prev) => prev.filter((p) => p.itemA.id !== deleteId && p.itemB.id !== deleteId))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  if (pairs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No duplicate pairs found (similarity &gt; 95%).
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {pairs.length} pair{pairs.length !== 1 ? 's' : ''} with &gt;95% similarity
      </p>
      {pairs.map((pair, i) => {
        const pairKey = `${pair.itemA.id}-${pair.itemB.id}`
        return (
          <Card key={pairKey}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className="text-xs">
                  {Math.round(pair.similarity * 100)}% similar
                </Badge>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {([pair.itemA, pair.itemB] as ItemSummary[]).map((item) => (
                  <div key={item.id} className="space-y-1.5 rounded-lg border p-3">
                    <p className="font-medium text-sm line-clamp-2">
                      {item.title ?? truncateUrl(item.url)}
                    </p>
                    {item.categoryName && (
                      <Badge variant="secondary" className="text-xs">
                        {item.categoryName}
                      </Badge>
                    )}
                    {item.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{relativeTime(item.createdAt)}</p>
                    <div className="flex gap-2 pt-1">
                      <Link
                        href={`/library/${item.id}`}
                        target="_blank"
                        className="text-xs text-primary underline-offset-2 hover:underline"
                      >
                        View
                      </Link>
                      <button
                        className="text-xs text-destructive hover:underline disabled:opacity-50"
                        disabled={loading !== null}
                        onClick={() => handleDelete(item.id, pairKey)}
                      >
                        {loading === pairKey + item.id ? 'Deleting…' : 'Delete this'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ── Stale Content Tab ────────────────────────────────────────────────────────

function StaleTab({ initialItems }: { initialItems: ItemSummary[] }) {
  const [items, setItems] = useState(initialItems)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  function toggleAll() {
    if (selected.size === items.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(items.map((i) => i.id)))
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return
    setLoading(true)
    try {
      const ids = Array.from(selected)
      await callBulkApi('delete', ids)
      setItems((prev) => prev.filter((i) => !selected.has(i.id)))
      setSelected(new Set())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No stale items found (no unread items older than 6 months).
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} item{items.length !== 1 ? 's' : ''} older than 6 months with 0 reads
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleAll} disabled={loading}>
            {selected.size === items.length ? 'Deselect all' : 'Select all'}
          </Button>
          {selected.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={loading}>
              {loading ? 'Deleting…' : `Delete ${selected.size}`}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="w-8 px-4 py-2" />
                <th className="text-left px-4 py-2 font-medium">Title</th>
                <th className="text-left px-4 py-2 font-medium hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-2 font-medium hidden lg:table-cell">Added</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggle(item.id)}
                      className="h-4 w-4 rounded border-border accent-primary"
                      aria-label={`Select ${item.title ?? item.url}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/library/${item.id}`} className="hover:underline line-clamp-1 font-medium">
                      {item.title ?? truncateUrl(item.url)}
                    </Link>
                    {item.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.summary}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {item.categoryName ? (
                      <Badge variant="secondary" className="text-xs">{item.categoryName}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {relativeTime(item.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Tag Cleanup Tab ──────────────────────────────────────────────────────────

function TagCleanupTab({ initialSuggestions }: { initialSuggestions: TagSuggestion[] }) {
  const [suggestions, setSuggestions] = useState(initialSuggestions)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleMerge(sourceId: string, targetId: string, key: string) {
    setLoading(key)
    try {
      await mergeTagApi(sourceId, targetId)
      // Remove suggestions involving the merged source tag
      setSuggestions((prev) => prev.filter((s) => s.tagA.id !== sourceId && s.tagB.id !== sourceId))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No similar tag pairs detected.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {suggestions.length} suggested merge{suggestions.length !== 1 ? 's' : ''}
      </p>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2 font-medium">Tag A</th>
                <th className="text-left px-4 py-2 font-medium">Tag B</th>
                <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Reason</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {suggestions.map((s) => {
                const key = `${s.tagA.id}-${s.tagB.id}`
                return (
                  <tr key={key} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium">{s.tagA.name}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground">({s.tagA.usageCount})</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{s.tagB.name}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground">({s.tagB.usageCount})</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">
                      {s.reason}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={loading !== null}
                          onClick={() => handleMerge(s.tagA.id, s.tagB.id, key)}
                          title={`Merge "${s.tagA.name}" into "${s.tagB.name}"`}
                        >
                          {loading === key ? '…' : `A → B`}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          disabled={loading !== null}
                          onClick={() => handleMerge(s.tagB.id, s.tagA.id, key + 'r')}
                          title={`Merge "${s.tagB.name}" into "${s.tagA.name}"`}
                        >
                          {loading === key + 'r' ? '…' : `B → A`}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Main Export ──────────────────────────────────────────────────────────────

export function HygieneClient({
  duplicates,
  staleItems,
  tagSuggestions,
}: HygieneClientProps) {
  return (
    <Tabs defaultValue="duplicates">
      <TabsList>
        <TabsTrigger value="duplicates">
          Duplicates
          {duplicates.length > 0 && (
            <Badge variant="secondary" className="ml-1.5 text-xs">
              {duplicates.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="stale">
          Stale Content
          {staleItems.length > 0 && (
            <Badge variant="secondary" className="ml-1.5 text-xs">
              {staleItems.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="tags">
          Tag Cleanup
          {tagSuggestions.length > 0 && (
            <Badge variant="secondary" className="ml-1.5 text-xs">
              {tagSuggestions.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="duplicates" className="mt-4">
        <DuplicatesTab initialPairs={duplicates} />
      </TabsContent>

      <TabsContent value="stale" className="mt-4">
        <StaleTab initialItems={staleItems} />
      </TabsContent>

      <TabsContent value="tags" className="mt-4">
        <TagCleanupTab initialSuggestions={tagSuggestions} />
      </TabsContent>
    </Tabs>
  )
}
