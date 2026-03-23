# Cortex

A self-hosted personal knowledge management system for capturing, organizing, and querying articles, YouTube videos, Reddit threads, PDFs, and web content — powered by AI.

## Features

- **Multi-source capture** — Articles (Jina Reader + Readability), YouTube transcripts, Reddit threads, Twitter/X, PDFs
- **AI processing** — Automatic summarization, categorization, tagging, and semantic embedding via OpenRouter
- **Web dashboard** — Browse, search, and manage your knowledge base at `localhost:3000`
- **Semantic search** — pgvector cosine similarity search with full-text fallback
- **RAG chat** — Ask questions, get answers grounded in your saved content (streaming)
- **Discord bot** — Save URLs by posting them in Discord; search and query via commands
- **MCP server** — Expose your knowledge base to Claude Code and other AI assistants
- **Chrome extension** — One-click page saving from the browser
- **Markdown export** — Every item exported as a `.md` file for use with `@`-mentions in Claude Code
- **Analytics** — Charts for items over time, source breakdown, tag cloud, cost tracking

## Architecture

```
cortex/
├── app/                    # Next.js 15 App Router + TypeScript
│   ├── src/app/            # Pages & API routes
│   ├── src/lib/            # DB, AI, extractors, queue
│   └── src/components/     # React components
├── discord-bot/            # discord.js v14 bot service
├── mcp-server/             # MCP server (stdio + SSE transports)
├── browser-extension/      # Chrome Manifest V3 extension
└── docker-compose.yml      # PostgreSQL 16 + pgvector, Redis
```

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React, Tailwind CSS v4, shadcn/ui |
| Database | PostgreSQL 16 + pgvector |
| ORM | Drizzle ORM |
| Queue | BullMQ + Redis |
| AI | OpenRouter (Claude Sonnet 4.5, Claude Haiku 4.5, text-embedding-3-small) |
| Discord | discord.js v14 |
| MCP | @modelcontextprotocol/sdk |

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 20+
- npm

### 1. Environment setup

```bash
cp .env.example .env
# Edit .env and fill in your API keys
```

Required env vars:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `OPENROUTER_API_KEY` — [openrouter.ai](https://openrouter.ai) API key
- `JINA_API_KEY` — [jina.ai](https://jina.ai) API key (for article extraction)
- `API_KEY` — Your chosen secret key for the Cortex API

Optional:
- `DISCORD_TOKEN` — Discord bot token
- `NEXT_PUBLIC_APP_URL` — Public URL for the app (default: `http://localhost:3000`)

### 2. Start infrastructure

```bash
docker compose up db redis -d
```

### 3. Run the web app

```bash
cd app
npm install
npm run db:migrate    # apply schema
npm run db:seed       # seed default categories
npm run dev           # start dev server at localhost:3000
```

### 4. Run the job worker (separate terminal)

```bash
cd app
npm run worker:dev
```

### 5. Optional services

```bash
# Discord bot
cd discord-bot && npm install && npm run dev

# MCP server (Claude Code integration)
cd mcp-server && npm install && npm run dev
```

## Dashboard Pages

| Route | Description |
|---|---|
| `/` | Home — stats, recently saved, processing queue, Discover |
| `/inbox` | Add URLs (single or bulk), view processing queue |
| `/library` | Browse all saved items with filtering, sorting, bulk operations |
| `/library/[id]` | Item detail — summary, insights, related items, edit |
| `/search` | Semantic search + RAG chat (Ask mode) |
| `/taxonomy` | Manage categories, tags, Discord channel mapping |
| `/settings` | API keys, model selection, export/import |
| `/hygiene` | Duplicate detection, stale content, tag cleanup |
| `/analytics` | Charts: items over time, source types, categories, tag cloud |

## API

All routes require `x-api-key: <API_KEY>` header.

```
POST /api/items/ingest     Save a URL
GET  /api/items            List items (filterable)
GET  /api/items/:id        Get item
PATCH /api/items/:id       Update item
DELETE /api/items/:id      Delete item
GET  /api/search?q=...     Semantic search
POST /api/ask              RAG Q&A
POST /api/ask/stream       Streaming RAG Q&A
GET  /api/categories       List categories
GET  /api/analytics/overview  Analytics data
GET  /api/health           Health check
```

## MCP Server (Claude Code)

After building the MCP server:

```bash
cd mcp-server && npm run build
```

Add to your Claude Code settings:

```json
{
  "mcpServers": {
    "cortex": {
      "command": "node",
      "args": ["/path/to/cortex/mcp-server/dist/index.js"],
      "env": {
        "CORTEX_API_URL": "http://localhost:3000",
        "CORTEX_API_KEY": "your-api-key"
      }
    }
  }
}
```

Available tools: `search_knowledge`, `get_item`, `list_categories`, `list_recent`, `ask_knowledge`

## Chrome Extension

1. Open Chrome → Extensions → Enable Developer Mode
2. Click "Load unpacked" → select `browser-extension/`
3. Click the extension icon → open Options → enter your API URL and key

## Export Markdown for Claude Code

Your knowledge base is automatically exported as `.md` files to `app/knowledge/`. To export to a custom directory:

```bash
cd app && npm run export:markdown -- --output /path/to/output
```

## Development

### Tests

```bash
cd app && npm test          # watch mode
cd app && npm run test:run  # run once
```

### Type checking

```bash
cd app && npx tsc --noEmit
cd discord-bot && npx tsc --noEmit
cd mcp-server && npx tsc --noEmit
```

### Database

```bash
cd app
npm run db:generate   # generate migration from schema changes
npm run db:migrate    # apply migrations
npm run db:seed       # seed default categories
npm run db:studio     # open Drizzle Studio
```
