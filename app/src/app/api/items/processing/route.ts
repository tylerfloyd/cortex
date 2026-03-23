import { NextResponse } from 'next/server'
import { inArray, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { items } from '@/lib/db/schema'

export async function GET() {
  try {
    const rows = await db
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

    return NextResponse.json({ items: rows })
  } catch {
    return NextResponse.json({ items: [] })
  }
}
