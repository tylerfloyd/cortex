'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PencilIcon, TrashIcon, PlusIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { CategoryRow, ChannelMapping } from './actions'
import {
  createCategory,
  updateCategory,
  deleteCategory,
  acceptAiCategory,
  dismissAiCategory,
  addChannelMapping,
  removeChannelMapping,
} from './actions'

type Props = {
  initialCategories: CategoryRow[]
  initialChannelMappings: ChannelMapping[]
}

type FormState = {
  name: string
  description: string
  color: string
  parent_id: string
}

const DEFAULT_FORM: FormState = { name: '', description: '', color: '#6366f1', parent_id: '' }

export function CategoryManager({ initialCategories, initialChannelMappings }: Props) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<FormState>(DEFAULT_FORM)

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>(DEFAULT_FORM)

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reassignTo, setReassignTo] = useState<string>('none')
  const [deleteItemCount, setDeleteItemCount] = useState(0)

  // Channel mappings
  const [channelMappings, setChannelMappings] = useState<ChannelMapping[]>(initialChannelMappings)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelCategory, setNewChannelCategory] = useState('')

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

  function handleCreateChange(field: keyof FormState, value: string) {
    setCreateForm((f) => ({ ...f, [field]: value }))
  }

  function handleEditChange(field: keyof FormState, value: string) {
    setEditForm((f) => ({ ...f, [field]: value }))
  }

  function startEdit(cat: CategoryRow) {
    setEditingId(cat.id)
    setEditForm({
      name: cat.name,
      description: cat.description ?? '',
      color: cat.color ?? '#6366f1',
      parent_id: cat.parentId ?? '',
    })
  }

  function handleCreate() {
    const fd = new FormData()
    fd.append('name', createForm.name)
    fd.append('description', createForm.description)
    fd.append('color', createForm.color)
    if (createForm.parent_id) fd.append('parent_id', createForm.parent_id)

    startTransition(async () => {
      const result = await createCategory(fd)
      if (result.error) {
        showMsg(result.error, true)
      } else {
        setShowCreate(false)
        setCreateForm(DEFAULT_FORM)
        showMsg('Category created.')
        reloadPage()
      }
    })
  }

  function handleUpdate() {
    if (!editingId) return
    const fd = new FormData()
    fd.append('name', editForm.name)
    fd.append('description', editForm.description)
    fd.append('color', editForm.color)
    if (editForm.parent_id) fd.append('parent_id', editForm.parent_id)

    startTransition(async () => {
      const result = await updateCategory(editingId, fd)
      if (result.error) {
        showMsg(result.error, true)
      } else {
        setEditingId(null)
        showMsg('Category updated.')
        reloadPage()
      }
    })
  }

  function handleDeleteClick(cat: CategoryRow) {
    if (cat.itemCount > 0) {
      setDeleteItemCount(cat.itemCount)
      setReassignTo('none')
      setDeletingId(cat.id)
    } else {
      startTransition(async () => {
        const result = await deleteCategory(cat.id, null)
        if (result.error) {
          showMsg(result.error, true)
        } else if (result.needsReassign) {
          setDeleteItemCount(result.itemCount ?? 0)
          setReassignTo('none')
          setDeletingId(cat.id)
        } else {
          showMsg('Category deleted.')
          reloadPage()
        }
      })
    }
  }

  function handleDeleteConfirm() {
    if (!deletingId) return
    startTransition(async () => {
      const result = await deleteCategory(deletingId, reassignTo)
      if (result.error) {
        showMsg(result.error, true)
        setDeletingId(null)
      } else {
        setDeletingId(null)
        showMsg('Category deleted.')
        reloadPage()
      }
    })
  }

  function handleAcceptAi(id: string) {
    startTransition(async () => {
      await acceptAiCategory(id)
      showMsg('Category accepted.')
      reloadPage()
    })
  }

  function handleDismissAi(id: string) {
    startTransition(async () => {
      await dismissAiCategory(id)
      showMsg('AI suggestion dismissed.')
      reloadPage()
    })
  }

  function handleAddChannelMapping() {
    if (!newChannelName.trim() || !newChannelCategory) return
    startTransition(async () => {
      const result = await addChannelMapping(newChannelName, newChannelCategory)
      if (result.error) {
        showMsg(result.error, true)
      } else {
        setNewChannelName('')
        setNewChannelCategory('')
        showMsg('Channel mapping added.')
        reloadPage()
      }
    })
  }

  function handleRemoveChannelMapping(channelId: string) {
    startTransition(async () => {
      const result = await removeChannelMapping(channelId)
      if (result.error) {
        showMsg(result.error, true)
      } else {
        setChannelMappings((prev) => prev.filter((m) => m.discordChannelId !== channelId))
        showMsg('Channel mapping removed.')
      }
    })
  }

  const confirmed = categories.filter((c) => !c.isAiSuggested)
  const aiSuggested = categories.filter((c) => c.isAiSuggested)
  // Build parent name lookup
  const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]))

  return (
    <div className="space-y-6">
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Categories</h2>
          <p className="text-sm text-muted-foreground">{confirmed.length} categories</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <PlusIcon />
          New Category
        </Button>
      </div>

      {/* Category list */}
      <div className="rounded-lg border divide-y">
        {confirmed.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No categories yet. Create one to get started.
          </div>
        )}
        {confirmed.map((cat) => (
          <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
            {cat.color && (
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{cat.name}</span>
                {cat.parentId && categoryById[cat.parentId] && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <ChevronRightIcon className="size-3" />
                    child of {categoryById[cat.parentId].name}
                  </span>
                )}
                <Badge variant="outline" className="text-xs">{cat.itemCount} items</Badge>
              </div>
              {cat.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{cat.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => startEdit(cat)}
                disabled={isPending}
              >
                <PencilIcon />
                <span className="sr-only">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDeleteClick(cat)}
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

      {/* AI Suggestions */}
      {aiSuggested.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            AI Suggested ({aiSuggested.length})
          </h3>
          <div className="rounded-lg border divide-y">
            {aiSuggested.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
                {cat.color && (
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{cat.name}</span>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{cat.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAcceptAi(cat.id)}
                    disabled={isPending}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismissAi(cat.id)}
                    disabled={isPending}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discord Channel Mapping */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Discord Channel Mapping</h2>
          <p className="text-sm text-muted-foreground">Map Discord channels to categories so ingested messages are auto-classified.</p>
        </div>

        {/* Existing mappings */}
        <div className="rounded-lg border divide-y">
          {channelMappings.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No channel mappings yet.
            </div>
          )}
          {channelMappings.map((m) => (
            <div key={m.discordChannelId} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm">#{m.discordChannelName}</span>
                <span className="text-muted-foreground text-sm mx-2">→</span>
                <span className="text-sm">{m.categoryName}</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRemoveChannelMapping(m.discordChannelId)}
                disabled={isPending}
                className="text-destructive hover:text-destructive shrink-0"
              >
                <TrashIcon />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          ))}
        </div>

        {/* Add new mapping */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="channel-name"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddChannelMapping() }}
          />
          <select
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={newChannelCategory}
            onChange={(e) => setNewChannelCategory(e.target.value)}
          >
            <option value="">Select category…</option>
            {confirmed.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={handleAddChannelMapping}
            disabled={isPending || !newChannelName.trim() || !newChannelCategory}
          >
            <PlusIcon />
            Add
          </Button>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>
          <CategoryForm
            form={createForm}
            onChange={handleCreateChange}
            categories={confirmed}
            currentId={null}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isPending || !createForm.name.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editingId !== null} onOpenChange={(open) => { if (!open) setEditingId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <CategoryForm
            form={editForm}
            onChange={handleEditChange}
            categories={confirmed}
            currentId={editingId}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isPending || !editForm.name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deletingId !== null} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This category has {deleteItemCount} item{deleteItemCount === 1 ? '' : 's'}.
              Choose what to do with them:
            </p>
            <div className="space-y-1">
              <label className="text-sm font-medium">Reassign items to:</label>
              <select
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={reassignTo}
                onChange={(e) => setReassignTo(e.target.value)}
              >
                <option value="none">Unassign (no category)</option>
                {confirmed
                  .filter((c) => c.id !== deletingId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isPending}>
              Delete & Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type CategoryFormProps = {
  form: FormState
  onChange: (field: keyof FormState, value: string) => void
  categories: CategoryRow[]
  currentId: string | null
}

function CategoryForm({ form, onChange, categories, currentId }: CategoryFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Name *</label>
        <input
          type="text"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="e.g. Machine Learning"
          value={form.name}
          onChange={(e) => onChange('name', e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Description</label>
        <textarea
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          rows={2}
          placeholder="Optional description"
          value={form.description}
          onChange={(e) => onChange('description', e.target.value)}
        />
      </div>
      <div className="flex gap-4 items-end">
        <div className="space-y-1 flex-1">
          <label className="text-sm font-medium">Color</label>
          <input
            type="color"
            className="h-9 w-full rounded-lg border border-input cursor-pointer"
            value={form.color || '#6366f1'}
            onChange={(e) => onChange('color', e.target.value)}
          />
        </div>
        <div className="space-y-1 flex-1">
          <label className="text-sm font-medium">Parent Category</label>
          <select
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={form.parent_id}
            onChange={(e) => onChange('parent_id', e.target.value)}
          >
            <option value="">None (top-level)</option>
            {categories
              .filter((c) => c.id !== currentId)
              .map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </select>
        </div>
      </div>
    </div>
  )
}
