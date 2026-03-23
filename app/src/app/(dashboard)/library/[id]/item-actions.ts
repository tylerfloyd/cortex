'use server'

import { and, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { items, categories, tags, itemTags } from '@/lib/db/schema'

export type UpdateItemPayload = {
  category_slug?: string
  tags_to_add?: string[]
  tags_to_remove?: string[]
  user_notes?: string
  is_favorite?: boolean
}

export async function updateItem(itemId: string, payload: UpdateItemPayload): Promise<{ error?: string }> {
  try {
    const existing = await db
      .select({ id: items.id })
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1)

    if (existing.length === 0) {
      return { error: 'Item not found' }
    }

    const updateData: Partial<typeof items.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (payload.user_notes !== undefined) {
      updateData.userNotes = payload.user_notes
    }

    if (payload.is_favorite !== undefined) {
      updateData.isFavorite = payload.is_favorite
    }

    if (payload.category_slug !== undefined) {
      if (!payload.category_slug) {
        updateData.categoryId = null
      } else {
        const catRows = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.slug, payload.category_slug))
          .limit(1)
        if (catRows.length === 0) {
          return { error: 'Category not found' }
        }
        updateData.categoryId = catRows[0].id
      }
    }

    await db.update(items).set(updateData).where(eq(items.id, itemId))

    // Handle tag additions
    if (payload.tags_to_add && payload.tags_to_add.length > 0) {
      for (const tagName of payload.tags_to_add) {
        const slug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        const tagRow = await db
          .select({ id: tags.id })
          .from(tags)
          .where(eq(tags.slug, slug))
          .limit(1)

        let tagId: string
        if (tagRow.length === 0) {
          const inserted = await db
            .insert(tags)
            .values({ name: tagName, slug, isAiGenerated: false })
            .returning({ id: tags.id })
          tagId = inserted[0].id
        } else {
          tagId = tagRow[0].id
        }

        await db
          .insert(itemTags)
          .values({ itemId, tagId })
          .onConflictDoNothing()
      }
    }

    // Handle tag removals
    if (payload.tags_to_remove && payload.tags_to_remove.length > 0) {
      const slugsToRemove = payload.tags_to_remove
      const tagRowsToRemove = await db
        .select({ id: tags.id })
        .from(tags)
        .where(inArray(tags.slug, slugsToRemove))

      if (tagRowsToRemove.length > 0) {
        const tagIdsToRemove = tagRowsToRemove.map((t) => t.id)
        await db
          .delete(itemTags)
          .where(and(eq(itemTags.itemId, itemId), inArray(itemTags.tagId, tagIdsToRemove)))
      }
    }

    revalidatePath(`/library/${itemId}`)
    return {}
  } catch (err) {
    console.error('updateItem error:', err)
    return { error: err instanceof Error ? err.message : 'Failed to save changes' }
  }
}
