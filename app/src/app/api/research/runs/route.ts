import { NextRequest, NextResponse } from 'next/server'
import { withApiKey } from '@/lib/auth/api-key'
import { db } from '@/lib/db'
import { researchRuns } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'

async function getRuns(_req: NextRequest) {
  const runs = await db
    .select()
    .from(researchRuns)
    .orderBy(desc(researchRuns.startedAt))
    .limit(20)
  return NextResponse.json(runs)
}

export const GET = withApiKey(getRuns)
