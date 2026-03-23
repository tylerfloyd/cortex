import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { items } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';
import { extractionQueue } from '@/lib/queue/queues';

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  // Get all items
  const allItems = await db
    .select({ id: items.id })
    .from(items);

  if (allItems.length === 0) {
    return NextResponse.json({ enqueued: 0 });
  }

  // Reset processing status to 'pending' so the worker picks them up
  for (const item of allItems) {
    await db
      .update(items)
      .set({ processingStatus: 'pending' })
      .where(eq(items.id, item.id));
  }

  // Re-enqueue all items for extraction
  let enqueued = 0;
  for (const item of allItems) {
    await extractionQueue.add('extract', { itemId: item.id });
    enqueued++;
  }

  return NextResponse.json({ enqueued });
}
