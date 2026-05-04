import { NextRequest, NextResponse } from 'next/server'
import { withApiKey } from '@/lib/auth/api-key'
import { db } from '@/lib/db'
import { researchSources } from '@/lib/db/schema'

async function getSources(_req: NextRequest) {
  const sources = await db.select().from(researchSources).orderBy(researchSources.createdAt)
  return NextResponse.json(sources)
}

async function createSource(req: NextRequest) {
  const body = await req.json() as {
    type: string
    name: string
    config: object
    topics?: string[]
  }
  const [source] = await db
    .insert(researchSources)
    .values({
      type: body.type,
      name: body.name,
      config: body.config,
      topics: body.topics ?? [],
    })
    .returning()
  return NextResponse.json(source, { status: 201 })
}

export const GET = withApiKey(getSources)
export const POST = withApiKey(createSource)
