import { NextRequest, NextResponse } from 'next/server'
import { withApiKey } from '@/lib/auth/api-key'
import { Queue } from 'bullmq'
import { redisConnection } from '@/lib/queue/connection'

async function handler(_req: NextRequest) {
  const researchQueue = new Queue('research-agent', { connection: redisConnection })
  const job = await researchQueue.add('manual-run', {}, { jobId: `manual-${Date.now()}` })
  return NextResponse.json({ ok: true, jobId: job.id, message: 'Research agent run queued' })
}

export const POST = withApiKey(handler)
