'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

type Category = {
  id: string
  name: string
  slug: string
}

type Tag = {
  id: string
  name: string
  slug: string
}

type UpdatePayload = {
  category_slug?: string
  tags_to_add?: string[]
  tags_to_remove?: string[]
  user_notes?: string
  is_favorite?: boolean
}

type ItemEditFormProps = {
  categories: Category[]
  currentCategorySlug: string | null
  currentTags: Tag[]
  currentUserNotes: string | null
  isFavorite: boolean
  updateAction: (payload: UpdatePayload) => Promise<{ error?: string }>
}

export function ItemEditForm({
  categories,
  currentCategorySlug,
  currentTags,
  currentUserNotes,
  isFavorite,
  updateAction,
}: ItemEditFormProps) {
  const [isPending, startTransition] = useTransition()

  const [categorySlug, setCategorySlug] = useState(currentCategorySlug ?? '')
  const [userNotes, setUserNotes] = useState(currentUserNotes ?? '')
  const [favorite, setFavorite] = useState(isFavorite)
  const [tags, setTags] = useState<Tag[]>(currentTags)
  const [newTagInput, setNewTagInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const save = () => {
    setError(null)
    setSaved(false)

    const tagsToAdd: string[] = []
    const tagsToRemove: string[] = []

    // Compute added tags (present now but not in original)
    const originalSlugs = new Set(currentTags.map((t) => t.slug))
    const currentSlugs = new Set(tags.map((t) => t.slug))

    for (const tag of tags) {
      if (!originalSlugs.has(tag.slug)) {
        tagsToAdd.push(tag.name)
      }
    }
    for (const tag of currentTags) {
      if (!currentSlugs.has(tag.slug)) {
        tagsToRemove.push(tag.slug)
      }
    }

    startTransition(async () => {
      const result = await updateAction({
        category_slug: categorySlug || undefined,
        tags_to_add: tagsToAdd.length > 0 ? tagsToAdd : undefined,
        tags_to_remove: tagsToRemove.length > 0 ? tagsToRemove : undefined,
        user_notes: userNotes,
        is_favorite: favorite,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setSaved(true)
      }
    })
  }

  const addTag = () => {
    const name = newTagInput.trim()
    if (!name) return
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    if (tags.some((t) => t.slug === slug)) {
      setNewTagInput('')
      return
    }
    setTags([...tags, { id: '', name, slug }])
    setNewTagInput('')
  }

  const removeTag = (slug: string) => {
    setTags(tags.filter((t) => t.slug !== slug))
  }

  return (
    <div className="space-y-4">
      {/* Favorite toggle */}
      <div className="flex items-center gap-2">
        <input
          id="favorite"
          type="checkbox"
          checked={favorite}
          onChange={(e) => setFavorite(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="favorite" className="text-sm cursor-pointer">
          ⭐ Mark as favorite
        </label>
      </div>

      {/* Category */}
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="category">
          Category
        </label>
        <select
          id="category"
          value={categorySlug}
          onChange={(e) => setCategorySlug(e.target.value)}
          className="w-full text-sm border border-input rounded-md px-2 py-1.5 bg-background"
        >
          <option value="">— No category —</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Tags</label>
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.map((tag) => (
            <Badge key={tag.slug} variant="secondary" className="gap-1">
              {tag.name}
              <button
                onClick={() => removeTag(tag.slug)}
                className="ml-0.5 hover:text-destructive"
                aria-label={`Remove ${tag.name}`}
              >
                ×
              </button>
            </Badge>
          ))}
          {tags.length === 0 && (
            <span className="text-xs text-muted-foreground">No tags</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
            }}
            placeholder="Add tag..."
            className="flex-1 text-sm border border-input rounded-md px-2 py-1 bg-background"
          />
          <Button variant="outline" size="sm" onClick={addTag} type="button">
            Add
          </Button>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="notes">
          Notes
        </label>
        <Textarea
          id="notes"
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
          placeholder="Add your personal notes..."
          className="text-sm"
          rows={4}
        />
      </div>

      {/* Save button */}
      <div className="space-y-1">
        <Button onClick={save} disabled={isPending} className="w-full">
          {isPending ? 'Saving…' : 'Save changes'}
        </Button>
        {saved && (
          <p className="text-xs text-center text-green-600">Changes saved.</p>
        )}
        {error && (
          <p className="text-xs text-center text-destructive">{error}</p>
        )}
      </div>
    </div>
  )
}
