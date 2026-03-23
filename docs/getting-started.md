# Getting Started with Cortex

This guide walks you through setting up Cortex from scratch. By the end you will have a running knowledge management system with a web UI, background processing workers, and optional integrations.

## Prerequisites

- **Docker Desktop** 4.x or later (includes Docker Compose v2)
- **Node.js 20+** and **npm** (required for the app and optional services)
- **OpenRouter API key** — required for AI features (summarization, categorization, embeddings, chat). Sign up at [openrouter.ai](https://openrouter.ai).
- **Jina AI API key** — recommended for article extraction. Sign up at [jina.ai](https://jina.ai). Without this, article content is extracted using a local fallback which may be less reliable.
- **Discord bot token** — optional, needed only if you want the Discord integration. See [docs/discord-bot.md](discord-bot.md).

---

## Step 1 — Clone and configure

Clone the repository and copy the example environment file:

```bash
git clone <repo-url> cortex
cd cortex
cp .env.example .env
```

Open `.env` in your editor. Here is what each variable does:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string. The default matches the Docker Compose service. Change only if using an external database. |
| `DB_PASSWORD` | Yes | Password for the `reader` PostgreSQL user. Used by Docker Compose to initialize the database. |
| `REDIS_URL` | Yes | Redis connection string. The default matches the Docker Compose service. |
| `OPENROUTER_API_KEY` | Yes | Your OpenRouter API key. Get it at [openrouter.ai/keys](https://openrouter.ai/keys). |
| `JINA_API_KEY` | Recommended | Your Jina AI API key for article extraction. Get it at [jina.ai](https://jina.ai). |
| `API_KEY` | Yes | A secret you choose yourself — this is **not** from any third-party service. It authenticates the web UI, CLI, browser extension, and Discord bot against the API. Use a long random string (e.g. `openssl rand -hex 32`). |
| `DISCORD_TOKEN` | Optional | Discord bot token. Only needed if running the Discord integration. |
| `NEXT_PUBLIC_APP_URL` | Yes | The public URL of your Cortex instance. Used to construct links in embeds and exports. For local development, leave it as `http://localhost:3000`. |

A minimal `.env` for local development looks like this:

```bash
DATABASE_URL=postgresql://reader:password@localhost:5432/reader_organizer
DB_PASSWORD=password
REDIS_URL=redis://localhost:6379
OPENROUTER_API_KEY=sk-or-...
JINA_API_KEY=jina_...
API_KEY=my-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 2 — Start infrastructure

Start the PostgreSQL and Redis containers:

```bash
docker compose up db redis -d
```

This starts:
- **`db`** — PostgreSQL 16 with the pgvector extension, listening on port 5432. Data is persisted in a Docker volume named `pgdata`.
- **`redis`** — Redis 7 (Alpine), listening on port 6379. Queue data is persisted in a Docker volume named `redisdata`.

Both services have health checks. Verify they are healthy:

```bash
docker compose ps
```

You should see `healthy` in the STATUS column for both services. You can also check directly:

```bash
# PostgreSQL
docker compose exec db pg_isready -U reader -d reader_organizer

# Redis
docker compose exec redis redis-cli ping
```

Redis should respond with `PONG`. PostgreSQL should say `accepting connections`.

---

## Step 3 — Database setup

Install Node dependencies and run the database migrations:

```bash
cd app
npm install
```

Apply the schema migrations:

```bash
npm run db:migrate
```

This uses Drizzle Kit to apply all pending migrations from `app/drizzle/`. The migrations create all tables (items, categories, tags, job_log, etc.) and also run `app/drizzle/0000_pgvector_setup.sql`, which:

1. Enables the `vector` extension (pgvector) on the database
2. Creates a GIN index for full-text search on item titles, content, and summaries
3. Creates an IVFFlat index for cosine similarity search on the embedding column — this is the index used for semantic search
4. Creates a trigger to auto-update the `updated_at` column on the items table

> **Note:** The IVFFlat index (`idx_items_embedding`) performs best when the table already has data. It is created during migration regardless, so you can add content first and then optionally rebuild the index with `REINDEX INDEX idx_items_embedding` after you have a few hundred items.

Seed the database with the default categories:

```bash
npm run db:seed
```

This creates five categories: **AI/ML**, **Web Development**, **Business**, **DevOps**, and **Uncategorized**. The seed is idempotent — running it again will not create duplicates.

---

## Step 4 — Start the app

Open two terminals. In the first, start the Next.js development server:

```bash
# from the app/ directory
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

In the second terminal, start the BullMQ worker:

```bash
# from the app/ directory
npm run worker:dev
```

> **Why is the worker separate?** Next.js is a web server — it handles HTTP requests but is not designed to run persistent background processes. The BullMQ worker is a separate long-running process that picks up jobs from the Redis queue and does the heavy work: fetching URLs, extracting content, calling the OpenRouter API for summarization and categorization, and computing embeddings. If you do not run the worker, items submitted for ingestion will stay in `pending` status forever.

When you first visit [http://localhost:3000](http://localhost:3000) you will see an empty dashboard with no items saved yet.

---

## Step 5 — Test ingestion

### Via the Inbox page

Click **Inbox** in the left navigation, paste any URL, and click **Save**. The item will appear immediately with a `pending` status.

### Via curl

```bash
curl -X POST http://localhost:3000/api/items/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY" \
  -d '{
    "url": "https://example.com/some-article",
    "capture_source": "api"
  }'
```

A successful response looks like:

```json
{
  "id": "a1b2c3d4-...",
  "status": "queued",
  "source_type": "article",
  "applied_tags": []
}
```

### What happens in the background

1. The API inserts a new item record with status `pending` and pushes a job onto the BullMQ extraction queue.
2. The worker picks up the job, fetches the URL, and extracts the content (using Jina AI for articles if configured, or a local extractor otherwise).
3. The worker calls OpenRouter to generate a summary and automatically assign a category and tags.
4. The worker computes an embedding vector and stores it in the database for semantic search.
5. The item status changes to `completed`.

### Verify it worked

Refresh the dashboard — the item should appear with a title, summary, and category. You can also check via the API:

```bash
curl http://localhost:3000/api/items \
  -H "x-api-key: YOUR_API_KEY"
```

---

## Quick Start

For users who just want the minimum commands to get running:

```bash
# 1. Configure
cp .env.example .env
# Edit .env: set OPENROUTER_API_KEY, API_KEY, and optionally JINA_API_KEY

# 2. Start infrastructure
docker compose up db redis -d

# 3. Install, migrate, seed
cd app
npm install
npm run db:migrate
npm run db:seed

# 4. Start app (terminal 1)
npm run dev

# 5. Start worker (terminal 2)
npm run worker:dev

# Done — open http://localhost:3000
```
