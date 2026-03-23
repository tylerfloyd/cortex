'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ingestUrls, type IngestUrlsResult } from '@/app/(dashboard)/inbox/actions'

type Category = {
  id: string
  name: string
  slug: string
}

type InboxFormProps = {
  categories: Category[]
  onIngested?: (result: IngestUrlsResult) => void
}

export function InboxForm({ categories, onIngested }: InboxFormProps) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single')
  const [singleUrl, setSingleUrl] = useState('')
  const [bulkUrls, setBulkUrls] = useState('')
  const [categorySlug, setCategorySlug] = useState('')
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const urls =
      mode === 'single'
        ? [singleUrl]
        : bulkUrls
            .split('\n')
            .map((u) => u.trim())
            .filter(Boolean)

    if (urls.length === 0) {
      setError('Please enter at least one URL.')
      return
    }

    startTransition(async () => {
      const result = await ingestUrls(urls, {
        category_slug: categorySlug || undefined,
        user_notes: notes || undefined,
      })

      if (result.failed.length > 0 && result.succeeded.length === 0) {
        const firstError = result.failed[0]
        setError(firstError.error)
      } else {
        // Reset form on success
        setSingleUrl('')
        setBulkUrls('')
        setNotes('')
        onIngested?.(result)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setMode('single')}
          className={`px-3 py-1 rounded-md transition-colors ${
            mode === 'single'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          Single URL
        </button>
        <button
          type="button"
          onClick={() => setMode('bulk')}
          className={`px-3 py-1 rounded-md transition-colors ${
            mode === 'bulk'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          Bulk (multiple URLs)
        </button>
      </div>

      {/* URL input */}
      {mode === 'single' ? (
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://example.com/article"
            value={singleUrl}
            onChange={(e) => setSingleUrl(e.target.value)}
            className="flex-1 h-10 text-base"
            required
          />
          <Button type="submit" disabled={isPending} size="lg">
            {isPending ? 'Adding…' : 'Add'}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            placeholder="https://example.com/article-1&#10;https://example.com/article-2&#10;https://example.com/article-3"
            value={bulkUrls}
            onChange={(e) => setBulkUrls(e.target.value)}
            className="min-h-32 font-mono text-sm"
            rows={6}
          />
          <p className="text-xs text-muted-foreground">One URL per line</p>
        </div>
      )}

      {/* Category dropdown */}
      {categories.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium shrink-0" htmlFor="inbox-category">
            Category
          </label>
          <select
            id="inbox-category"
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
          >
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Notes (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setShowNotes((v) => !v)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <span>{showNotes ? '▾' : '▸'}</span>
          <span>Add notes (optional)</span>
        </button>
        {showNotes && (
          <Textarea
            placeholder="Notes about this item..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 min-h-16"
            rows={3}
          />
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Submit button for bulk mode */}
      {mode === 'bulk' && (
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Adding URLs…' : 'Add URLs'}
        </Button>
      )}
    </form>
  )
}
