## Services

```
app/               Next.js 16 + BullMQ worker (main app)
discord-bot/       discord.js v14 bot
mcp-server/        MCP server (Claude Code integration)
browser-extension/ Chrome Manifest V3 extension
```

## Dev Setup

```bash
# 1. Start infrastructure (required before anything else)
docker compose up db redis -d

# 2. In app/ — run both in separate terminals:
npm run dev          # web app on :3000
npm run worker:dev   # job worker
```

## Docker Compose

- `docker-compose.yml` — dev/local (builds from source)
- `docker-compose.prod.yml` — production (pull pre-built images)

## Key Env Vars (root .env)

```
DB_PASSWORD, OPENROUTER_API_KEY, JINA_API_KEY, API_KEY, AUTH_PASSWORD, AUTH_SECRET, DISCORD_TOKEN
```
