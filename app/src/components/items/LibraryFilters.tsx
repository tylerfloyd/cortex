'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { SOURCE_ICONS, SOURCE_LABELS } from '@/components/items/SourceIcon'

type Category = {
  id: string
  name: string
  slug: string
  itemCount: number
}

type Tag = {
  id: string
  name: string
  slug: string
}

type LibraryFiltersProps = {
  categories: Category[]
  allTags: Tag[]
}

const SOURCE_TYPES = Object.keys(SOURCE_ICONS).map((value) => ({
  value,
  label: SOURCE_LABELS[value] ?? value,
  icon: SOURCE_ICONS[value],
}))

const DATE_RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
]

export function LibraryFilters({ categories, allTags }: LibraryFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentCategory = searchParams.get('category') ?? ''
  const currentSourceType = searchParams.get('source_type') ?? ''
  const currentDateRange = searchParams.get('date_range') ?? 'all'
  const isFavorite = searchParams.get('is_favorite') === 'true'
  const currentTagsParam = searchParams.get('tags') ?? ''
  const currentTagSlugs = currentTagsParam ? currentTagsParam.split(',').filter(Boolean) : []

  const [tagSearch, setTagSearch] = useState('')

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      // Reset to page 1 when filters change
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const clearAll = useCallback(() => {
    router.push(pathname)
  }, [router, pathname])

  const toggleTag = useCallback(
    (tagSlug: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const existing = params.get('tags') ?? ''
      const slugs = existing ? existing.split(',').filter(Boolean) : []
      const idx = slugs.indexOf(tagSlug)
      if (idx >= 0) {
        slugs.splice(idx, 1)
      } else {
        slugs.push(tagSlug)
      }
      if (slugs.length === 0) {
        params.delete('tags')
      } else {
        params.set('tags', slugs.join(','))
      }
      params.delete('page')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const hasActiveFilters =
    currentCategory || currentSourceType || currentDateRange !== 'all' || isFavorite || currentTagSlugs.length > 0

  const filteredTags = allTags.filter((t) =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase())
  )

  return (
    <aside className="w-60 shrink-0 space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Categories</h3>
        <ul className="space-y-0.5">
          <li>
            <button
              onClick={() => updateParam('category', null)}
              className={`w-full text-left text-sm px-2 py-1 rounded-md transition-colors hover:bg-muted ${
                !currentCategory ? 'bg-muted font-medium' : ''
              }`}
            >
              All categories
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.slug}>
              <button
                onClick={() => updateParam('category', cat.slug)}
                className={`w-full text-left text-sm px-2 py-1 rounded-md transition-colors hover:bg-muted flex items-center justify-between ${
                  currentCategory === cat.slug ? 'bg-muted font-medium' : ''
                }`}
              >
                <span className="truncate">{cat.name}</span>
                <span className="text-xs text-muted-foreground ml-1 shrink-0">{cat.itemCount}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Source type */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Source Type</h3>
        <ul className="space-y-1">
          {SOURCE_TYPES.map((st) => {
            const checked = currentSourceType === st.value
            return (
              <li key={st.value}>
                <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      updateParam('source_type', checked ? null : st.value)
                    }
                    className="rounded"
                  />
                  <span>{st.icon}</span>
                  <span>{st.label}</span>
                </label>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Date range */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Date Range</h3>
        <ul className="space-y-1">
          {DATE_RANGES.map((dr) => (
            <li key={dr.value}>
              <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground">
                <input
                  type="radio"
                  name="date_range"
                  value={dr.value}
                  checked={currentDateRange === dr.value}
                  onChange={() => updateParam('date_range', dr.value === 'all' ? null : dr.value)}
                />
                {dr.label}
              </label>
            </li>
          ))}
        </ul>
      </div>

      {/* Favorites toggle */}
      <div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isFavorite}
            onChange={() => updateParam('is_favorite', isFavorite ? null : 'true')}
            className="rounded"
          />
          <span>Favorites only</span>
        </label>
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Tags</h3>
          {allTags.length > 6 && (
            <input
              type="text"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="Search tags..."
              className="w-full text-sm border border-input rounded-md px-2 py-1 bg-background mb-2"
            />
          )}
          <ul className="space-y-0.5 max-h-48 overflow-y-auto">
            {filteredTags.map((tag) => {
              const active = currentTagSlugs.includes(tag.slug)
              return (
                <li key={tag.slug}>
                  <button
                    onClick={() => toggleTag(tag.slug)}
                    className={`w-full text-left text-sm px-2 py-1 rounded-md transition-colors hover:bg-muted ${
                      active ? 'bg-muted font-medium' : ''
                    }`}
                  >
                    {tag.name}
                  </button>
                </li>
              )
            })}
            {filteredTags.length === 0 && (
              <li className="text-xs text-muted-foreground px-2 py-1">No tags found</li>
            )}
          </ul>
        </div>
      )}

      {/* Clear filters */}
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearAll} className="w-full">
          Clear filters
        </Button>
      )}
    </aside>
  )
}
