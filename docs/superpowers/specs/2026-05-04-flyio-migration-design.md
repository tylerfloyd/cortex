# Design: Fly.io Migration Plan
**Date:** 2026-05-04
**Status:** Reference — execute when ready

## Current Setup

- Single DigitalOcean Droplet running Docker Compose
- Services: Next.js app + BullMQ worker, Discord bot, PostgreSQL 16 + pgvector, Redis 7
- All services on one machine, all data local to the Droplet

## Target Setup on Fly.io

```
fly.io
├── cortex-app (Fly app)
│   ├── web process  — Next.js (npm run start)
│   └── worker process — BullMQ worker (npm run worker)
├── cortex-discord (Fly app, separate)
│   └── Discord bot
├── cortex-db (Fly Postgres — managed)
│   └── PostgreSQL 16 + pgvector extension
└── cortex-redis (Fly Redis — managed via Upstash)
    └── Redis 7
```

---

## Migration Steps

### Phase 1: Provision infrastructure on Fly.io

```bash
# Install flyctl if needed
brew install flyctl
fly auth login

# Create Fly Postgres (includes pgvector)
fly postgres create --name cortex-db --region ord --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 10

# Create Fly Redis (Upstash — managed Redis, free tier available)
fly redis create --name cortex-redis --region ord
```

Note: Fly Postgres includes the pgvector extension. Run `CREATE EXTENSION vector;` after provisioning.

### Phase 2: Export data from DigitalOcean

SSH into your Droplet, then:

```bash
# Check data size first
docker exec <postgres-container> psql -U reader -d reader_organizer -c "SELECT pg_size_pretty(pg_database_size('reader_organizer'));"

# Dump the database
docker exec <postgres-container> pg_dump -U reader -d reader_organizer -Fc -f /tmp/cortex-backup.dump

# Copy to your local machine
scp root@<droplet-ip>:/tmp/cortex-backup.dump ./cortex-backup.dump
```

### Phase 3: Restore to Fly Postgres

```bash
# Get the Fly Postgres connection string
fly postgres connect -a cortex-db

# Restore (run from your local machine)
fly postgres import ./cortex-backup.dump -a cortex-db
```

### Phase 4: Deploy the app

```bash
# In the repo root, create fly.toml for the app
fly launch --name cortex-app --no-deploy

# Edit fly.toml to add worker process group (see below)
# Set secrets
fly secrets set -a cortex-app \
  DATABASE_URL="<fly-postgres-connection-string>" \
  REDIS_URL="<fly-redis-connection-string>" \
  OPENROUTER_API_KEY="..." \
  JINA_API_KEY="..." \
  API_KEY="..." \
  AUTH_PASSWORD="..." \
  AUTH_SECRET="..."

# Deploy
fly deploy -a cortex-app
```

### Phase 5: Deploy Discord bot

```bash
cd discord-bot
fly launch --name cortex-discord --no-deploy
fly secrets set -a cortex-discord \
  DISCORD_TOKEN="..." \
  API_URL="https://cortex-app.fly.dev" \
  API_KEY="..."
fly deploy -a cortex-discord
```

### Phase 6: Verify and cut over

1. Test all routes on `cortex-app.fly.dev`
2. Verify BullMQ worker is processing jobs (check Fly logs: `fly logs -a cortex-app`)
3. Verify Discord bot responds to commands
4. If you have a custom domain, update DNS to point to `cortex-app.fly.dev`
5. Wait 24-48 hours watching for errors
6. Destroy the Droplet: `doctl compute droplet delete <id>` (or via DO console)

---

## `fly.toml` for cortex-app (two process groups)

```toml
app = "cortex-app"
primary_region = "ord"

[build]
  dockerfile = "app/Dockerfile"

[[services]]
  http_checks = []
  internal_port = 3000
  protocol = "tcp"
  processes = ["web"]

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

[processes]
  web = "npm run start"
  worker = "npm run worker"

[env]
  NODE_ENV = "production"
  PORT = "3000"
```

---

## Cost Estimate (Fly.io)

| Service | Tier | Est. Monthly |
|---------|------|-------------|
| cortex-app (shared-cpu-1x, 256MB) | shared | ~$3–5 |
| cortex-discord (shared-cpu-1x, 256MB) | shared | ~$3 |
| Fly Postgres (shared-cpu-1x, 10GB) | shared | ~$3 |
| Fly Redis (Upstash free tier, <256MB) | free | $0 |
| **Total** | | **~$9–11/month** |

Compare to a basic DigitalOcean Droplet (~$12–24/month depending on size).

---

## Risks / Notes

- **pgvector on Fly Postgres:** Fly's managed Postgres includes pgvector but you must enable it after provisioning: `CREATE EXTENSION IF NOT EXISTS vector;`
- **Volume for `knowledge/` files:** The app mounts a volume for exported markdown files. On Fly, this needs a persistent volume: `fly volumes create knowledge_files --size 1 -a cortex-app`
- **Upstash Redis limits:** Free tier is 256MB max and 10k commands/day. If BullMQ job volume is high, upgrade to the $10/month plan.
- **Worker process:** Fly supports multiple process groups in one app — the worker and web server share the same image but run as separate processes. No separate Dockerfile needed.
