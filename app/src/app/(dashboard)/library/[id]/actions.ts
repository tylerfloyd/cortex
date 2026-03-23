'use server'

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { items, itemTags } from '@/lib/db/schema'

export async function deleteItem(itemId: string): Promise<void> {
  // Remove tag associations first (FK constraint)
  await db.delete(itemTags).where(eq(itemTags.itemId, itemId))
  // Delete the item
  await db.delete(items).where(eq(items.id, itemId))
  revalidatePath('/library')
  revalidatePath('/')
  redirect('/library')
}
