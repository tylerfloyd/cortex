'use server'

import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import fs from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'
import { categories, tags, items, itemTags } from '@/lib/db/schema'
import { KNOWLEDGE_DIR } from '@/lib/export/config'
import { slugify } from '@/lib/slugify'

// ── Channel mapping actions ───────────────────────────────────────

const CHANNEL_MAPPINGS_PATH = path.join(KNOWLEDGE_DIR, '_channel_mappings.json')

export type ChannelMapping = {
  discordChannelId: string
  discordChannelName: string
  categorySlug: string
  categoryName: string
}

async function readMappings(): Promise<ChannelMapping[]> {
  try {
    const raw = await fs.readFile(CHANNEL_MAPPINGS_PATH, 'utf-8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as ChannelMapping[]
  } catch {
    return []
  }
}

async function writeMappings(mappings: ChannelMapping[]): Promise<void> {
  await fs.mkdir(KNOWLEDGE_DIR, { recursive: true })
  await fs.writeFile(CHANNEL_MAPPINGS_PATH, JSON.stringify(mappings, null, 2), 'utf-8')
}

export async function getChannelMappings(): Promise<ChannelMapping[]> {
  return readMappings()
}

export async function addChannelMapping(
  channelName: string,
  categorySlug: string,
): Promise<{ error?: string }> {
  const name = channelName.trim()
  const slug = categorySlug.trim()
  if (!name || !slug) return { error: 'Channel name and category are required' }

  // Validate category exists
  const categoryRow = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1)

  if (categoryRow.length === 0) {
    return { error: `Category "${slug}" does not exist` }
  }

  const categoryName = categoryRow[0].name

  const mappings = await readMappings()
  // Use channel name as a synthetic ID (consistent with the channel-name-based approach)
  const channelId = name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
  const filtered = mappings.filter((m) => m.discordChannelId !== channelId)
  filtered.push({ discordChannelId: channelId, discordChannelName: name, categorySlug: slug, categoryName })

  try {
    await writeMappings(filtered)
    revalidatePath('/taxonomy')
    return {}
  } catch (err) {
    console.error('[addChannelMapping]', err)
    return { error: 'Failed to save channel mapping' }
  }
}

export async function removeChannelMapping(channelId: string): Promise<{ error?: string }> {
  const mappings = await readMappings()
  const filtered = mappings.filter((m) => m.discordChannelId !== channelId)
  try {
    await writeMappings(filtered)
    revalidatePath('/taxonomy')
    return {}
  } catch (err) {
    console.error('[removeChannelMapping]', err)
    return { error: 'Failed to remove channel mapping' }
  }
}

// ── Category actions ──────────────────────────────────────────────

export type CategoryRow = {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  parentId: string | null
  isAiSuggested: boolean | null
  createdAt: Date | null
  itemCount: number
}

export async function getCategories(): Promise<CategoryRow[]> {
  try {
    return await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        color: categories.color,
        parentId: categories.parentId,
        isAiSuggested: categories.isAiSuggested,
        createdAt: categories.createdAt,
        itemCount: sql<number>`count(${items.id})::int`,
      })
      .from(categories)
      .leftJoin(items, eq(items.categoryId, categories.id))
      .groupBy(
        categories.id,
        categories.name,
        categories.slug,
        categories.description,
        categories.color,
        categories.parentId,
        categories.isAiSuggested,
        categories.createdAt,
      )
      .orderBy(categories.name)
  } catch {
    return []
  }
}

export async function createCategory(formData: FormData): Promise<{ error?: string }> {
  const name = (formData.get('name') as string | null)?.trim()
  if (!name) return { error: 'Name is required' }

  const description = (formData.get('description') as string | null)?.trim() || null
  const color = (formData.get('color') as string | null)?.trim() || null
  const parentId = (formData.get('parent_id') as string | null) || null

  const slug = slugify(name)

  try {
    await db.insert(categories).values({
      name,
      slug,
      description,
      color,
      parentId,
      isAiSuggested: false,
    })
    revalidatePath('/taxonomy')
    return {}
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === '23505'
    ) {
      return { error: 'A category with that name already exists' }
    }
    console.error('[createCategory]', err)
    return { error: 'Failed to create category' }
  }
}

export async function updateCategory(
  id: string,
  formData: FormData,
): Promise<{ error?: string }> {
  const name = (formData.get('name') as string | null)?.trim()
  if (!name) return { error: 'Name is required' }

  const description = (formData.get('description') as string | null)?.trim() || null
  const color = (formData.get('color') as string | null)?.trim() || null
  const parentId = (formData.get('parent_id') as string | null) || null

  const slug = slugify(name)

  try {
    await db
      .update(categories)
      .set({ name, slug, description, color, parentId })
      .where(eq(categories.id, id))
    revalidatePath('/taxonomy')
    return {}
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === '23505'
    ) {
      return { error: 'A category with that name already exists' }
    }
    console.error('[updateCategory]', err)
    return { error: 'Failed to update category' }
  }
}

export async function deleteCategory(
  id: string,
  reassignTo: string | null,
): Promise<{ error?: string; needsReassign?: boolean; itemCount?: number }> {
  // Count items in this category
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(items)
    .where(eq(items.categoryId, id))

  const itemCount = countRow?.count ?? 0

  if (itemCount > 0 && reassignTo === null) {
    return { needsReassign: true, itemCount }
  }

  if (itemCount > 0 && reassignTo !== null) {
    if (reassignTo === 'none') {
      await db.transaction(async (tx) => {
        await tx.update(items).set({ categoryId: null }).where(eq(items.categoryId, id))
        await tx.delete(categories).where(eq(categories.id, id))
      })
    } else {
      // Validate target exists before starting the transaction
      const target = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, reassignTo))
        .limit(1)
      if (target.length === 0) {
        return { error: 'Reassign target category not found' }
      }
      await db.transaction(async (tx) => {
        await tx.update(items).set({ categoryId: reassignTo }).where(eq(items.categoryId, id))
        await tx.delete(categories).where(eq(categories.id, id))
      })
    }
    revalidatePath('/taxonomy')
    return {}
  }

  await db.delete(categories).where(eq(categories.id, id))
  revalidatePath('/taxonomy')
  return {}
}

export async function acceptAiCategory(id: string): Promise<{ error?: string }> {
  await db
    .update(categories)
    .set({ isAiSuggested: false })
    .where(eq(categories.id, id))
  revalidatePath('/taxonomy')
  return {}
}

export async function dismissAiCategory(id: string): Promise<{ error?: string }> {
  await db.delete(categories).where(eq(categories.id, id))
  revalidatePath('/taxonomy')
  return {}
}

// ── Tag actions ───────────────────────────────────────────────────

export type TagRow = {
  id: string
  name: string
  slug: string
  isAiGenerated: boolean | null
  usageCount: number
  createdAt: Date | null
}

export async function getTags(): Promise<TagRow[]> {
  try {
    return await db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
        isAiGenerated: tags.isAiGenerated,
        usageCount: sql<number>`count(${itemTags.tagId})::int`,
        createdAt: tags.createdAt,
      })
      .from(tags)
      .leftJoin(itemTags, sql`${itemTags.tagId} = ${tags.id}`)
      .groupBy(tags.id, tags.name, tags.slug, tags.isAiGenerated, tags.createdAt)
      .orderBy(sql`count(${itemTags.tagId}) desc`, tags.name)
  } catch {
    return []
  }
}

export async function deleteTag(id: string): Promise<{ error?: string }> {
  await db.delete(tags).where(eq(tags.id, id))
  revalidatePath('/taxonomy')
  return {}
}

export async function mergeTags(
  sourceId: string,
  targetId: string,
): Promise<{ error?: string; itemsUpdated?: number }> {
  if (sourceId === targetId) {
    return { error: 'Source and target tags must be different' }
  }

  const [source, target] = await Promise.all([
    db.select({ id: tags.id }).from(tags).where(eq(tags.id, sourceId)).limit(1),
    db.select({ id: tags.id }).from(tags).where(eq(tags.id, targetId)).limit(1),
  ])

  if (source.length === 0) return { error: 'Source tag not found' }
  if (target.length === 0) return { error: 'Target tag not found' }

  let updated = 0

  await db.transaction(async (tx) => {
    const sourceItemTags = await tx
      .select({ itemId: itemTags.itemId })
      .from(itemTags)
      .where(eq(itemTags.tagId, sourceId))

    for (const { itemId } of sourceItemTags) {
      const existing = await tx
        .select({ itemId: itemTags.itemId })
        .from(itemTags)
        .where(
          sql`${itemTags.itemId} = ${itemId} AND ${itemTags.tagId} = ${targetId}`
        )
        .limit(1)

      if (existing.length === 0) {
        await tx.insert(itemTags).values({ itemId, tagId: targetId })
        updated++
      }
    }

    await tx.delete(tags).where(eq(tags.id, sourceId))
  })

  revalidatePath('/taxonomy')
  return { itemsUpdated: updated }
}
