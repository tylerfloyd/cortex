'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { SourceIcon } from '@/components/items/SourceIcon'
import { truncateUrl, relativeTime } from '@/lib/format'
import type { QueueItem } from '@/app/(dashboard)/inbox/actions'

type ProcessingQueueProps = {
  initialItems: QueueItem[]
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Queued',
  processing: 'Extracting content',
  'ai-complete': 'AI processing done',
  completed: 'Completed',
  failed: 'Failed',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-muted-foreground',
  processing: 'text-blue-600 dark:text-blue-400',
  'ai-complete': 'text-yellow-600 dark:text-yellow-400',
  completed: 'text-green-600 dark:text-green-400',
  failed: 'text-destructive',
}

const STATUS_DOT_COLORS: Record<string, string> = {
  pending: 'bg-muted-foreground',
  processing: 'bg-blue-500 animate-pulse',
  'ai-complete': 'bg-yellow-500 animate-pulse',
  completed: 'bg-green-500',
  failed: 'bg-destructive',
}

const PIPELINE_STEPS = [
  { key: 'pending', label: 'Queued' },
  { key: 'processing', label: 'Extracting' },
  { key: 'ai-complete', label: 'AI Processing' },
  { key: 'completed', label: 'Done' },
]

function getStepIndex(status: string | null): number {
  if (!status) return 0
  const idx = PIPELINE_STEPS.findIndex((s) => s.key === status)
  return idx >= 0 ? idx : (status === 'completed' ? 3 : 0)
}

function PipelineProgress({ status }: { status: string | null }) {
  const currentStep = getStepIndex(status)

  return (
    <div className="flex items-center gap-1 mt-1">
      {PIPELINE_STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center">
          <div
            className={`h-1.5 rounded-full transition-all ${
              i <= currentStep
                ? status === 'failed'
                  ? 'bg-destructive'
                  : 'bg-primary'
                : 'bg-muted'
            } ${i === currentStep && status !== 'completed' && status !== 'failed' ? 'animate-pulse' : ''}`}
            style={{ width: i === 0 ? '12px' : '24px' }}
          />
          {i < PIPELINE_STEPS.length - 1 && (
            <div
              className={`h-px w-2 ${i < currentStep ? 'bg-primary' : 'bg-muted'}`}
            />
          )}
        </div>
      ))}
      <span className="text-xs text-muted-foreground ml-1">
        {status === 'failed' ? 'Failed' : PIPELINE_STEPS[currentStep]?.label ?? status}
      </span>
    </div>
  )
}

export function ProcessingQueue({ initialItems }: ProcessingQueueProps) {
  const [items, setItems] = useState<QueueItem[]>(initialItems)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const hasActiveItems = items.some(
    (item) =>
      item.processingStatus === 'pending' ||
      item.processingStatus === 'processing' ||
      item.processingStatus === 'ai-complete'
  )

  useEffect(() => {
    async function fetchQueue() {
      try {
        const res = await fetch('/api/items/processing')
        if (!res.ok) return
        const data = (await res.json()) as { items: QueueItem[] }
        setItems(data.items ?? [])
      } catch {
        // Silently ignore fetch errors — keep showing stale data
      }
    }

    if (!hasActiveItems) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    void fetchQueue()
    intervalRef.current = setInterval(() => {
      void fetchQueue()
    }, 5000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [hasActiveItems])

  if (items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        No items currently processing. Add a URL above to get started.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {hasActiveItems && (
        <p className="text-xs text-muted-foreground">
          Auto-refreshing every 5 seconds
        </p>
      )}
      <ul className="divide-y divide-border rounded-xl border overflow-hidden">
        {items.map((item) => {
          const status = item.processingStatus ?? 'pending'
          const displayTitle = item.title ?? truncateUrl(item.url)

          return (
            <li
              key={item.id}
              className="flex items-start gap-3 px-4 py-3 bg-card hover:bg-muted/30 transition-colors"
            >
              {/* Status dot */}
              <div className="mt-1.5 shrink-0">
                <div
                  className={`size-2 rounded-full ${STATUS_DOT_COLORS[status] ?? 'bg-muted-foreground'}`}
                />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <SourceIcon sourceType={item.sourceType} className="shrink-0" />
                  <span className="text-sm font-medium truncate">{displayTitle}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span
                    className={`text-xs font-medium ${STATUS_COLORS[status] ?? 'text-muted-foreground'}`}
                  >
                    {STATUS_LABELS[status] ?? status}
                  </span>
                  {item.createdAt && (
                    <span className="text-xs text-muted-foreground">
                      {relativeTime(item.createdAt)}
                    </span>
                  )}
                </div>
                <PipelineProgress status={status} />
              </div>

              {/* Link to item if available */}
              {status === 'completed' && (
                <Link
                  href={`/library/${item.id}`}
                  className="text-xs text-primary hover:underline shrink-0 mt-1"
                >
                  View →
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
