'use client'

import Link from 'next/link'
import { SourceIcon } from '@/components/items/SourceIcon'
import { Badge } from '@/components/ui/badge'
import { truncateUrl } from '@/lib/format'

export type SearchResult = {
  id: string
  title: string | null
  url: string
  summary: string | null
  category: string | null
  source_type: string
  similarity: number | null
}

type SearchResultsProps = {
  results: SearchResult[]
  query: string
  isLoading?: boolean
}

function highlightTerms(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text

  const terms = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))

  if (terms.length === 0) return text

  const pattern = new RegExp(`(${terms.join('|')})`, 'gi')
  const parts = text.split(pattern)

  return (
    <>
      {parts.map((part, i) =>
        pattern.test(part) ? (
          <mark
            key={i}
            className="bg-yellow-200 dark:bg-yellow-800/60 text-foreground rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

function SimilarityBadge({ score }: { score: number | null }) {
  if (score === null) return null
  const pct = Math.round(score * 100)
  const variant =
    pct >= 80 ? 'default' : pct >= 60 ? 'secondary' : 'outline'
  return (
    <Badge variant={variant} className="text-xs font-mono">
      {pct}% match
    </Badge>
  )
}

export function SearchResults({ results, query, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-full mb-1" />
            <div className="h-3 bg-muted rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        No results found. Try a different search query.
      </div>
    )
  }

  return (
    <ul className="space-y-3">
      {results.map((result) => {
        const displayTitle = result.title ?? truncateUrl(result.url)
        const summarySnippet = result.summary
          ? result.summary.slice(0, 200) + (result.summary.length > 200 ? '…' : '')
          : null

        return (
          <li key={result.id}>
            <Link
              href={`/library/${result.id}`}
              className="block rounded-xl border bg-card p-4 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <SourceIcon sourceType={result.source_type} className="shrink-0" />
                  <span className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {displayTitle}
                  </span>
                </div>
                <SimilarityBadge score={result.similarity} />
              </div>

              <div className="flex items-center gap-2 mb-2">
                {result.category && (
                  <Badge variant="secondary" className="text-xs">
                    {result.category}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground truncate">
                  {truncateUrl(result.url)}
                </span>
              </div>

              {summarySnippet && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {highlightTerms(summarySnippet, query)}
                </p>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
