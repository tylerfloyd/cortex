import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readConfig, writeConfig } from '@/lib/config';
import { validateApiKey } from '@/lib/auth/api-key';

export async function GET(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const config = await readConfig();
  return NextResponse.json({
    models: config.models,
    apiKeysConfigured: {
      openrouter: config.apiKeys.openrouter !== null,
      jina: config.apiKeys.jina !== null,
      discord: config.apiKeys.discord !== null,
    },
  });
}

const settingsSchema = z.object({
  models: z.object({
    summarize: z.string().min(1),
    categorize: z.string().min(1),
    embed: z.string().min(1),
    chat: z.string().min(1),
  }),
});

export async function PUT(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Preserve existing apiKeys when updating models via API
  const existing = await readConfig();
  const merged = { ...existing, models: parsed.data.models };
  await writeConfig(merged);
  return NextResponse.json({
    models: merged.models,
    apiKeysConfigured: {
      openrouter: merged.apiKeys.openrouter !== null,
      jina: merged.apiKeys.jina !== null,
      discord: merged.apiKeys.discord !== null,
    },
  });
}
