import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';
import { embeddingQueue } from '@/lib/queue/queues';

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  // Get all completed items (ready for embedding)
  const eligible = await db
    .select({ id: items.id })
    .from(items)
    .where(eq(items.processingStatus, 'completed'));

  if (eligible.length === 0) {
    return NextResponse.json({ enqueued: 0 });
  }

  // Update status to 'ai-complete' so the embedding worker picks them up
  await db
    .update(items)
    .set({ processingStatus: 'ai-complete' })
    .where(eq(items.processingStatus, 'completed'));

  // Enqueue all eligible items into the embedding queue
  let enqueued = 0;
  for (const item of eligible) {
    await embeddingQueue.add('embed', { itemId: item.id });
    enqueued++;
  }

  return NextResponse.json({ enqueued });
}
