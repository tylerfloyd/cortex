# Design: UI Overhaul, Bug Fixes & MCP Setup
**Date:** 2026-05-04
**Status:** Approved

## Goals

1. Fix dashboard 500 error (missing middleware.ts)
2. Fix search (API key env var mismatch)
3. Radically simplify the UI — Library-first, minimal chrome
4. Document MCP server setup for the user

---

## 1. Bug Fix: Dashboard 500 (Middleware Not Wired)

**Root cause:** `src/proxy.ts` contains the session guard and `config` matcher, but Next.js only picks up `src/middleware.ts` (or `middleware.ts` at project root). The built `.next/server/middleware.js` is a stale artifact from a previous build. No middleware is currently running, causing unpredictable auth behavior.

**Fix:** Create `app/src/middleware.ts` that re-exports the default and config from proxy:

```ts
export { proxy as default, config } from './proxy'
```

**Files changed:** `app/src/middleware.ts` (1 new file)

---

## 2. Bug Fix: Search API Key

**Root cause:** The semantic search route attempts to generate an embedding for the query via OpenRouter. If the env var name doesn't match what the AI client expects (e.g. `OPENROUTER_API_KEY` vs something else), the call fails silently or throws.

**Fix:** Audit `src/lib/ai/` for the env var reference and ensure it matches the `.env` key name. Add a clear startup check/error log if the key is missing so the failure is obvious.

**Files changed:** `app/src/lib/ai/` (1–2 files), possibly `app/src/app/api/search/route.ts`

---

## 3. MCP Server Setup (Documentation, No Code)

The `mcp-server/` already exists and is documented in `docs/mcp-server.md`. The user needs to:

1. `cd mcp-server && npm install && npm run build`
2. Add to Claude Code settings (`~/.claude/settings.json` or project `.claude/settings.json`):

```json
{
  "mcpServers": {
    "cortex": {
      "command": "node",
      "args": ["/absolute/path/to/cortex/mcp-server/dist/index.js"],
      "env": {
        "CORTEX_API_URL": "http://localhost:3000",
        "CORTEX_API_KEY": "your-api-key"
      }
    }
  }
}
```

Available MCP tools: `search_knowledge`, `get_item`, `list_categories`, `list_recent`, `ask_knowledge`

**Action:** Add a concise "Quick Setup" section to `docs/mcp-server.md` with the exact commands and config block.

---

## 4. UI Overhaul — Library-First, Minimal Chrome

### Philosophy

The user primarily uses Library. The existing UI has 9 nav items, a feature-showcase layout, and visual noise that makes the tool feel heavy rather than useful. The redesign strips back to what matters and makes the tool feel like a focused research/reading companion.

### Navigation Restructure

**Keep (primary nav):**
- Library (new default home / landing page)
- Inbox (add content)
- Search (semantic + RAG chat)
- Settings

**Keep (secondary / collapsed):**
- Analytics
- Taxonomy
- Hygiene

**Remove from nav entirely:**
- Dashboard (absorbed into Library as a small stats strip at the top, or removed)

The sidebar collapses to a narrow icon rail on desktop, expands on hover/click. On mobile it's a bottom sheet or off-canvas drawer.

### Visual Direction

- **Aesthetic:** Content-first, minimal chrome. Reference: Readwise Reader, Linear, Vercel dashboard.
- **Color palette:** Reduce to near-monochrome base (dark: near-black bg, off-white text) with a single muted accent color (slate-blue or amber — replace the current cyan). Fewer colored surfaces.
- **Typography:** Tighten heading sizes. The current `text-2xl font-bold` headers on every page make them feel like slides. Reduce to `text-lg font-semibold` or smaller.
- **Cards:** Replace the current outlined cards with subtle surface-lift style (slightly elevated bg, no ring, thin shadow). Less border-heavy.
- **Density:** Library should show more items per screen. Default to a compact list view (title + source icon + tags + relative time on one row) with an optional card grid toggle.

### Library Page Redesign

The library page becomes the primary surface. Changes:
- Compact list view as default (not grid cards)
- Inline filter bar (source type, category, tag, date range) — no sidebar filter panel
- Quick-view panel: clicking a row opens a right-side detail pane instead of navigating away (optional — can be v2)
- Stats strip at top (total items, this week) — replaces the need for a separate Dashboard

### Pages to Keep Unchanged (for now)

- `/inbox` — functional, low priority to redesign
- `/search` — functional once bug is fixed; minor polish only
- `/settings` — functional, no redesign needed

### Pages to Deprioritize in Nav

Analytics, Taxonomy, Hygiene are power-user features. Move them to a "More" section or a settings sub-page. They don't need to be top-level nav items.

---

## Files Affected

| File | Change |
|------|--------|
| `app/src/middleware.ts` | New — wire up proxy |
| `app/src/lib/ai/*.ts` | Fix env var reference for search |
| `app/src/app/api/search/route.ts` | Possibly fix env var |
| `app/src/components/layout/Sidebar.tsx` | Nav restructure, icon rail |
| `app/src/components/layout/TopBar.tsx` | Simplify or remove |
| `app/src/app/(dashboard)/page.tsx` | Remove or redirect to Library |
| `app/src/app/(dashboard)/library/page.tsx` | Compact list view, stats strip |
| `app/src/app/globals.css` | Color palette, typography |
| `docs/mcp-server.md` | Add quick setup section |
