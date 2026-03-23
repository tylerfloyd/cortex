'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { TrashIcon, MergeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { TagRow } from './actions'
import { deleteTag, mergeTags } from './actions'

type Props = {
  initialTags: TagRow[]
}

export function TagManager({ initialTags }: Props) {
  const router = useRouter()
  const [tags] = useState(initialTags)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [filterUnused, setFilterUnused] = useState(false)

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Merge
  const [showMerge, setShowMerge] = useState(false)
  const [mergeSourceId, setMergeSourceId] = useState('')
  const [mergeTargetId, setMergeTargetId] = useState('')

  function showMsg(msg: string, isError = false) {
    if (isError) {
      setError(msg)
      setSuccess(null)
    } else {
      setSuccess(msg)
      setError(null)
    }
    setTimeout(() => {
      setError(null)
      setSuccess(null)
    }, 5000)
  }

  function reloadPage() {
    router.refresh()
  }

  function handleDeleteConfirm() {
    if (!deletingId) return
    startTransition(async () => {
      const result = await deleteTag(deletingId)
      if (result.error) {
        showMsg(result.error, true)
      } else {
        showMsg('Tag deleted.')
      }
      setDeletingId(null)
      reloadPage()
    })
  }

  function handleMerge() {
    if (!mergeSourceId || !mergeTargetId) return
    startTransition(async () => {
      const result = await mergeTags(mergeSourceId, mergeTargetId)
      if (result.error) {
        showMsg(result.error, true)
      } else {
        showMsg(`Merged. ${result.itemsUpdated ?? 0} items updated.`)
        setShowMerge(false)
        setMergeSourceId('')
        setMergeTargetId('')
        reloadPage()
      }
    })
  }

  const visibleTags = filterUnused ? tags.filter((t) => t.usageCount === 0) : tags
  const deletingTag = tags.find((t) => t.id === deletingId)

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800 px-4 py-3 text-sm text-green-800 dark:text-green-200">
          {success}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Tags</h2>
          <p className="text-sm text-muted-foreground">
            {tags.length} tags &middot; {tags.filter((t) => t.usageCount === 0).length} unused
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterUnused((v) => !v)}
          >
            {filterUnused ? 'Show All' : 'Show Unused'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMergeSourceId('')
              setMergeTargetId('')
              setShowMerge(true)
            }}
          >
            <MergeIcon />
            Merge Tags
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        {visibleTags.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            {filterUnused ? 'No unused tags.' : 'No tags yet.'}
          </div>
        )}
        <div className="divide-y">
          {visibleTags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="flex-1 text-sm font-medium">{tag.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant={tag.usageCount === 0 ? 'outline' : 'secondary'}
                  className="tabular-nums"
                >
                  {tag.usageCount}
                </Badge>
                {tag.isAiGenerated && (
                  <Badge variant="outline" className="text-xs">AI</Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeletingId(tag.id)}
                  disabled={isPending}
                  className="text-destructive hover:text-destructive"
                >
                  <TrashIcon />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirm Dialog */}
      <Dialog open={deletingId !== null} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete tag <strong>{deletingTag?.name}</strong>?
            {(deletingTag?.usageCount ?? 0) > 0 && (
              <> It is used by {deletingTag?.usageCount} item{deletingTag?.usageCount === 1 ? '' : 's'}. Those associations will be removed.</>
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={showMerge} onOpenChange={setShowMerge}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The source tag will be deleted. All items that had the source tag will gain the target tag.
            </p>
            <div className="space-y-1">
              <label className="text-sm font-medium">Source tag (will be deleted)</label>
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={mergeSourceId}
                onChange={(e) => setMergeSourceId(e.target.value)}
              >
                <option value="">Select source tag...</option>
                {tags
                  .filter((t) => t.id !== mergeTargetId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.usageCount})
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Target tag (kept)</label>
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value)}
              >
                <option value="">Select target tag...</option>
                {tags
                  .filter((t) => t.id !== mergeSourceId)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.usageCount})
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMerge(false)}>Cancel</Button>
            <Button
              onClick={handleMerge}
              disabled={isPending || !mergeSourceId || !mergeTargetId}
            >
              Merge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
