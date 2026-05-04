# Quick Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the dashboard 500 error (missing middleware.ts), fix the search page API key bug, and add a quick-setup section to the MCP server docs.

**Architecture:** Three independent fixes. Middleware fix is one new file re-exporting from proxy.ts. Search fix is adding `NEXT_PUBLIC_API_KEY` to env files so the client-side search page can authenticate. MCP docs fix is a markdown edit.

**Tech Stack:** Next.js 16 (middleware), TypeScript, Docker Compose, Markdown

---

## Task 1: Fix Dashboard 500 — Wire Up Middleware

**Problem:** `app/src/proxy.ts` contains the session guard and route `config`, but Next.js only recognises `src/middleware.ts` (or `middleware.ts` at project root). No middleware is running; auth is broken and navigation is unpredictable.

**Files:**
- Create: `app/src/middleware.ts`

**Step 1: Create the middleware file**

```ts
export { proxy as default, config } from './proxy'
```

That's the entire file. Next.js automatically picks up the `default` export as the middleware handler and `config.matcher` as the route filter.

**Step 2: Verify it compiles**

```bash
cd app && npx tsc --noEmit
```

Expected: no errors.

**Step 3: Manual smoke test**

Start the dev server (`npm run dev`). Open an incognito window and navigate to `http://localhost:3000`. You should be redirected to `/login` instead of seeing the dashboard or a 500 error.

**Step 4: Commit**

```bash
git add app/src/middleware.ts
git commit -m "fix(auth): create middleware.ts to wire session guard from proxy.ts"
```

---

## Task 2: Fix Search — Expose API Key to Client

**Problem:** `app/src/app/(dashboard)/search/page.tsx` reads `process.env.NEXT_PUBLIC_API_KEY` to set the `x-api-key` header on all API calls. But `NEXT_PUBLIC_API_KEY` is never set in any env file — only `API_KEY` is. The client sends an empty string and every API call returns 401.

**Files:**
- Modify: `app/src/app/(dashboard)/search/page.tsx` (no change needed — the bug is env-side)
- Modify: `.env.example` (root level)
- Modify: `.env` (root level — add the missing key)
- Modify: `docker-compose.yml` (add `NEXT_PUBLIC_API_KEY` to app service)

**Note:** `NEXT_PUBLIC_` vars are embedded into the JS bundle at build time. For a self-hosted personal app this is acceptable. If you ever expose this publicly, consider switching to a session-based auth for internal API calls instead.

**Step 1: Add to root .env**

Open `/Users/boydlloyd/code/cortex/.env` and add:
```
NEXT_PUBLIC_API_KEY=${API_KEY}
```

Or set it to the same literal value as `API_KEY` (Next.js does not expand `${VAR}` in .env files — use the literal value):
```
NEXT_PUBLIC_API_KEY=<same-value-as-API_KEY>
```

**Step 2: Add to .env.example**

Open `/Users/boydlloyd/code/cortex/.env.example` and add:
```
NEXT_PUBLIC_API_KEY=  # Same value as API_KEY — required for browser search
```

**Step 3: Add to docker-compose.yml app service environment**

In `docker-compose.yml`, under `services.app.environment`, add:
```yaml
NEXT_PUBLIC_API_KEY: ${API_KEY}
```

Note: Docker Compose DOES expand `${API_KEY}` from the `.env` file, so this form is correct here.

**Step 4: Verify**

Restart the dev server (`npm run dev`). Navigate to `/search`, type a query, and confirm results appear instead of a 401 error. Check the browser Network tab — the `x-api-key` header should now have a non-empty value.

**Step 5: Commit**

```bash
git add .env.example docker-compose.yml
git commit -m "fix(search): expose NEXT_PUBLIC_API_KEY so browser search can authenticate"
```

Note: Do NOT commit `.env` — it's gitignored and contains secrets.

---

## Task 3: MCP Server Quick Setup Docs

**Problem:** The MCP server exists and works, but the user doesn't know how to set it up. The existing `docs/mcp-server.md` has general info but no "Quick Setup" section with copy-paste commands.

**Files:**
- Modify: `docs/mcp-server.md`

**Step 1: Read the existing doc**

Read `docs/mcp-server.md` to find the right place to insert the quick setup section (should go near the top, before detailed configuration).

**Step 2: Add Quick Setup section**

Insert after the intro paragraph:

```markdown
## Quick Setup

**1. Build the MCP server**

```bash
cd mcp-server
npm install
npm run build
```

**2. Add to Claude Code settings**

Open `~/.claude/settings.json` (or your project's `.claude/settings.json`) and add:

```json
{
  "mcpServers": {
    "cortex": {
      "command": "node",
      "args": ["/absolute/path/to/cortex/mcp-server/dist/index.js"],
      "env": {
        "CORTEX_API_URL": "http://localhost:3000",
        "CORTEX_API_KEY": "your-API_KEY-value"
      }
    }
  }
}
```

Replace `/absolute/path/to/cortex` with the real path (run `pwd` in the repo root to get it).
Replace `your-API_KEY-value` with the value of `API_KEY` from your `.env`.

**3. Restart Claude Code**

Reload the window or restart the app. Run `/mcp` to verify `cortex` appears in the server list.

**Available tools once connected:**
- `search_knowledge` — semantic search your knowledge base
- `ask_knowledge` — ask a question, get an AI answer grounded in your content
- `list_recent` — see what you've saved recently
- `get_item` — fetch a specific item by ID
- `list_categories` — see your categories
```

**Step 3: Commit**

```bash
git add docs/mcp-server.md
git commit -m "docs: add MCP server quick setup section with copy-paste config"
```
