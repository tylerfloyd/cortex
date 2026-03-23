'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SearchResults, type SearchResult } from '@/components/search/SearchResults'
import { AskAnswer, type AskSource } from '@/components/search/AskAnswer'
import { SOURCE_LABELS } from '@/components/items/SourceIcon'

type Mode = 'search' | 'ask'

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? ''

type Category = {
  id: string
  slug: string
  name: string
}

const DATE_RANGE_OPTIONS: { label: string; value: string }[] = [
  { label: 'All time', value: '' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
]

export default function SearchPage() {
  const [mode, setMode] = useState<Mode>('search')
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Search state
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Ask state
  const [askAnswer, setAskAnswer] = useState<string | null>(null)
  const [askSources, setAskSources] = useState<AskSource[]>([])
  const [askLoading, setAskLoading] = useState(false)
  const [askError, setAskError] = useState<string | null>(null)

  // Filter state
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSourceType, setFilterSourceType] = useState('')
  const [filterDateRange, setFilterDateRange] = useState('')
  const [categories, setCategories] = useState<Category[]>([])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [])

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories', { headers: { 'x-api-key': API_KEY } })
      .then((res) => res.ok ? res.json() : null)
      .then((data: { categories: Category[] } | null) => {
        if (data?.categories) setCategories(data.categories)
      })
      .catch(() => {
        // Ignore category fetch errors — filters just won't populate
      })
  }, [])

  const runSearch = useCallback(async (
    q: string,
    category: string,
    sourceType: string,
    dateRange: string,
  ) => {
    if (!q.trim()) {
      setSearchResults([])
      setSearchError(null)
      return
    }

    setSearchLoading(true)
    setSearchError(null)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const params = new URLSearchParams({ q: q.trim(), limit: '10' })
      if (category) params.set('category', category)
      if (sourceType) params.set('source_type', sourceType)
      if (dateRange) params.set('date_range', dateRange)

      const res = await fetch(`/api/search?${params}`, {
        headers: { 'x-api-key': API_KEY },
        signal: controller.signal,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `Search failed (${res.status})`)
      }

      const data = (await res.json()) as { results: SearchResult[] }
      setSearchResults(data.results ?? [])
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setSearchError(err instanceof Error ? err.message : 'Search failed')
      setSearchResults([])
    } finally {
      if (!controller.signal.aborted) {
        setSearchLoading(false)
      }
    }
  }, [])

  const runAsk = useCallback(async (question: string) => {
    if (!question.trim()) return

    setAskLoading(true)
    setAskError(null)
    setAskAnswer(null)
    setAskSources([])

    try {
      const res = await fetch('/api/ask/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({ question: question.trim() }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `Ask failed (${res.status})`)
      }

      if (!res.body) {
        throw new Error('No response body for streaming ask')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      setAskLoading(false)
      setAskAnswer('')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            const msg = JSON.parse(trimmed) as
              | { type: 'chunk'; content: string }
              | { type: 'sources'; sources: AskSource[] }
              | { type: 'done' }
              | { type: 'error'; error: string }

            if (msg.type === 'chunk') {
              setAskAnswer((prev) => (prev ?? '') + msg.content)
            } else if (msg.type === 'sources') {
              setAskSources(msg.sources)
            } else if (msg.type === 'error') {
              setAskError(msg.error)
            }
          } catch {
            // Ignore malformed lines
          }
        }
      }
    } catch (err) {
      setAskError(err instanceof Error ? err.message : 'Failed to get answer')
      setAskLoading(false)
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setSubmitted(false)

    if (mode === 'search') {
      // Debounce instant search
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        runSearch(value, filterCategory, filterSourceType, filterDateRange)
      }, 400)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSubmitted(true)

    if (mode === 'search') {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      runSearch(query, filterCategory, filterSourceType, filterDateRange)
    } else {
      runAsk(query)
    }
  }

  const handleFilterChange = (
    category: string,
    sourceType: string,
    dateRange: string,
  ) => {
    setFilterCategory(category)
    setFilterSourceType(sourceType)
    setFilterDateRange(dateRange)
    if (query.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      runSearch(query, category, sourceType, dateRange)
    }
  }

  const handleModeSwitch = (newMode: Mode) => {
    setMode(newMode)
    setQuery('')
    setSubmitted(false)
    setSearchResults([])
    setSearchError(null)
    setAskAnswer(null)
    setAskSources([])
    setAskError(null)
    setFilterCategory('')
    setFilterSourceType('')
    setFilterDateRange('')
  }

  const isLoading = mode === 'search' ? searchLoading : askLoading

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="mt-1 text-muted-foreground">
          Search your knowledge base or ask a question.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
        <button
          type="button"
          onClick={() => handleModeSwitch('search')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            mode === 'search'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => handleModeSwitch('ask')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            mode === 'ask'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Ask
        </button>
      </div>

      {/* Search / Ask input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="search"
          placeholder={
            mode === 'search'
              ? 'Search your knowledge base…'
              : 'Ask a question about your saved content…'
          }
          value={query}
          onChange={handleInputChange}
          className="flex-1 h-11 text-base"
          autoFocus
        />
        <Button type="submit" disabled={isLoading || !query.trim()} size="lg">
          {isLoading
            ? mode === 'ask'
              ? 'Thinking…'
              : 'Searching…'
            : mode === 'ask'
              ? 'Ask'
              : 'Search'}
        </Button>
      </form>

      {mode === 'search' && (
        <p className="text-xs text-muted-foreground -mt-4">
          Semantic search — results update as you type
        </p>
      )}

      {/* Filters (search mode only) */}
      {mode === 'search' && (
        <div className="flex flex-wrap gap-2 -mt-2">
          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) =>
              handleFilterChange(e.target.value, filterSourceType, filterDateRange)
            }
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Source type filter */}
          <select
            value={filterSourceType}
            onChange={(e) =>
              handleFilterChange(filterCategory, e.target.value, filterDateRange)
            }
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Filter by source type"
          >
            <option value="">All sources</option>
            {Object.entries(SOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Date range filter */}
          <select
            value={filterDateRange}
            onChange={(e) =>
              handleFilterChange(filterCategory, filterSourceType, e.target.value)
            }
            className="h-8 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Filter by date range"
          >
            {DATE_RANGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Error messages */}
      {(searchError || askError) && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {mode === 'search' ? searchError : askError}
        </div>
      )}

      {/* Results / Answer */}
      {mode === 'search' && (query.trim() || searchLoading) && (
        <div className="space-y-2">
          {!searchLoading && searchResults.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </p>
          )}
          <SearchResults
            results={searchResults}
            query={query}
            isLoading={searchLoading}
          />
        </div>
      )}

      {mode === 'ask' && askLoading && (
        <AskAnswer answer="" sources={[]} isLoading />
      )}

      {mode === 'ask' && !askLoading && askAnswer !== null && (
        <AskAnswer answer={askAnswer} sources={askSources} isStreaming={askAnswer !== null && askSources.length === 0} />
      )}
    </div>
  )
}
