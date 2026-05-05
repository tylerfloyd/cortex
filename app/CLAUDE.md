@AGENTS.md

## Commands

```bash
npm run dev           # Next.js dev server on :3000
npm run worker:dev    # BullMQ job worker (run in separate terminal)
npm run test:run      # run tests once (watch: npm test)
npm run db:migrate    # apply pending migrations
npm run db:generate   # generate migration from schema changes
npm run db:seed       # seed default categories
npm run db:studio     # open Drizzle Studio
npm run build         # production build
```

## Architecture

Two processes must run in dev: the Next.js app (`dev`) and the worker (`worker:dev`). The worker consumes BullMQ jobs for content extraction, AI processing (OpenRouter), and embedding.

- `src/app/` — Next.js App Router pages and API routes
- `src/lib/db/schema/index.ts` — Drizzle schema (all tables exported from here)
- `src/lib/queue/` — BullMQ queues and connection
- `src/lib/ai/` — OpenRouter client and processing logic
- `src/lib/auth/` — HMAC session auth (dashboard) + API key auth (API routes)
- `src/__tests__/` — Vitest tests (also colocated `*.test.ts` files)

## Required Env Vars

```
DATABASE_URL       postgresql://... (pgvector-enabled)
REDIS_URL          redis://...
OPENROUTER_API_KEY openrouter.ai key
JINA_API_KEY       jina.ai key (article extraction)
API_KEY            secret for x-api-key header on API routes
AUTH_SECRET        ≥32 chars, signs HMAC session cookies
AUTH_PASSWORD      password for dashboard login
```

## Optional Env Vars

```
TWITTER_USER_ACCESS_TOKEN  OAuth 2.0 user access token for Twitter home timeline (optional)
TWITTER_USER_ID            Your Twitter numeric user ID (optional)
RESEARCH_CRON              Cron schedule for research agent (default: "0 6 * * *" = 6am daily)
```

## Gotchas

- **BullMQ Redis**: BullMQ bundles its own `ioredis` — do NOT pass a project-level `ioredis` instance. The queue connection is a plain `ConnectionOptions` object parsed from `REDIS_URL`.
- **Auth layers**: Dashboard uses password login + HMAC-signed session cookie (`AUTH_SECRET`). API routes use `x-api-key` header (`API_KEY`). These are separate and independent.
- **Standalone output**: `next.config.ts` sets `output: "standalone"` — affects how builds are structured and deployed.
- **Drizzle credentials**: `drizzle.config.ts` reads `POSTGRES_URL` first, then `DATABASE_URL` as fallback.
- **Login rate limit**: 5 requests/minute, burst 3 — don't hammer it in tests.
