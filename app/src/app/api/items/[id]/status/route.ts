import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items, jobLog } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const { id } = await params;

  const itemRows = await db
    .select({ processingStatus: items.processingStatus })
    .from(items)
    .where(eq(items.id, id))
    .limit(1);

  if (itemRows.length === 0) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  const jobs = await db
    .select({
      job_type: jobLog.jobType,
      status: jobLog.status,
      started_at: jobLog.startedAt,
      completed_at: jobLog.completedAt,
      error: jobLog.error,
    })
    .from(jobLog)
    .where(eq(jobLog.itemId, id))
    .orderBy(jobLog.createdAt);

  return NextResponse.json({
    item_id: id,
    processing_status: itemRows[0].processingStatus,
    jobs,
  });
}
