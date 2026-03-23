import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { validateApiKey } from '@/lib/auth/api-key';
import { KNOWLEDGE_DIR } from '@/lib/export/config';

const CHANNEL_MAPPINGS_PATH = path.join(KNOWLEDGE_DIR, '_channel_mappings.json');

interface ChannelMapping {
  discordChannelId: string;
  discordChannelName: string;
  categorySlug: string;
  categoryName: string;
}

async function readMappings(): Promise<ChannelMapping[]> {
  try {
    const raw = await fs.readFile(CHANNEL_MAPPINGS_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ChannelMapping[];
  } catch {
    // File doesn't exist or is malformed — return empty list
    return [];
  }
}

async function writeMappings(mappings: ChannelMapping[]): Promise<void> {
  await fs.mkdir(KNOWLEDGE_DIR, { recursive: true });
  await fs.writeFile(CHANNEL_MAPPINGS_PATH, JSON.stringify(mappings, null, 2), 'utf-8');
}

const upsertSchema = z.object({
  channelId: z.string().min(1),
  channelName: z.string().min(1),
  categorySlug: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const mappings = await readMappings();
  return NextResponse.json(mappings);
}

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { channelId, channelName, categorySlug } = parsed.data;

  // Validate category exists
  const categoryRow = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1);

  if (categoryRow.length === 0) {
    return NextResponse.json(
      { error: `Category with slug "${categorySlug}" does not exist` },
      { status: 404 }
    );
  }

  const categoryName = categoryRow[0].name;

  const mappings = await readMappings();

  // Upsert: remove existing mapping for this channelId, then add new one
  const filtered = mappings.filter((m) => m.discordChannelId !== channelId);
  filtered.push({ discordChannelId: channelId, discordChannelName: channelName, categorySlug, categoryName });

  // NOTE: race condition risk — concurrent POST requests could overwrite each other's writes.
  // If write frequency increases, migrate this to a DB table instead of a JSON file.
  try {
    await writeMappings(filtered);
  } catch (err) {
    console.error('[channels] Failed to write mappings:', err);
    return NextResponse.json({ error: 'Failed to save channel mapping' }, { status: 500 });
  }

  return NextResponse.json({ discordChannelId: channelId, discordChannelName: channelName, categorySlug, categoryName });
}
