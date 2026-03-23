# Cortex Architecture

Cortex is a self-hosted personal knowledge management system. It ingests URLs from multiple sources (browser extension, Discord, API, dashboard), extracts their content, processes them through an AI pipeline (summarization, categorization, embedding), and stores everything in PostgreSQL with pgvector. The result is a searchable, semantically queryable knowledge base that also syncs to a local directory of Markdown files.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Capture Clients                             │
│  Browser Extension  │  Discord Bot  │  Dashboard UI  │  Direct API │
└──────────┬──────────┴──────┬────────┴───────┬────────┴──────┬──────┘
           │                 │                │               │
           └─────────────────┴────────────────┴───────────────┘
                                     │
                             POST /api/items/ingest
                                     │
                         ┌───────────▼───────────┐
                         │    Next.js API Layer   │
                         │  (app/src/app/api/)    │
                         └───────────┬───────────┘
                                     │
                         ┌───────────▼───────────┐
                         │      PostgreSQL        │
                         │  + pgvector extension  │
                         └───────────┬───────────┘
                                     │ item row (status: pending)
                         ┌───────────▼───────────┐
                         │    BullMQ / Redis      │
                         │   Job Queue System     │
                         └───────────┬───────────┘
                                     │
           ┌─────────────────────────┼──────────────────────────┐
           ▼                         ▼                          ▼
  ┌────────────────┐      ┌──────────────────┐      ┌──────────────────────┐
  │   Extraction   │ ──▶  │  AI Processing   │ ──▶  │     Embedding        │
  │    Worker      │      │     Worker       │      │      Worker          │
  │                │      │                  │      │                      │
  │ article/yt/    │      │ Summarize (Sonnet│      │ text-embedding-3-    │
  │ reddit/twitter/│      │ Categorize (Haiku│      │ small (1536-dim)     │
  │ pdf extractors │      │ Tag assignment   │      │ pgvector storage     │
  └────────────────┘      └──────────────────┘      └──────────┬───────────┘
                                                               │
                                                    ┌──────────▼───────────┐
                                                    │   Markdown Export    │
                                                    │      Worker          │
                                                    │                      │
                                                    │ knowledge/{cat}/{    │
                                                    │ slug}.md             │
                                                    └──────────────────────┘

                    ┌──────────────────────────────────────┐
                    │         MCP Server (optional)        │
                    │  search_knowledge / ask_knowledge /  │
                    │  list_categories / recent_items /    │
                    │  get_item tools                      │
                    └──────────────────────────────────────┘
```

### Components

| Component | Location | Role |
|-----------|----------|------|
| Next.js app | `app/` | REST API + dashboard UI |
| PostgreSQL + pgvector | external | primary data store, semantic index |
| Redis + BullMQ | external | job queue for async pipeline |
| Discord bot | `discord-bot/` | prefix & slash commands for capture/search |
| MCP server | `mcp-server/` | exposes knowledge base to LLM toolchains |

---

## Data Flow: Ingestion Pipeline

### Step-by-Step

```
1. URL submitted
   └─ POST /api/items/ingest
      ├─ Validate URL (HTTP/HTTPS only)
      ├─ Detect source type (youtube/twitter/reddit/pdf/article)
      ├─ Resolve category_slug → category_id (optional)
      ├─ Insert item row with processing_status = 'pending'
      ├─ Associate any pre-set tags (by slug)
      └─ Enqueue job → content-extraction queue
         └─ Return { id, status: 'queued', source_type, applied_tags }

2. content-extraction worker
   └─ Set processing_status = 'processing'
   ├─ Route to extractor based on source_type
   ├─ Store raw_content, title, author, published_at in items
   ├─ Write completed job_log row
   └─ Enqueue → ai-processing queue

3. ai-processing worker
   ├─ Summarize raw_content → summary, key_insights, content_type,
   │  difficulty_level, estimated_read_time_minutes (Claude Sonnet)
   ├─ Categorize summary → category match or new category suggestion
   │  (Claude Haiku, JSON mode)
   ├─ Create AI-suggested category if needed (is_ai_suggested = true)
   ├─ Upsert tags, increment usage_count, link via item_tags
   ├─ Set processing_status = 'ai-complete'
   ├─ Write completed job_log row
   └─ Enqueue → embedding queue

4. embedding worker
   ├─ Concatenate title + summary + key_insights
   ├─ Call text-embedding-3-small → 1536-dim vector
   ├─ Store vector in items.embedding
   ├─ Populate item_relations (top-10 neighbours, threshold ≥ 0.7)
   ├─ Fire-and-forget contradiction checks for neighbours > 0.92 similarity
   ├─ Write completed job_log row
   └─ Enqueue → markdown-export queue

5. markdown-export worker
   ├─ Write knowledge/{category-slug}/{item-slug}.md
   ├─ Regenerate knowledge/_index.json
   ├─ Set processing_status = 'completed'
   ├─ Store markdown_file_path in items row
   └─ Write completed job_log row
```

### Processing Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Item created, extraction not yet started |
| `processing` | Extraction worker is running |
| `ai-complete` | AI processing done, embedding pending |
| `completed` | Full pipeline done, markdown written |
| `failed` | Any stage threw an unrecoverable error |

### Error Handling and Retries

BullMQ queues are configured with:
- **3 attempts** (1 initial + 2 retries) per job
- **Exponential backoff** starting at 1000 ms

On failure, the worker:
1. Updates `job_log.status = 'failed'` with the error message
2. Sets `items.processing_status = 'failed'`
3. Re-throws the error (BullMQ handles the retry)

---

## Content Extractors

All extractors return an `ExtractedContent` type:

```typescript
interface ExtractedContent {
  title: string | null;
  author: string | null;
  published_at: Date | null;
  content: string;           // full text / transcript / markdown
  word_count: number;
  language: string | null;
  partial: boolean;          // true if content is incomplete
  warning: string | null;    // human-readable explanation if partial
}
```

### Article (`extractors/article.ts`)

- **Primary**: Jina Reader API (`https://r.jina.ai/{url}`) — returns markdown, 15 s timeout
  - Reads `JINA_API_KEY` from config.json or environment
  - Parses title from first ATX-style `# Heading` line
  - Flags as `partial` if word count < `EXTRACTION_PAYWALL_THRESHOLD` (default: 50)
- **Fallback**: `@mozilla/readability` + `jsdom` — fetches raw HTML, runs Readability parser
- **SSRF protection**: blocks localhost, loopback (127.x), link-local (169.254.x), RFC-1918 private ranges, and IPv6 private addresses

### YouTube (`extractors/youtube.ts`)

- Fetches oEmbed metadata (`https://www.youtube.com/oembed?...`) for title and channel name
- Fetches transcript via `youtube-transcript` package (30 s timeout)
- Supports `youtube.com/watch?v=`, `youtu.be/`, and `youtube.com/shorts/` URL formats
- Returns `partial = true` with a warning if no transcript is available (e.g. captions disabled)

### Reddit (`extractors/reddit.ts`)

- Appends `.json` to the Reddit post URL to use the public JSON API (no auth required)
- Fetches post body + up to 20 top-level comments
- Formats output as markdown: post header, body, and comment section
- Sets `partial = true` for deleted or removed posts

### Twitter/X (`extractors/twitter.ts`)

- Primary: Jina Reader API (same path as article)
- Fallback: Twitter/X oEmbed endpoint

### PDF (`extractors/pdf.ts`)

- Downloads PDF to a temp directory (`os.tmpdir()/cortex-pdfs/`)
- **50 MB size limit** — rejects before or after download based on `Content-Length`
- Parses text with `pdf-parse`
- Throws `'PDF is password-protected'` if `pdf-parse` reports encryption
- Sets `partial = true` if word count < 20 (likely image-based / scanned)
- Always cleans up the temp file in a `finally` block

---

## AI Processing

All AI calls are routed through OpenRouter (`https://openrouter.ai/api/v1`). The `openrouter.ts` module provides `chatCompletion`, `chatCompletionStream`, and `createEmbedding` with a shared `fetchWithRetry` implementation (4 total attempts, backoff: 1 s / 2 s / 4 s on 429/500/503).

### Model Configuration

Default models are defined in `MODELS` in `app/src/lib/ai/openrouter.ts`:

```typescript
const MODELS = {
  summarize: 'anthropic/claude-sonnet-4-5',
  categorize: 'anthropic/claude-haiku-4-5',
  embed:      'openai/text-embedding-3-small',
  chat:       'anthropic/claude-sonnet-4-5',
  budget:     'meta-llama/llama-3.1-8b-instruct',
};
```

At runtime, `getModel(task)` checks `config.json` first (user-configurable), then falls back to these defaults. Models are configurable per-task via `PUT /api/settings`.

### Summarization

- Model: configurable, default `anthropic/claude-sonnet-4-5`
- Input: raw content truncated to 100,000 characters
- Mode: JSON mode (`response_format: { type: 'json_object' }`)
- Output fields:
  - `summary` — prose summary
  - `key_insights` — string array of bullet points
  - `suggested_title` — title suggestion if the item had none
  - `content_type` — one of: `tutorial | opinion | news | research | reference | discussion`
  - `difficulty_level` — one of: `beginner | intermediate | advanced`
  - `estimated_read_time_minutes` — integer

### Categorization

- Model: configurable, default `anthropic/claude-haiku-4-5`
- Input: summary + list of existing category names/slugs + top-20 tags by usage count
- Mode: JSON mode
- Output fields:
  - `category` — existing slug, `'uncategorized'`, or `'suggest:New Category Name'`
  - `tags` — up to 15 tag names (new or existing)
  - `confidence` — float 0–1

If the response starts with `suggest:`, the worker creates a new category with `is_ai_suggested = true` and upserts it (on conflict by slug, updates name).

### Embedding

- Model: configurable, default `openai/text-embedding-3-small`
- Input: title + summary + key_insights joined with `\n\n`, truncated to 30,000 chars
- Output: 1536-dimension float vector stored in `items.embedding` as a pgvector `vector(1536)` column

---

## Database Schema

### `items`

The core table. One row per saved URL.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | auto-generated |
| `url` | text UNIQUE NOT NULL | deduplication key |
| `source_type` | text | `article \| youtube \| twitter \| reddit \| pdf \| newsletter` |
| `title` | text | from extractor or AI suggestion |
| `author` | text | |
| `published_at` | timestamptz | |
| `raw_content` | text | full extracted text |
| `summary` | text | AI-generated prose summary |
| `key_insights` | jsonb | `string[]` of bullet points |
| `category_id` | UUID FK → categories | nullable |
| `ai_model_used` | text | model used for summarization |
| `content_type` | text | `tutorial \| opinion \| news \| research \| reference \| discussion` |
| `difficulty_level` | text | `beginner \| intermediate \| advanced` |
| `estimated_read_time_minutes` | integer | |
| `processing_status` | text | `pending \| processing \| ai-complete \| completed \| failed` |
| `embedding` | vector(1536) | pgvector column |
| `capture_source` | text | `discord \| extension \| dashboard \| api` |
| `discord_channel` | text | channel name/id if captured from Discord |
| `user_notes` | text | free-text notes |
| `is_favorite` | boolean | default false |
| `read_count` | integer | default 0 |
| `markdown_file_path` | text | absolute path to exported .md file |
| `created_at` | timestamptz | default now() |
| `updated_at` | timestamptz | default now() |

**Indexes**: `idx_items_category` (category_id), `idx_items_source_type` (source_type), `idx_items_created_at` (created_at)

**pgvector**: The `embedding` column is a custom type defined as `vector(1536)`. The IVFFlat index for ANN search is applied at the database migration level (not in the Drizzle schema file). Cosine similarity queries use the `<=>` operator: `1 - (embedding <=> '[...]'::vector)`.

### `categories`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `name` | text UNIQUE NOT NULL | display name |
| `slug` | text UNIQUE NOT NULL | URL-safe identifier |
| `description` | text | optional |
| `color` | text | hex or CSS color |
| `parent_id` | UUID FK → categories | self-referential, nullable (hierarchy) |
| `is_ai_suggested` | boolean | true when AI created this category |
| `created_at` | timestamptz | |

### `tags`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `name` | text UNIQUE NOT NULL | |
| `slug` | text UNIQUE NOT NULL | |
| `is_ai_generated` | boolean | default true |
| `usage_count` | integer | incremented on each tag-item association |
| `created_at` | timestamptz | |

### `item_tags`

Join table between items and tags.

| Column | Type | Notes |
|--------|------|-------|
| `item_id` | UUID FK → items (CASCADE) | composite PK |
| `tag_id` | UUID FK → tags (CASCADE) | composite PK |
| `confidence` | real | AI confidence score (null for manual tags) |

### `item_relations`

Stores semantic relationships between items.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `item_a_id` | UUID FK → items (CASCADE) | always lower UUID (sorted) |
| `item_b_id` | UUID FK → items (CASCADE) | always higher UUID |
| `relation_type` | text | `related \| contradicts \| builds_on \| references`. The embedding worker writes `related`; the schema comment also lists `similar` as a possible value but the worker does not currently use it. |
| `similarity` | real | cosine similarity score (null for contradicts) |
| `created_at` | timestamptz | |

**Unique index**: `uq_item_relations_a_b_type` on `(item_a_id, item_b_id, relation_type)`. Item IDs are always stored with the lower UUID as `item_a_id` to prevent duplicate pairs.

### `job_log`

Per-stage progress tracking for the processing pipeline.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `item_id` | UUID FK → items (CASCADE) | |
| `job_type` | text | `content-extraction \| ai-processing \| embedding \| markdown-export` |
| `status` | text | `queued \| running \| completed \| failed` |
| `error` | text | error message on failure |
| `started_at` | timestamptz | set when worker begins |
| `completed_at` | timestamptz | set on success |
| `created_at` | timestamptz | row creation time |

---

## Job Queue Architecture

### Queues

| Queue name | BullMQ Queue | Triggered by |
|------------|-------------|--------------|
| `content-extraction` | `extractionQueue` | POST /api/items/ingest, bulk reprocess, admin/reprocess-all |
| `ai-processing` | `aiProcessingQueue` | extraction worker on success |
| `embedding` | `embeddingQueue` | ai-processing worker on success, admin/rebuild-embeddings |
| `markdown-export` | `markdownExportQueue` | embedding worker on success |

All queues share the same `redisConnection` and the same default job options:
- `attempts: 3`
- `backoff: { type: 'exponential', delay: 1000 }`

### Worker Chaining

Each worker enqueues the next stage on success. This forms a linear pipeline:

```
extractionWorker
  → aiProcessingQueue.add('ai-processing', { itemId })

aiProcessingWorker
  → embeddingQueue.add('embedding', { itemId })

embeddingWorker
  → markdownExportQueue.add('markdown-export', { itemId })

markdownExportWorker
  → [pipeline complete]
```

### job_log Tracking

Each worker:
1. Calls `insertJobLog(itemId, jobType)` at the start — inserts a row with `status: 'running'` and `started_at`
2. Calls `completeJobLog(logId)` on success — sets `status: 'completed'` and `completed_at`
3. Calls `failJobLog(logId, errorMessage)` on failure — sets `status: 'failed'` and `error`

The `GET /api/items/:id/status` endpoint returns the item's `processing_status` along with all associated `job_log` rows, giving clients a full processing history.

---

## Semantic Search & RAG

### Semantic Search (`GET /api/search`)

1. Generate a 1536-dim embedding for the query string using `text-embedding-3-small`
2. Query PostgreSQL using pgvector's `<=>` cosine distance operator against `items.embedding`
3. Filter to `processing_status = 'completed'` items with non-null embeddings
4. Optional filters: `category` (slug), `source_type`, `date_range` (N days)
5. Return ranked results with `similarity = 1 - (embedding <=> queryVector)`

**FTS Fallback**: If embedding generation fails (API error), the endpoint falls back to PostgreSQL full-text search using `plainto_tsquery('english', ...)` against `title || summary`. FTS results have `similarity: null`.

### RAG (Ask mode) — `POST /api/ask`

1. Embed the question
2. Retrieve the top-5 most similar completed items via pgvector
3. Build a context block: numbered excerpts of title + URL + summary for each item
4. Send to Claude Sonnet (`MODELS.chat`) with a system prompt instructing it to answer only from the provided context
5. Return `{ answer: string, sources: Array<{ id, title, url, relevance }> }`

### Streaming RAG — `POST /api/ask/stream`

Same retrieval logic, but:
- Sources are emitted first (pre-computed before streaming starts)
- Uses `chatCompletionStream` which returns a raw SSE response from OpenRouter
- Re-encodes as NDJSON (`application/x-ndjson`) with three chunk types:

```jsonc
{ "type": "chunk",   "content": "partial answer text" }
{ "type": "sources", "sources": [{ "id": "...", "title": "...", "url": "...", "relevance": 0.87 }] }
{ "type": "done" }
```

---

## Markdown Export

### File Layout

```
knowledge/
├── _index.json              ← machine-readable index of all items
├── _channel_mappings.json   ← Discord channel → category mappings
├── {category-slug}/
│   └── {item-slug}.md       ← one file per item
└── uncategorized/
    └── {item-slug}.md
```

`KNOWLEDGE_DIR` defaults to `{cwd}/knowledge`, overridable via the `KNOWLEDGE_DIR` environment variable.

Slugs are derived from the item title using `generateSlug()`: lowercase, non-alphanumeric runs replaced with `-`, leading/trailing hyphens stripped. If no title exists, the item UUID is used. On filename conflicts with a different item, the first 8 chars of the UUID are appended.

### YAML Frontmatter

```yaml
---
id: "550e8400-e29b-41d4-a716-446655440000"
title: "Example Article Title"
url: "https://example.com/article"
source_type: "article"
author: "Jane Doe"
published: 2024-01-15
captured: "2024-01-20T10:30:00.000Z"
capture_source: "discord"
category: "ai-research"
tags: ["machine-learning", "transformers"]
content_type: "research"
difficulty: "advanced"
read_time_minutes: 12
---
```

Followed by `# Title`, `## Summary`, `## Key Insights` (bulleted list), and `## Source Content` sections.

### `_index.json` Structure

```json
{
  "generated_at": "2024-01-20T10:31:00.000Z",
  "total_items": 42,
  "items": [
    {
      "id": "...",
      "title": "...",
      "url": "...",
      "source_type": "article",
      "category": "ai-research",
      "tags": ["machine-learning"],
      "content_type": "research",
      "difficulty": "advanced",
      "read_time_minutes": 12,
      "captured": "2024-01-20T10:30:00.000Z",
      "file_path": "/absolute/path/to/knowledge/ai-research/example-article-title.md"
    }
  ]
}
```

### Sync Triggers

| Event | Action |
|-------|--------|
| Pipeline completion (markdown-export worker) | Write item .md, regenerate _index.json |
| `PATCH /api/items/:id` (any field change) | Rewrite item .md, regenerate _index.json |
| `PATCH /api/items/:id` (category change) | Move .md to new category folder, update stored path, regenerate _index.json |
| `DELETE /api/items/:id` | Delete .md file, regenerate _index.json |
| `POST /api/export/rebuild` | Re-write .md for all completed items, regenerate _index.json |

---

## Related Items & Discovery

### Populating `item_relations`

After storing an embedding, `populateItemRelations()` runs:

1. Query top-10 nearest neighbours (excluding self) filtered to `completed` items with embeddings using pgvector `ORDER BY embedding <=> vector LIMIT 10`
2. For each neighbour with `similarity >= 0.7`, insert a `related` relation (lower UUID as `item_a_id`)
3. For neighbours with `similarity > 0.92` that have a summary, fire a background contradiction check

### Contradiction Detection

`checkContradiction()` is called asynchronously (fire-and-forget) for high-similarity pairs:

- Uses Claude Haiku (`MODELS.categorize`) as a fact-checking assistant
- Prompt: both summaries side by side, asking "Do these summaries contradict each other?" (yes/no)
- If answer starts with "yes", inserts a `contradicts` relation with `similarity: null`
- Uses the same sorted-UUID convention to prevent duplicates (`ON CONFLICT DO NOTHING`)
- Errors are logged as warnings but never propagate to the embedding worker

### Dashboard Discovery

The Discover section surfaces items related to recently saved items by querying `item_relations` where `item_a_id` or `item_b_id` matches recent items, ordered by similarity score descending.

---

## Discord Bot

The Discord bot (`discord-bot/`) connects to the Cortex API using an API key and supports two interaction modes:

**Prefix commands** (e.g. `!search query`):
- `!search <query>` — semantic search, auto-filters to the channel's mapped category
- `!ask <question>` — RAG question answering
- `!recent [category]` — list recently saved items
- `!categories` — list all categories with item counts
- `!map <category-slug>` — map current channel to a category (requires Manage Channels permission)

**Slash commands** (`/search`, `/ask`, `/recent`, `/categories`, `/map`) — identical functionality, registered per-guild or globally.

**Channel mapping**: When a channel is mapped to a category via `!map`, URLs shared in that channel are automatically tagged with that category. Mappings are stored in `knowledge/_channel_mappings.json` and cached in memory with invalidation on each `!map` call. URL detection uses a regex pattern to identify URLs in message content.

**Rate limiting**: Per-user rate limiter applied before all command dispatch.

---

## MCP Server

The MCP server (`mcp-server/`) exposes the knowledge base to LLM toolchains via the Model Context Protocol. It provides five tools:

| Tool | File | Description |
|------|------|-------------|
| `search_knowledge` | `tools/search.ts` | Semantic search with optional category/source_type/date_range/limit filters |
| `ask_knowledge` | `tools/ask.ts` | RAG question answering with optional category scope |
| `list_categories` | `tools/categories.ts` | List all categories with item counts and metadata |
| `get_recent_items` | `tools/recent.ts` | Fetch recently saved items |
| `get_item` | `tools/get-item.ts` | Fetch full item details by ID |

All tools call the same underlying REST API with the configured API key.
