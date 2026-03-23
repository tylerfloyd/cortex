# Configuration Reference

## Environment Variables

All environment variables are defined in `.env.example` at the repository root. Copy it to `.env` before starting the app.

### Infrastructure

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://reader:password@localhost:5432/reader_organizer` | Full PostgreSQL connection string. When using Docker Compose, the default points to the `db` service. When running the app container via `docker compose up app`, the compose file overrides this to use `db` as the hostname automatically. |
| `DB_PASSWORD` | Yes | `password` | Password for the `reader` PostgreSQL user. Used by the `db` Docker Compose service to initialize the database. Must match the password in `DATABASE_URL`. |
| `REDIS_URL` | Yes | `redis://localhost:6379` | Redis connection string. BullMQ parses this URL to connect. Supports password and database number in the URL (e.g. `redis://:password@host:6379/0`). Note: if your Redis provider requires ACL username authentication, you will need to manually set `username` in the connection options — see `app/src/lib/queue/connection.ts`. |

### Core

| Variable | Required | Default | Description |
|---|---|---|---|
| `API_KEY` | Yes | — | A secret you choose. Used to authenticate all API requests (web UI, browser extension, Discord bot, MCP server, curl). This is not from any third-party service — generate one with `openssl rand -hex 32`. |
| `NEXT_PUBLIC_APP_URL` | Yes | `http://localhost:3000` | The public base URL of your Cortex instance. Must be accessible from any client that links back to Cortex (e.g. Discord embeds). Include the scheme and no trailing slash. |

### AI

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `OPENROUTER_API_KEY` | Yes | Routes AI requests to models from Anthropic, OpenAI, Meta, and others via a single API. Used for summarization, categorization, embeddings, and chat. | [openrouter.ai/keys](https://openrouter.ai/keys) |

### Extractors

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `JINA_API_KEY` | Recommended | Jina AI is used for article content extraction. Without it, Cortex falls back to a local extractor using jsdom and Mozilla Readability, which is less reliable for paywalled or JS-heavy pages. | [jina.ai](https://jina.ai) — free tier available |

### Discord

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `DISCORD_TOKEN` | Optional | Bot token for the Discord integration. Only needed if you run the `discord-bot` service. | [discord.com/developers/applications](https://discord.com/developers/applications) — see [docs/discord-bot.md](discord-bot.md) |

---

## Runtime Configuration (config.json)

In addition to environment variables, Cortex supports a runtime configuration file at `app/data/config.json`. This file is created the first time you save settings through the Settings page in the UI.

**Location:** `app/data/config.json` (relative to where the app process runs; inside Docker it is at `/app/data/config.json`)

**What it stores:**

```json
{
  "models": {
    "summarize": "anthropic/claude-sonnet-4-5",
    "categorize": "anthropic/claude-haiku-4-5",
    "embed": "openai/text-embedding-3-small",
    "chat": "anthropic/claude-sonnet-4-5"
  },
  "apiKeys": {
    "openrouter": null,
    "jina": null,
    "discord": null
  }
}
```

**How to edit:** Open the Settings page in the web UI. Changes take effect immediately for subsequent requests — no restart needed.

**Priority:** Values in `config.json` override the corresponding environment variables. For example, if `apiKeys.openrouter` is set in `config.json`, it takes precedence over the `OPENROUTER_API_KEY` environment variable. This allows per-instance overrides without modifying `.env`.

### Available Model IDs

These are the model IDs available through OpenRouter. You can also use any other model ID supported by OpenRouter — these are the defaults and tested options.

| Task | Default model ID | Notes |
|---|---|---|
| `summarize` | `anthropic/claude-sonnet-4-5` | Generates item summaries and key insights |
| `categorize` | `anthropic/claude-haiku-4-5` | Assigns categories and tags; uses a cheaper/faster model |
| `embed` | `openai/text-embedding-3-small` | Computes 1536-dimension embedding vectors for semantic search |
| `chat` | `anthropic/claude-sonnet-4-5` | Used for RAG question-answering |
| `budget` (internal) | `meta-llama/llama-3.1-8b-instruct` | Fallback; not currently user-configurable |

To use a different model, update the relevant field in the Settings page or edit `config.json` directly with any valid OpenRouter model ID.

---

## Docker Compose Services

The `docker-compose.yml` at the repository root defines four services:

### `db`

PostgreSQL 16 with the pgvector extension.

- **Image:** `pgvector/pgvector:pg16`
- **Port:** `5432` (host) → `5432` (container)
- **Volume:** `pgdata` — persists database data across container restarts
- **Health check:** `pg_isready -U reader -d reader_organizer`, interval 10s, timeout 5s, 5 retries
- **Credentials:** User `reader`, password from `DB_PASSWORD` env var (default `password`), database `reader_organizer`

### `redis`

Redis 7 (Alpine).

- **Image:** `redis:7-alpine`
- **Port:** `6379` (host) → `6379` (container)
- **Volume:** `redisdata` — persists queue data across container restarts
- **Health check:** `redis-cli ping`, interval 10s, timeout 5s, 5 retries

### `app`

The Next.js application, built from `./app/Dockerfile`.

- **Port:** `3000` (host) → `3000` (container)
- **Volume:** `knowledge_files` mounted at `/app/knowledge`
- **Depends on:** `db` and `redis` (waits for healthy status)
- **Health check:** `curl -f http://localhost:3000/api/health`, interval 30s, timeout 10s, 3 retries, 30s start period
- **Environment:** Receives `DATABASE_URL`, `REDIS_URL`, `OPENROUTER_API_KEY`, `JINA_API_KEY`, `API_KEY`, `NEXT_PUBLIC_APP_URL` from the host environment

### `discord-bot`

The Discord bot, built from `./discord-bot`.

- **Depends on:** `app` (waits for healthy status before starting)
- **Restart policy:** `unless-stopped`
- **Environment:** Receives `DISCORD_TOKEN` and `API_KEY` from the host; `API_URL` is hardcoded to `http://app:3000` (the internal Docker network address of the `app` service)

To run all services together:

```bash
docker compose up -d
```

To run only the infrastructure (for local development where you run the app and worker directly):

```bash
docker compose up db redis -d
```
