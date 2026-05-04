import { NextRequest, NextResponse } from 'next/server'
import { withApiKey } from '@/lib/auth/api-key'
import { db } from '@/lib/db'
import { researchSources } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

type Context = { params: Promise<{ id: string }> }

async function updateSource(req: NextRequest, context: Context) {
  const { id } = await context.params
  const body = await req.json() as { enabled?: boolean; topics?: string[]; config?: object }
  const [updated] = await db
    .update(researchSources)
    .set({ ...body })
    .where(eq(researchSources.id, id))
    .returning()
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

async function deleteSource(_req: NextRequest, context: Context) {
  const { id } = await context.params
  const [deleted] = await db
    .delete(researchSources)
    .where(eq(researchSources.id, id))
    .returning({ id: researchSources.id })
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return new NextResponse(null, { status: 204 })
}

export const PATCH = withApiKey(updateSource)
export const DELETE = withApiKey(deleteSource)
