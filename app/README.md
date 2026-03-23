# Cortex App

This is the main Next.js application for Cortex — a self-hosted personal knowledge management system. It provides the web UI, REST API, and background processing workers.

For general setup instructions, see the [root README](../README.md) and the [docs/](../docs/) directory.

---

## Development Commands

All commands should be run from the `app/` directory.

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js development server with hot reload at http://localhost:3000 |
| `npm run worker:dev` | Start the BullMQ worker with hot reload (run in a separate terminal) |
| `npm run build` | Build the production Next.js bundle |
| `npm run start` | Start the built production server |
| `npm run db:migrate` | Apply pending Drizzle migrations to the database |
| `npm run db:seed` | Seed the database with the 5 default categories |
| `npm run db:generate` | Generate new migration files from schema changes |
| `npm run db:studio` | Open Drizzle Studio (visual database browser) |
| `npm run export:markdown` | Export all knowledge base items as Markdown files |
| `npm run test` | Run Vitest tests in watch mode |
| `npm run test:run` | Run Vitest tests once (CI mode) |
| `npm run lint` | Run ESLint |

> **The worker must run as a separate process.** Next.js is a web server and cannot run persistent background workers. The BullMQ worker (`worker.ts` at the app root) handles extraction jobs from the Redis queue. Without it, items submitted for ingestion remain in `pending` status.

---

## File Structure of `src/`

```
src/
├── app/
│   ├── (dashboard)/          # All UI pages (Next.js route group)
│   │   ├── analytics/        # Analytics and usage stats page
│   │   ├── categories/       # Category management page
│   │   ├── hygiene/          # Duplicate and stale item management
│   │   ├── inbox/            # Submit new URLs for ingestion
│   │   ├── library/          # Browse saved items with filters
│   │   ├── search/           # Full-text and semantic search UI
│   │   ├── settings/         # App settings (models, API keys)
│   │   ├── taxonomy/         # Tag management page
│   │   ├── layout.tsx        # Dashboard shell with navigation
│   │   └── page.tsx          # Root redirect
│   └── api/                  # REST API route handlers
│       ├── ask/              # POST /api/ask — RAG Q&A
│       ├── categories/       # CRUD for categories
│       ├── channels/         # Channel-to-category mappings (Discord)
│       ├── export/           # Markdown export endpoint
│       ├── health/           # GET /api/health — health check
│       ├── import/           # Bulk import endpoint
│       ├── items/            # Item CRUD, ingest, search, stats
│       │   ├── ingest/       # POST /api/items/ingest — submit URL
│       │   ├── processing/   # GET processing status
│       │   ├── search/       # Semantic search
│       │   └── [id]/         # GET/PATCH/DELETE single item
│       ├── relations/        # Item relationship endpoints
│       ├── search/           # Full-text search
│       ├── settings/         # Read/write config.json
│       ├── tags/             # Tag management
│       └── analytics/        # Analytics data endpoints
│
├── components/               # Reusable React components
│
├── lib/
│   ├── ai/
│   │   └── openrouter.ts     # OpenRouter API client (chat, embeddings)
│   ├── auth/
│   │   └── api-key.ts        # API key validation middleware
│   ├── config.ts             # config.json read/write logic
│   ├── db/
│   │   ├── index.ts          # Drizzle database client
│   │   ├── schema.ts         # Table definitions
│   │   └── seed.ts           # Default category seeding
│   ├── extractors/           # Per-source-type content extractors
│   │   ├── article.ts        # Web articles (Jina AI or local fallback)
│   │   ├── pdf.ts            # PDF documents
│   │   ├── reddit.ts         # Reddit posts and threads
│   │   ├── twitter.ts        # Twitter/X posts
│   │   ├── youtube.ts        # YouTube videos (transcript extraction)
│   │   └── utils.ts          # Shared extractor utilities
│   ├── export/               # Markdown export logic
│   ├── queue/
│   │   ├── connection.ts     # Redis connection options (BullMQ)
│   │   └── queues.ts         # Queue definitions
│   └── format.ts             # Date/text formatting utilities
│
└── types/                    # Shared TypeScript type definitions
```

---

## Adding a New Extractor

Extractors live in `src/lib/extractors/`. Each extractor is responsible for fetching content from a specific source type and returning structured data.

1. Create a new file, e.g. `src/lib/extractors/podcast.ts`.
2. Export an async function that accepts a URL and returns a structured content object (title, raw content, author, published date, etc.). Follow the pattern in `article.ts` or `youtube.ts`.
3. Register the new source type in the `detectSourceType` function in `src/app/api/items/ingest/route.ts`.
4. Import and call your extractor from the worker job handler (in `worker.ts` at the app root) where source type is matched.

The extractor only needs to return raw content — the worker handles summarization and embedding via OpenRouter after extraction.

---

## Adding a New API Route

API routes follow Next.js App Router conventions. Each route is a `route.ts` file inside `src/app/api/`.

1. Create a directory, e.g. `src/app/api/my-endpoint/`.
2. Create `route.ts` inside it. Export named functions for each HTTP method (`GET`, `POST`, `PATCH`, `DELETE`).
3. Validate the API key at the start of each handler:

```typescript
import { validateApiKey } from '@/lib/auth/api-key';

export async function GET(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;
  // ...
}
```

4. Use the Drizzle client from `@/lib/db` for database access.

All API routes require the `x-api-key` header with the value of your `API_KEY` environment variable.
