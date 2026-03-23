'use client'

import Link from 'next/link'
import { truncateUrl } from '@/lib/format'

export type AskSource = {
  id: string
  title: string
  url: string
  relevance?: number
}

type AskAnswerProps = {
  answer: string
  sources: AskSource[]
  isLoading?: boolean
  isStreaming?: boolean
}

export function AskAnswer({ answer, sources, isLoading, isStreaming }: AskAnswerProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="rounded-xl border bg-card p-5 space-y-2">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-4/5" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
        <div className="h-3 bg-muted rounded w-32" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Answer */}
      <div className="rounded-xl border bg-card p-5">
        <div className="text-sm text-muted-foreground mb-1 font-medium uppercase tracking-wider text-xs">
          Answer
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {answer}
          {isStreaming && (
            <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse align-middle" aria-hidden="true" />
          )}
        </p>
      </div>

      {/* Sources */}
      {sources.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Sources ({sources.length})
          </h3>
          <ul className="space-y-1.5">
            {sources.map((source, i) => {
              const label = source.title && source.title !== source.url
                ? source.title
                : truncateUrl(source.url)
              const href = source.id
                ? `/library/${source.id}`
                : source.url

              return (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground mt-0.5 font-mono shrink-0">
                    [{i + 1}]
                  </span>
                  <Link
                    href={href}
                    target={source.id ? undefined : '_blank'}
                    rel={source.id ? undefined : 'noopener noreferrer'}
                    className="text-sm text-primary hover:underline line-clamp-1"
                    title={source.url}
                  >
                    {label}
                  </Link>
                  {source.relevance !== undefined && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      ({Math.round(source.relevance * 100)}%)
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
