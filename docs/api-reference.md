# Cortex API Reference

Base URL: `http://localhost:3000` (or your configured host)

---

## Authentication

All endpoints (except `GET /api/health`) require an API key passed in the `x-api-key` request header.

```
x-api-key: your-api-key-here
```

**401 Unauthorized response:**
```json
{ "error": "Unauthorized" }
```

---

## Items

### `POST /api/items/ingest`

Submit a URL for ingestion into the knowledge base.

**Auth required:** Yes

**Request body:**
```json
{
  "url": "https://example.com/article",
  "capture_source": "api",
  "category_slug": "ai-research",
  "tags": ["machine-learning", "transformers"],
  "user_notes": "Optional personal note",
  "discord_channel": "general"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `url` | string | Yes | Must be HTTP or HTTPS |
| `capture_source` | string | Yes | One of: `discord \| extension \| dashboard \| api` |
| `category_slug` | string | No | Must match an existing category slug |
| `tags` | string[] | No | Array of existing tag slugs to pre-assign |
| `user_notes` | string | No | Free-text notes attached to the item |
| `discord_channel` | string | No | Discord channel name or ID (used when capture_source is `discord`) |

Source type is auto-detected from the URL:
- YouTube (`youtube.com/watch`, `youtu.be/`) → `youtube`
- Twitter/X (`twitter.com/`, `x.com/`) → `twitter`
- Reddit (`reddit.com/r/`) → `reddit`
- `.pdf` extension → `pdf`
- Everything else → `article`

**Response `201 Created`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "source_type": "article",
  "applied_tags": ["machine-learning"]
}
```

`applied_tags` contains only tags that were found (by slug). Unknown slugs are silently ignored.

**Error responses:**

| Status | Condition |
|--------|-----------|
| `400` | Invalid JSON, validation failure (bad URL, unknown capture_source) |
| `409` | `{ "error": "Item already exists" }` — URL is already in the database |

---

### `GET /api/items`

List items with optional filtering and pagination.

**Auth required:** Yes

**Query parameters:**

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `page` | integer | `1` | Page number (1-based) |
| `limit` | integer | `20` | Items per page, max 100 |
| `category` | string | — | Filter by category slug |
| `source_type` | string | — | Filter by source type |
| `tags` | string | — | Comma-separated tag slugs; returns items that have ALL specified tags |
| `date_from` | string | — | ISO 8601 date, lower bound on `created_at` |
| `date_to` | string | — | ISO 8601 date, upper bound on `created_at` |
| `is_favorite` | string | — | `'true'` or `'false'` |
| `sort` | string | `newest` | One of: `newest \| oldest \| alphabetical` |

**Response `200`:**
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "url": "https://example.com/article",
      "sourceType": "article",
      "title": "Example Article",
      "author": "Jane Doe",
      "publishedAt": "2024-01-15T00:00:00.000Z",
      "summary": "A brief summary of the article...",
      "keyInsights": ["Insight one", "Insight two"],
      "categoryId": "cat-uuid",
      "processingStatus": "completed",
      "captureSource": "api",
      "userNotes": null,
      "isFavorite": false,
      "readCount": 0,
      "createdAt": "2024-01-20T10:30:00.000Z",
      "updatedAt": "2024-01-20T10:31:00.000Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20,
  "pages": 3
}
```

Note: The `embedding` vector is excluded from list responses.

**Error responses:**

| Status | Condition |
|--------|-----------|
| `400` | Invalid value for `is_favorite` |

---

### `GET /api/items/:id`

Fetch full details for a single item including its category and tags.

**Auth required:** Yes

**Response `200`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://example.com/article",
  "sourceType": "article",
  "title": "Example Article",
  "author": "Jane Doe",
  "publishedAt": "2024-01-15T00:00:00.000Z",
  "summary": "A brief summary...",
  "keyInsights": ["Insight one", "Insight two"],
  "aiModelUsed": "anthropic/claude-sonnet-4-5",
  "processingStatus": "completed",
  "captureSource": "api",
  "discordChannel": null,
  "userNotes": null,
  "isFavorite": false,
  "readCount": 0,
  "createdAt": "2024-01-20T10:30:00.000Z",
  "updatedAt": "2024-01-20T10:31:00.000Z",
  "category": {
    "id": "cat-uuid",
    "name": "AI Research",
    "slug": "ai-research",
    "color": "#3b82f6"
  },
  "tags": [
    { "id": "tag-uuid", "name": "machine-learning", "slug": "machine-learning" }
  ]
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404` | Item not found |

---

### `PATCH /api/items/:id`

Update mutable fields on an item. Also triggers markdown file regeneration.

**Auth required:** Yes

**Request body** (all fields optional):
```json
{
  "category_slug": "new-category",
  "tags_to_add": ["new-tag", "another-tag"],
  "tags_to_remove": ["old-tag"],
  "user_notes": "Updated notes",
  "is_favorite": true
}
```

| Field | Type | Notes |
|-------|------|-------|
| `category_slug` | string | Empty string or `null` to unassign. Moving category relocates the markdown file. |
| `tags_to_add` | string[] | Tag names (not slugs). Creates tags that don't exist. |
| `tags_to_remove` | string[] | Tag names to disassociate. Tags themselves are not deleted. |
| `user_notes` | string | Replaces existing notes |
| `is_favorite` | boolean | |

**Response `200`:**
```json
{ "success": true }
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `400` | Invalid JSON |
| `404` | Item not found, or specified `category_slug` not found |

---

### `DELETE /api/items/:id`

Delete an item and its associated markdown file.

**Auth required:** Yes

**Response `204 No Content`** (empty body)

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404` | Item not found |

---

### `GET /api/items/:id/status`

Get the processing status and full job log for an item.

**Auth required:** Yes

**Response `200`:**
```json
{
  "item_id": "550e8400-e29b-41d4-a716-446655440000",
  "processing_status": "completed",
  "jobs": [
    {
      "job_type": "content-extraction",
      "status": "completed",
      "started_at": "2024-01-20T10:30:01.000Z",
      "completed_at": "2024-01-20T10:30:03.000Z",
      "error": null
    },
    {
      "job_type": "ai-processing",
      "status": "completed",
      "started_at": "2024-01-20T10:30:03.000Z",
      "completed_at": "2024-01-20T10:30:08.000Z",
      "error": null
    },
    {
      "job_type": "embedding",
      "status": "completed",
      "started_at": "2024-01-20T10:30:08.000Z",
      "completed_at": "2024-01-20T10:30:09.000Z",
      "error": null
    },
    {
      "job_type": "markdown-export",
      "status": "completed",
      "started_at": "2024-01-20T10:30:09.000Z",
      "completed_at": "2024-01-20T10:30:10.000Z",
      "error": null
    }
  ]
}
```

Jobs are returned in chronological order by `created_at`.

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404` | Item not found |

---

### `POST /api/items/bulk`

Perform a bulk operation on multiple items (up to 500 at once).

**Auth required:** Yes

**Request body:**
```json
{
  "action": "categorize",
  "item_ids": ["uuid1", "uuid2", "uuid3"],
  "category_slug": "ai-research",
  "tags_to_add": ["tag-name"],
  "tags_to_remove": ["old-tag"]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `action` | string | Yes | One of: `categorize \| tag \| delete \| reprocess` |
| `item_ids` | string[] | Yes | 1–500 UUIDs |
| `category_slug` | string | For `categorize` | Empty string to unassign |
| `tags_to_add` | string[] | For `tag` | Tag names to add |
| `tags_to_remove` | string[] | For `tag` | Tag names to remove |

**Actions:**

| Action | Effect |
|--------|--------|
| `categorize` | Set `category_id` for all items to the specified category (or null) |
| `tag` | Add/remove tags for all items |
| `delete` | Delete all items and their markdown files; regenerates index |
| `reprocess` | Reset status to `pending` and re-enqueue all items for extraction |

**Response `200` for `categorize` / `tag`:**
```json
{ "success": true, "updated": 3 }
```

**Response `200` for `delete`:**
```json
{ "success": true, "deleted": 3 }
```

**Response `200` for `reprocess`:**
```json
{ "success": true, "enqueued": 3 }
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `400` | Validation failure, missing required field for action |
| `404` | Category not found (for `categorize`) |

---

### `GET /api/items/duplicates`

Find potential duplicate items based on semantic similarity. Returns pairs with similarity > 0.95.

**Auth required:** Yes

**Response `200`:**
```json
{
  "duplicates": [
    {
      "similarity": 0.97,
      "itemA": {
        "id": "uuid-a",
        "title": "Article Title",
        "url": "https://example.com/article",
        "sourceType": "article",
        "summary": "...",
        "createdAt": "2024-01-20T10:00:00.000Z",
        "categoryName": "AI Research",
        "categorySlug": "ai-research"
      },
      "itemB": {
        "id": "uuid-b",
        "title": "Same Article (Mirror)",
        "url": "https://mirror.com/article",
        "sourceType": "article",
        "summary": "...",
        "createdAt": "2024-01-21T10:00:00.000Z",
        "categoryName": "AI Research",
        "categorySlug": "ai-research"
      }
    }
  ]
}
```

Returns up to 200 pairs, ordered by similarity descending. Queries the `item_relations` table for `relation_type = 'similar'`. Note: as of the current codebase, the embedding worker writes `relation_type = 'related'`; a migration may be needed to align these values.

---

### `GET /api/items/stale`

Find completed items that have never been read and were saved more than N months ago.

**Auth required:** Yes

**Query parameters:**

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `months` | integer | `6` | Cutoff age in months, min 1 |

**Response `200`:**
```json
{
  "stale": [
    {
      "id": "uuid",
      "title": "Old Article",
      "url": "https://example.com",
      "sourceType": "article",
      "summary": "...",
      "createdAt": "2023-06-01T00:00:00.000Z",
      "readCount": 0,
      "categoryName": "Research",
      "categorySlug": "research"
    }
  ],
  "months": 6,
  "cutoff": "2023-07-20T00:00:00.000Z"
}
```

Returns up to 500 items, ordered by `created_at` ascending (oldest first).

---

## Search & Ask

### `GET /api/search`

Semantic search using pgvector cosine similarity. Falls back to PostgreSQL full-text search if embedding generation fails.

**Auth required:** Yes

**Query parameters:**

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `q` | string | Required | Search query |
| `category` | string | — | Filter by category slug |
| `source_type` | string | — | Filter by source type |
| `date_range` | string | — | One of: `7d \| 30d \| 90d` (days back from now) |
| `limit` | integer | `10` | 1–20 results |

**Response `200`:**
```json
{
  "results": [
    {
      "id": "uuid",
      "title": "Relevant Article",
      "url": "https://example.com/article",
      "summary": "A summary of the article...",
      "category": "ai-research",
      "source_type": "article",
      "similarity": 0.87
    }
  ]
}
```

`similarity` is `null` for FTS fallback results. Only `completed` items with non-null embeddings are searched.

**Error responses:**

| Status | Condition |
|--------|-----------|
| `400` | Missing or empty `q` parameter |
| `500` | Both vector search and FTS fallback failed |

---

### `POST /api/ask`

Ask a question using RAG (Retrieval-Augmented Generation). Finds the top-5 most semantically similar items and synthesizes an answer using Claude Sonnet.

**Auth required:** Yes

**Request body:**
```json
{
  "question": "What are the main approaches to training large language models?",
  "category": "ai-research"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `question` | string | Yes | min 1 character |
| `category` | string | No | Restrict context to items in this category slug |

**Response `200`:**
```json
{
  "answer": "Based on your knowledge base, the main approaches include...",
  "sources": [
    {
      "id": "uuid",
      "title": "Training LLMs at Scale",
      "url": "https://example.com/llm-training",
      "relevance": 0.91
    }
  ]
}
```

If no relevant items are found:
```json
{
  "answer": "I could not find any relevant items in your knowledge base to answer that question.",
  "sources": []
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `400` | Invalid JSON or validation failure |
| `500` | Failed to generate embedding or chat completion |

---

### `POST /api/ask/stream`

Same as `POST /api/ask` but streams the answer as NDJSON. Uses `application/x-ndjson` content type.

**Auth required:** Yes

**Request body:** Same as `POST /api/ask`

**Response `200`** — streaming NDJSON, one JSON object per line:

```jsonc
// Answer content delta (multiple chunks)
{"type":"chunk","content":"Based on your knowledge base, "}
{"type":"chunk","content":"the main approaches include..."}

// Source documents (single event, emitted after answer is complete)
{"type":"sources","sources":[{"id":"uuid","title":"Training LLMs at Scale","url":"https://example.com/llm-training","relevance":0.91}]}

// Stream complete
{"type":"done"}
```

**Error chunk** (replaces normal content on failure):
```json
{"type":"error","error":"Failed to generate query embedding"}
```

Response headers include `X-Accel-Buffering: no` to prevent proxy buffering.

---

## Categories

### `GET /api/categories`

List all categories with their item counts.

**Auth required:** Yes

**Response `200`:**
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "AI Research",
      "slug": "ai-research",
      "description": "Papers and articles about AI",
      "color": "#3b82f6",
      "parentId": null,
      "isAiSuggested": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "itemCount": 42
    }
  ]
}
```

Ordered alphabetically by name.

---

### `POST /api/categories`

Create a new category.

**Auth required:** Yes

**Request body:**
```json
{
  "name": "AI Research",
  "description": "Papers and articles about AI",
  "color": "#3b82f6",
  "parent_id": "parent-category-uuid"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | 1–100 characters. Slug is auto-derived. |
| `description` | string | No | |
| `color` | string | No | |
| `parent_id` | UUID | No | Must be an existing category ID |

**Response `201 Created`:**
```json
{
  "id": "new-uuid",
  "name": "AI Research",
  "slug": "ai-research",
  "description": "Papers and articles about AI",
  "color": "#3b82f6",
  "parentId": null,
  "isAiSuggested": false,
  "createdAt": "2024-01-20T10:30:00.000Z"
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `400` | Validation failure |
| `404` | `parent_id` not found |
| `409` | Category name already exists |

---

### `PUT /api/categories/:id`

Update an existing category.

**Auth required:** Yes

**Request body** (all fields optional):
```json
{
  "name": "AI Research Updated",
  "description": "Updated description",
  "color": "#10b981",
  "parent_id": "new-parent-uuid",
  "is_ai_suggested": false
}
```

Updating `name` also updates `slug`. Set `parent_id` to `null` to remove parent.

**Response `200`:** Full updated category object (same shape as POST response)

**Error responses:**

| Status | Condition |
|--------|-----------|
| `400` | Validation failure, or `parent_id === id` (self-reference) |
| `404` | Category not found, or `parent_id` not found |
| `409` | Name collision with another category |

---

### `DELETE /api/categories/:id`

Delete a category. If the category has items, `reassign_to` is required.

**Auth required:** Yes

**Query parameters:**

| Parameter | Type | Notes |
|-----------|------|-------|
| `reassign_to` | string | Required when category has items. UUID of target category, or `"none"` to unassign items. |

**Response `200`:**
```json
{ "deleted": true, "id": "uuid" }
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404` | Category not found, or `reassign_to` target not found |
| `409` | `{ "error": "Category has items. Provide reassign_to...", "item_count": 5 }` — missing `reassign_to` |

---

## Tags

### `GET /api/tags`

List all tags with live usage counts.

**Auth required:** Yes

**Response `200`:**
```json
{
  "tags": [
    {
      "id": "uuid",
      "name": "machine-learning",
      "slug": "machine-learning",
      "isAiGenerated": true,
      "usageCount": 28,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

Ordered by usage count descending, then alphabetically by name.

---

### `DELETE /api/tags/:id`

Delete a tag. All `item_tags` associations are removed via cascade.

**Auth required:** Yes

**Response `200`:**
```json
{ "deleted": true, "id": "uuid" }
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404` | Tag not found |

---

### `POST /api/tags/merge`

Merge a source tag into a target tag. All items that had the source tag get the target tag added (if not already present). The source tag is then deleted.

**Auth required:** Yes

**Request body:**
```json
{
  "source_id": "source-tag-uuid",
  "target_id": "target-tag-uuid"
}
```

**Response `200`:**
```json
{
  "merged": true,
  "source": { "id": "source-uuid", "name": "ml" },
  "target": { "id": "target-uuid", "name": "machine-learning" },
  "items_updated": 12
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `400` | Validation failure, or source and target are the same |
| `404` | Source or target tag not found |

---

### `GET /api/tags/suggestions`

Suggest candidate tag merge pairs based on name similarity.

**Auth required:** Yes

Computes pairwise name similarity using:
- Case/separator variants (score 1.0): `ML` and `ml`, `machine-learning` and `machine_learning`
- Substring containment (score 0.9): `pytorch` and `pytorch-lightning`
- Abbreviation match (score 0.85): `ML` and `machine-learning`

Returns up to 100 suggestions with score >= 0.85, ordered by similarity then combined usage count.

**Response `200`:**
```json
{
  "suggestions": [
    {
      "tagA": { "id": "uuid-a", "name": "ml", "slug": "ml", "usageCount": 5 },
      "tagB": { "id": "uuid-b", "name": "ML", "slug": "ml-1", "usageCount": 3 },
      "similarity": 1.0,
      "reason": "case or separator variant"
    }
  ]
}
```

---

## Export & Admin

### `GET /api/export/json`

Export all data as a JSON backup file. Excludes embedding vectors.

**Auth required:** Yes

**Response `200`** — `Content-Type: application/json`, attachment download

```json
{
  "version": 1,
  "exportedAt": "2024-01-20T10:30:00.000Z",
  "categories": [...],
  "tags": [...],
  "items": [...],
  "itemTags": [
    { "itemId": "uuid", "tagId": "uuid", "confidence": 0.9 }
  ]
}
```

---

### `GET /api/export/zip`

Download all Markdown knowledge files as a ZIP archive.

**Auth required:** Yes

**Response `200`** — `Content-Type: application/zip`, attachment `cortex-knowledge.zip`

Contains all `.md` files from the `knowledge/` directory, preserving relative paths.

---

### `POST /api/export/rebuild`

Rebuild all Markdown files for completed/ai-complete items from scratch. Also regenerates `_index.json`.

**Auth required:** Yes

**Request body:** None required

**Response `200`:**
```json
{
  "rebuilt": 40,
  "errors": 2,
  "errorIds": ["uuid-a", "uuid-b"]
}
```

---

### `POST /api/import`

Import data from a JSON export. Accepts either a JSON body or a multipart form with a `file` field.

**Auth required:** Yes

**Request** — JSON body:
```json
{
  "version": 1,
  "categories": [...],
  "tags": [...],
  "items": [...],
  "itemTags": [...]
}
```

Or multipart/form-data with a `file` field containing the JSON export file.

All entities are imported with `ON CONFLICT DO NOTHING` — existing records (by UUID) are skipped.

**Response `200`:**
```json
{
  "imported": true,
  "stats": {
    "categories": { "imported": 5, "skipped": 1 },
    "tags": { "imported": 20, "skipped": 3 },
    "items": { "imported": 38, "skipped": 2 },
    "itemTags": { "imported": 80, "skipped": 0 }
  }
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `400` | Invalid JSON, no file provided, or data fails schema validation |

---

### `POST /api/admin/clear-data`

Delete all items (and cascaded item_tags, item_relations). Categories and tags are not deleted.

**Auth required:** Yes

**Request body:**
```json
{ "confirm": true }
```

The `confirm: true` field is required as a safety mechanism. Omitting it returns a 400 error.

**Response `200`:**
```json
{ "cleared": true }
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `400` | Missing `{ "confirm": true }` |

---

### `POST /api/admin/reprocess-all`

Reset all items to `pending` and re-enqueue them for the full extraction pipeline.

**Auth required:** Yes

**Request body:** None required

**Response `200`:**
```json
{ "enqueued": 42 }
```

---

### `POST /api/admin/rebuild-embeddings`

Re-enqueue all `completed` items into the embedding queue to regenerate embeddings and relations. Sets their status to `ai-complete` so the embedding worker picks them up.

**Auth required:** Yes

**Request body:** None required

**Response `200`:**
```json
{ "enqueued": 38 }
```

---

## Analytics

### `GET /api/analytics/overview`

Get aggregate statistics about the knowledge base.

**Auth required:** No (no `validateApiKey` call in this route)

**Response `200`:**
```json
{
  "total_items": 150,
  "items_this_week": 12,
  "items_this_month": 35,
  "by_source_type": [
    { "source_type": "article", "count": 80 },
    { "source_type": "youtube", "count": 40 }
  ],
  "by_category": [
    { "name": "AI Research", "color": "#3b82f6", "count": 42 }
  ],
  "items_by_date": [
    { "date": "2024-01-19", "count": 5 },
    { "date": "2024-01-20", "count": 7 }
  ],
  "top_tags": [
    { "name": "machine-learning", "slug": "machine-learning", "count": 28 }
  ],
  "read_stats": {
    "total_saved": 150,
    "total_read": 45,
    "read_rate": 0.3
  },
  "estimated_cost_usd": 2.34
}
```

- `by_category`: top 15 categories by item count
- `by_date`: last 30 days
- `top_tags`: top 30 tags by usage count (usage_count > 0 only)
- `estimated_cost_usd`: rough estimate based on model pricing heuristics

---

### `GET /api/analytics/timeline`

Get daily item ingestion counts over a time window.

**Auth required:** No (no `validateApiKey` call in this route)

**Query parameters:**

| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| `days` | integer | `30` | Window in days, clamped to 7–90 |

**Response `200`:**
```json
{
  "days": 30,
  "data": [
    { "date": "2024-01-01", "count": 3 },
    { "date": "2024-01-02", "count": 7 }
  ]
}
```

Only days with at least one item are included. Days with zero saves are omitted.

---

## Other Endpoints

### `GET /api/health`

Health check. No authentication required.

**Response `200`:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

---

### `GET /api/relations/:id`

Get all semantic relations for a given item.

**Auth required:** Yes

**Response `200`** — array of related items:
```json
[
  {
    "id": "related-uuid",
    "title": "Related Article",
    "url": "https://example.com/related",
    "sourceType": "article",
    "summary": "...",
    "similarity": 0.85,
    "relationType": "related"
  }
]
```

Returns an empty array `[]` if the item has no relations. Items are sorted by similarity descending (null similarities sort last). Relation types: `related | contradicts | builds_on | references`.

**Error responses:**

| Status | Condition |
|--------|-----------|
| `404` | Item not found |

---

### `GET /api/channels`

List all Discord channel-to-category mappings.

**Auth required:** Yes

**Response `200`** — array of mappings:
```json
[
  {
    "discordChannelId": "123456789",
    "discordChannelName": "ai-papers",
    "categorySlug": "ai-research",
    "categoryName": "AI Research"
  }
]
```

Mappings are stored in `knowledge/_channel_mappings.json`.

---

### `POST /api/channels`

Create or update a Discord channel-to-category mapping (upsert by channel ID).

**Auth required:** Yes

**Request body:**
```json
{
  "channelId": "123456789",
  "channelName": "ai-papers",
  "categorySlug": "ai-research"
}
```

**Response `200`:**
```json
{
  "discordChannelId": "123456789",
  "discordChannelName": "ai-papers",
  "categorySlug": "ai-research",
  "categoryName": "AI Research"
}
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `400` | Validation failure |
| `404` | Category with the given slug does not exist |
| `500` | Failed to write mappings file |

---

### `GET /api/settings`

Get current model configuration and API key status.

**Auth required:** Yes

**Response `200`:**
```json
{
  "models": {
    "summarize": "anthropic/claude-sonnet-4-5",
    "categorize": "anthropic/claude-haiku-4-5",
    "embed": "openai/text-embedding-3-small",
    "chat": "anthropic/claude-sonnet-4-5"
  },
  "apiKeysConfigured": {
    "openrouter": true,
    "jina": false,
    "discord": true
  }
}
```

`apiKeysConfigured` shows whether each key is set in `config.json`. Actual key values are never returned.

---

### `PUT /api/settings`

Update model configuration. Writes to `config.json`. Does not update API keys.

**Auth required:** Yes

**Request body:**
```json
{
  "models": {
    "summarize": "anthropic/claude-opus-4-5",
    "categorize": "anthropic/claude-haiku-4-5",
    "embed": "openai/text-embedding-3-small",
    "chat": "anthropic/claude-opus-4-5"
  }
}
```

All four model fields (`summarize`, `categorize`, `embed`, `chat`) are required. Existing API keys are preserved.

**Response `200`:** Same shape as `GET /api/settings`

**Error responses:**

| Status | Condition |
|--------|-----------|
| `400` | Validation failure (missing model field, empty string) |
