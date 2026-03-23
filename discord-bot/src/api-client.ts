import { z } from 'zod';
import { config } from './config.js';

const ingestResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
  source_type: z.string(),
});

const statusResponseSchema = z.object({
  processing_status: z.string(),
  jobs: z.array(z.object({
    job_type: z.string(),
    status: z.string(),
    error: z.string().nullable().optional(),
  })),
});

const itemResponseSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  summary: z.string().nullable(),
  key_insights: z.array(z.string()).default([]),
  source_type: z.string(),
  category: z.object({ name: z.string(), slug: z.string() }).nullable(),
  tags: z.array(z.object({ name: z.string() })).default([]),
  url: z.string(),
});

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function apiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-key': config.apiKey,
  };
}

export interface IngestResult {
  id: string;
  status: string;
  source_type: string;
}

export interface ItemStatus {
  processing_status: string;
  jobs: Array<{ job_type: string; status: string; error?: string | null }>;
}

export interface ItemDetails {
  id: string;
  title: string | null;
  summary: string | null;
  key_insights: string[];
  source_type: string;
  category: { name: string; slug: string } | null;
  tags: Array<{ name: string }>;
  url: string;
}

// Ingest a URL — returns { id, status, source_type }
// Throws ApiError with status 409 if the URL is already saved.
export async function ingestUrl(params: {
  url: string;
  captureSource: 'discord';
  discordChannel: string;
  userNotes?: string;
  categorySlug?: string;
}): Promise<IngestResult> {
  const response = await fetch(`${config.apiUrl}/api/items/ingest`, {
    method: 'POST',
    headers: apiHeaders(),
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({
      url: params.url,
      capture_source: params.captureSource,
      discord_channel: params.discordChannel,
      user_notes: params.userNotes,
      category_slug: params.categorySlug,
    }),
  });

  if (response.status === 409) {
    throw new ApiError('Item already exists', 409);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(`Ingest failed: ${text}`, response.status);
  }

  const data = ingestResponseSchema.parse(await response.json());
  return {
    id: data.id,
    status: data.status,
    source_type: data.source_type,
  };
}

// Poll item processing status — returns current processing_status and jobs array
export async function pollItemStatus(itemId: string): Promise<ItemStatus> {
  const response = await fetch(`${config.apiUrl}/api/items/${itemId}/status`, {
    headers: apiHeaders(),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(`Status poll failed: ${text}`, response.status);
  }

  const data = statusResponseSchema.parse(await response.json());

  return {
    processing_status: data.processing_status,
    jobs: data.jobs,
  };
}

// Get full item details — maps camelCase API response to the expected interface
export async function getItem(itemId: string): Promise<ItemDetails> {
  const response = await fetch(`${config.apiUrl}/api/items/${itemId}`, {
    headers: apiHeaders(),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(`Get item failed: ${text}`, response.status);
  }

  const data = itemResponseSchema.parse(await response.json());

  return {
    id: data.id,
    title: data.title,
    summary: data.summary,
    key_insights: data.key_insights,
    source_type: data.source_type,
    category: data.category,
    tags: data.tags,
    url: data.url,
  };
}

// --- Search & Ask ---

const searchResponseSchema = z.object({
  results: z.array(z.object({
    id: z.string(),
    title: z.string().nullable(),
    url: z.string(),
    summary: z.string().nullable(),
    category: z.string().nullable(),
    tags: z.array(z.string()).default([]),
    source_type: z.string(),
    similarity: z.number(),
  })),
});

const askResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(z.object({
    title: z.string().nullable(),
    url: z.string(),
    relevance: z.number().optional(),
  })),
});

export interface SearchResult {
  id: string;
  title: string | null;
  url: string;
  summary: string | null;
  category: string | null;
  source_type: string;
  similarity: number;
}

export interface SearchResponse {
  results: SearchResult[];
}

export async function searchKnowledge(query: string, category?: string, limit = 5): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (category) params.set('category', category);

  const response = await fetch(`${config.apiUrl}/api/search?${params.toString()}`, {
    headers: apiHeaders(),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(`Search failed: ${text}`, response.status);
  }

  return searchResponseSchema.parse(await response.json());
}

export interface AskResponse {
  answer: string;
  sources: Array<{ title: string | null; url: string; relevance?: number }>;
}

export async function askKnowledge(question: string, category?: string): Promise<AskResponse> {
  const response = await fetch(`${config.apiUrl}/api/ask`, {
    method: 'POST',
    headers: apiHeaders(),
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({ question, category }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(`Ask failed: ${text}`, response.status);
  }

  return askResponseSchema.parse(await response.json());
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
}

export async function listCategories(): Promise<CategoryInfo[]> {
  const response = await fetch(`${config.apiUrl}/api/categories`, {
    headers: apiHeaders(),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(`List categories failed: ${text}`, response.status);
  }

  const data = await response.json() as { categories: CategoryInfo[] };
  return data.categories ?? [];
}

export interface RecentItem {
  id: string;
  title: string | null;
  url: string;
  source_type: string;
  category: string | null;
  created_at: string | null;
}

export async function getRecentItems(category?: string, limit = 5): Promise<RecentItem[]> {
  const params = new URLSearchParams({ limit: String(limit), sort: 'newest' });
  if (category) params.set('category', category);

  const response = await fetch(`${config.apiUrl}/api/items?${params.toString()}`, {
    headers: apiHeaders(),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(`Recent items failed: ${text}`, response.status);
  }

  const data = await response.json() as { items: Array<{ id: string; title: string | null; url: string; sourceType: string; categoryId: string | null; createdAt: string | null }> };
  return (data.items ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    url: item.url,
    source_type: item.sourceType,
    category: null, // items list response doesn't include category name; acceptable
    created_at: item.createdAt,
  }));
}

export async function mapChannel(channelId: string, channelName: string, categorySlug: string): Promise<void> {
  const response = await fetch(`${config.apiUrl}/api/channels`, {
    method: 'POST',
    headers: apiHeaders(),
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({ channelId, channelName, categorySlug }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(`Map channel failed: ${text}`, response.status);
  }
}
