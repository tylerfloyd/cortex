'use server'

import { eq, inArray, desc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { items, categories } from '@/lib/db/schema'
import { extractionQueue } from '@/lib/queue/queues'

function detectSourceType(url: string): string {
  if (/youtube\.com\/watch|youtu\.be\//.test(url)) return 'youtube'
  if (/twitter\.com\/|x\.com\//.test(url)) return 'twitter'
  if (/reddit\.com\/r\//.test(url)) return 'reddit'
  if (/\.pdf$/i.test(url.split('?')[0])) return 'pdf'
  return 'article'
}

export type IngestOptions = {
  category_slug?: string
  user_notes?: string
}

export type IngestResult = {
  id: string
  url: string
  processing_status: string
  source_type: string
}

export type IngestError = {
  url: string
  error: string
  duplicate?: boolean
}

export type IngestUrlsResult = {
  succeeded: IngestResult[]
  failed: IngestError[]
}

export async function ingestUrls(
  urls: string[],
  opts: IngestOptions = {}
): Promise<IngestUrlsResult> {
  const { category_slug, user_notes } = opts

  // Resolve category if provided
  let categoryId: string | undefined
  if (category_slug) {
    const catRows = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, category_slug))
      .limit(1)
    if (catRows.length > 0) {
      categoryId = catRows[0].id
    }
  }

  const succeeded: IngestResult[] = []
  const failed: IngestError[] = []

  for (const rawUrl of urls) {
    const url = rawUrl.trim()
    if (!url) continue

    // Basic URL validation
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      failed.push({ url, error: 'Invalid URL format' })
      continue
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      failed.push({ url, error: 'URL must use HTTP or HTTPS protocol' })
      continue
    }

    const sourceType = detectSourceType(url)

    try {
      const [inserted] = await db
        .insert(items)
        .values({
          url,
          sourceType,
          captureSource: 'dashboard',
          categoryId: categoryId ?? undefined,
          userNotes: user_notes,
          processingStatus: 'pending',
        })
        .returning({ id: items.id, processingStatus: items.processingStatus })

      // Enqueue extraction job
      await extractionQueue.add('extract', { itemId: inserted.id })

      succeeded.push({
        id: inserted.id,
        url,
        processing_status: inserted.processingStatus ?? 'pending',
        source_type: sourceType,
      })
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === '23505'
      ) {
        failed.push({ url, error: 'Item already exists', duplicate: true })
      } else {
        console.error('[ingestUrls] Failed to insert item:', err)
        failed.push({ url, error: 'Failed to save item' })
      }
    }
  }

  if (succeeded.length > 0) {
    revalidatePath('/inbox')
  }

  return { succeeded, failed }
}

export type QueueItem = {
  id: string
  url: string
  title: string | null
  sourceType: string
  processingStatus: string | null
  createdAt: Date | null
}

export async function getActiveQueueItems(): Promise<QueueItem[]> {
  try {
    return await db
      .select({
        id: items.id,
        url: items.url,
        title: items.title,
        sourceType: items.sourceType,
        processingStatus: items.processingStatus,
        createdAt: items.createdAt,
      })
      .from(items)
      .where(
        inArray(items.processingStatus, ['pending', 'processing', 'ai-complete'])
      )
      .orderBy(desc(items.createdAt))
      .limit(50)
  } catch {
    return []
  }
}
