'use client'

import { useState } from 'react'
import { InboxForm } from '@/components/inbox/InboxForm'
import { ProcessingQueue } from '@/components/inbox/ProcessingQueue'
import type { IngestUrlsResult } from './actions'
import type { QueueItem } from './actions'

type Category = {
  id: string
  name: string
  slug: string
}

type InboxClientProps = {
  categories: Category[]
  initialQueueItems: QueueItem[]
}

export function InboxClient({ categories, initialQueueItems }: InboxClientProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [warningMessages, setWarningMessages] = useState<string[]>([])

  function handleIngested(result: IngestUrlsResult) {
    const { succeeded, failed } = result

    if (succeeded.length > 0) {
      setSuccessMessage(
        succeeded.length === 1
          ? `Added 1 URL to the processing queue.`
          : `Added ${succeeded.length} URLs to the processing queue.`
      )
    } else {
      setSuccessMessage(null)
    }

    const warnings: string[] = []
    for (const f of failed) {
      if (f.duplicate) {
        warnings.push(`Already exists: ${f.url}`)
      } else {
        warnings.push(`Failed (${f.error}): ${f.url}`)
      }
    }
    setWarningMessages(warnings)

    // Clear messages after 8 seconds
    setTimeout(() => {
      setSuccessMessage(null)
      setWarningMessages([])
    }, 8000)
  }

  return (
    <div className="space-y-6">
      <InboxForm categories={categories} onIngested={handleIngested} />

      {successMessage && (
        <div className="rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800 px-4 py-3 text-sm text-green-800 dark:text-green-200">
          {successMessage}
        </div>
      )}

      {warningMessages.length > 0 && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
          {warningMessages.map((msg, i) => (
            <p key={i}>{msg}</p>
          ))}
        </div>
      )}

      <div>
        <h2 className="text-base font-semibold mb-3">Processing Queue</h2>
        <ProcessingQueue initialItems={initialQueueItems} />
      </div>
    </div>
  )
}
