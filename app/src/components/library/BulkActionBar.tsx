'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type Category = {
  id: string
  name: string
  slug: string
}

type BulkActionBarProps = {
  selectedCount: number
  categories: Category[]
  onCategorize: (categorySlug: string) => Promise<void>
  onDelete: () => Promise<void>
  onClearSelection: () => void
}

export function BulkActionBar({
  selectedCount,
  categories,
  onCategorize,
  onDelete,
  onClearSelection,
}: BulkActionBarProps) {
  const [categorizeOpen, setCategorizeOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  if (selectedCount === 0) return null

  async function handleCategorize(slug: string) {
    setLoading(true)
    try {
      await onCategorize(slug)
      setCategorizeOpen(false)
      onClearSelection()
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      await onDelete()
      setDeleteOpen(false)
      onClearSelection()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-border bg-background shadow-lg px-4 py-3">
      <span className="text-sm font-medium">
        {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
      </span>
      <div className="h-4 w-px bg-border" />

      {/* Re-categorize dialog */}
      <Dialog open={categorizeOpen} onOpenChange={setCategorizeOpen}>
        <DialogTrigger render={<button />} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3 py-1 disabled:pointer-events-none disabled:opacity-50" disabled={loading}>
          Re-categorize
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Re-categorize {selectedCount} item{selectedCount !== 1 ? 's' : ''}</DialogTitle>
          <div className="mt-3 flex flex-col gap-1 max-h-64 overflow-y-auto">
            <button
              className="text-left rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => handleCategorize('')}
              disabled={loading}
            >
              <span className="text-muted-foreground">— Remove category</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className="text-left rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
                onClick={() => handleCategorize(cat.slug)}
                disabled={loading}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <DialogClose render={<button />} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-8 px-3 py-1">
              Cancel
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger render={<button />} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-8 px-3 py-1 text-destructive disabled:pointer-events-none disabled:opacity-50" disabled={loading}>
          Delete
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Delete {selectedCount} item{selectedCount !== 1 ? 's' : ''}?</DialogTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            This will permanently delete the selected items and their markdown files. This action cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <DialogClose render={<button />} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-8 px-3 py-1">
              Cancel
            </DialogClose>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button variant="ghost" size="sm" onClick={onClearSelection} disabled={loading}>
        Clear
      </Button>
    </div>
  )
}
