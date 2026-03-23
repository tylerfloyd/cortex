/**
 * HTTP client for the Cortex API.
 * Reads CORTEX_API_URL and CORTEX_API_KEY from environment variables.
 */

const apiUrl = process.env.CORTEX_API_URL ?? 'http://localhost:3000';
const apiKey = process.env.CORTEX_API_KEY ?? '';

if (!apiKey) {
  console.warn('[cortex-mcp] Warning: CORTEX_API_KEY is not set');
}

async function cortexFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  const url = `${apiUrl}${path}`;
  const headers: Record<string, string> = {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorBody: string;
    try {
      errorBody = await response.text();
    } catch {
      errorBody = '(unreadable)';
    }
    throw new Error(`Cortex API error ${response.status} on ${path}: ${errorBody}`);
  }

  return response.json();
}

export interface SearchResult {
  id: string;
  title: string | null;
  url: string;
  summary: string | null;
  category: string | null;
  source_type: string;
  similarity: number | null;
}

export interface SearchResponse {
  results: SearchResult[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  parentId: string | null;
  isAiSuggested: boolean;
  createdAt: string;
  itemCount: number;
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface Item {
  id: string;
  url: string;
  sourceType: string;
  title: string | null;
  author: string | null;
  publishedAt: string | null;
  summary: string | null;
  keyInsights: string[] | null;
  aiModelUsed: string | null;
  processingStatus: string;
  captureSource: string | null;
  discordChannel: string | null;
  userNotes: string | null;
  isFavorite: boolean;
  readCount: number;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string | null;
    slug: string | null;
    color: string | null;
  } | null;
  tags: Array<{ id: string; name: string; slug: string }>;
}

export interface ItemsListResponse {
  items: Item[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AskResponse {
  answer: string;
  sources: Array<{
    id: string;
    title: string;
    url: string;
    relevance: number | null;
  }>;
}

export async function searchKnowledge(params: {
  query: string;
  category?: string;
  source_type?: string;
  date_range?: string;
  limit?: number;
}): Promise<SearchResponse> {
  const qs = new URLSearchParams({ q: params.query });
  if (params.category) qs.set('category', params.category);
  if (params.source_type) qs.set('source_type', params.source_type);
  if (params.date_range) qs.set('date_range', params.date_range);
  if (params.limit != null) qs.set('limit', String(params.limit));

  return cortexFetch(`/api/search?${qs}`) as Promise<SearchResponse>;
}

export async function getItemById(id: string): Promise<Item | null> {
  try {
    return (await cortexFetch(`/api/items/${encodeURIComponent(id)}`)) as Item;
  } catch (err) {
    if (err instanceof Error && err.message.includes('404')) {
      return null;
    }
    throw err;
  }
}

export async function findItemByUrl(url: string): Promise<Item | null> {
  // The items list endpoint does not support a `url` query param, so we use
  // a broad fetch and filter client-side. We cap at 100 per page and search
  // across all pages until we find a match (max 5 pages to avoid runaway calls).
  const MAX_PAGES = 5;
  const PER_PAGE = 100;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const qs = new URLSearchParams({
      limit: String(PER_PAGE),
      page: String(page),
      sort: 'newest',
    });
    const data = (await cortexFetch(`/api/items?${qs}`)) as ItemsListResponse;
    const match = data.items.find((item) => item.url === url);
    if (match) return match;
    if (page >= data.pages || data.items.length === 0) break;
  }

  return null;
}

export async function listRecentItems(params: {
  category?: string;
  limit?: number;
}): Promise<ItemsListResponse> {
  const qs = new URLSearchParams({ sort: 'newest' });
  if (params.category) qs.set('category', params.category);
  if (params.limit != null) qs.set('limit', String(params.limit));

  return cortexFetch(`/api/items?${qs}`) as Promise<ItemsListResponse>;
}

export async function listCategories(): Promise<CategoriesResponse> {
  return cortexFetch('/api/categories') as Promise<CategoriesResponse>;
}

export async function askKnowledge(question: string, category?: string): Promise<AskResponse> {
  return cortexFetch('/api/ask', {
    method: 'POST',
    body: JSON.stringify({ question, ...(category ? { category } : {}) }),
  }) as Promise<AskResponse>;
}
