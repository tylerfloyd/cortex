# Cortex UI Modernization & Auth Security Design

**Date:** 2026-04-19  
**Status:** Approved

## Overview

Two goals: modernize the visual design of the Cortex web app and harden the login endpoint against brute-force attacks. The design direction is developer-dark — dark chromatic neutrals with a cyan/teal accent, Lucide icons throughout, and depth separation between chrome (sidebar + topbar) and content.

---

## 1. Color System (`app/src/app/globals.css`)

**Problem:** All CSS variables currently have zero chroma (pure neutral gray). The result is a flat, dated look with no visual depth or personality.

**Solution:** Replace with chromatic neutrals — dark backgrounds with a faint blue/cyan cast — and introduce a distinct cyan accent color.

### Dark mode variables (becomes primary feel):

| Token | Value | Purpose |
|---|---|---|
| `--background` | `oklch(0.12 0.012 220)` | Main content area |
| `--card` | `oklch(0.17 0.01 220)` | Cards, elevated surfaces |
| `--popover` | `oklch(0.17 0.01 220)` | Dropdowns, popovers |
| `--foreground` | `oklch(0.95 0.005 220)` | Primary text |
| `--card-foreground` | `oklch(0.95 0.005 220)` | Text on cards |
| `--popover-foreground` | `oklch(0.95 0.005 220)` | Text in popovers |
| `--primary` | `oklch(0.70 0.15 200)` | Cyan accent — buttons, links, active states |
| `--primary-foreground` | `oklch(0.10 0.01 220)` | Dark text on cyan |
| `--secondary` | `oklch(0.22 0.01 220)` | Secondary surfaces |
| `--secondary-foreground` | `oklch(0.90 0.005 220)` | Text on secondary |
| `--muted` | `oklch(0.20 0.01 220)` | Muted backgrounds |
| `--muted-foreground` | `oklch(0.58 0.012 220)` | Muted text |
| `--accent` | `oklch(0.22 0.01 220)` | Hover backgrounds |
| `--accent-foreground` | `oklch(0.90 0.005 220)` | Text on accent |
| `--destructive` | `oklch(0.65 0.22 25)` | Errors, destructive actions |
| `--border` | `oklch(0.28 0.015 220)` | Chromatic borders |
| `--input` | `oklch(0.22 0.01 220)` | Input backgrounds |
| `--ring` | `oklch(0.70 0.15 200)` | Focus ring (cyan) |
| `--sidebar` | `oklch(0.14 0.01 220)` | Sidebar background |
| `--sidebar-foreground` | `oklch(0.90 0.005 220)` | Sidebar text |
| `--sidebar-primary` | `oklch(0.70 0.15 200)` | Active nav accent |
| `--sidebar-primary-foreground` | `oklch(0.10 0.01 220)` | Text on active nav |
| `--sidebar-accent` | `oklch(0.20 0.01 220)` | Sidebar hover |
| `--sidebar-accent-foreground` | `oklch(0.90 0.005 220)` | Sidebar hover text |
| `--sidebar-border` | `oklch(0.22 0.012 220)` | Sidebar dividers |

### Light mode variables:

| Token | Value |
|---|---|
| `--background` | `oklch(0.99 0.003 220)` |
| `--card` | `oklch(0.98 0.003 220)` |
| `--foreground` | `oklch(0.12 0.01 220)` |
| `--primary` | `oklch(0.55 0.15 200)` |
| `--primary-foreground` | `oklch(0.99 0.003 220)` |
| `--secondary` | `oklch(0.94 0.005 220)` |
| `--secondary-foreground` | `oklch(0.20 0.01 220)` |
| `--muted` | `oklch(0.94 0.005 220)` |
| `--muted-foreground` | `oklch(0.50 0.01 220)` |
| `--accent` | `oklch(0.94 0.005 220)` |
| `--accent-foreground` | `oklch(0.20 0.01 220)` |
| `--border` | `oklch(0.88 0.008 220)` |
| `--input` | `oklch(0.88 0.008 220)` |
| `--ring` | `oklch(0.55 0.15 200)` |
| `--sidebar` | `oklch(0.96 0.004 220)` |
| `--sidebar-foreground` | `oklch(0.15 0.01 220)` |
| `--sidebar-primary` | `oklch(0.55 0.15 200)` |
| `--sidebar-primary-foreground` | `oklch(0.99 0.003 220)` |
| `--sidebar-accent` | `oklch(0.92 0.006 220)` |
| `--sidebar-accent-foreground` | `oklch(0.15 0.01 220)` |
| `--sidebar-border` | `oklch(0.90 0.006 220)` |

---

## 2. Sidebar (`app/src/components/layout/Sidebar.tsx`)

**Problem:** Navigation uses emojis instead of a proper icon system. Active state is only a text color change — no visual weight.

**Changes:**

- Replace all emoji nav entries with Lucide icon + label pairs:
  - Dashboard → `LayoutDashboard`
  - Library → `BookOpen`
  - Inbox → `Inbox`
  - Search → `Search`
  - Analytics → `BarChart2`
  - Taxonomy → `Tag`
  - Data Hygiene → `ShieldCheck`
  - Settings → `Settings2`
- Active nav item: filled pill with `bg-sidebar-primary text-sidebar-primary-foreground` (cyan background, dark text) — matches existing class names, just becomes visually meaningful with the new palette
- Logo area: "CORTEX" in `font-mono tracking-widest text-primary` — cyan monospace wordmark, no image required
- Category section: inherits new palette, no structural changes

---

## 3. TopBar (`app/src/components/layout/TopBar.tsx`)

**Problem:** Same background color as content area — no visual separation between chrome and content.

**Changes:**

- Background: `bg-sidebar` (matches sidebar tone) instead of `bg-background` — creates a unified chrome layer across top + left
- Bottom border: uses `border-sidebar-border` (chromatic, more visible)
- Search input: increase to `h-10`, add `focus-visible:ring-primary` for cyan focus ring — elevated visual priority
- Mobile wordmark: "Cortex" → "CORTEX" in `font-mono tracking-widest text-primary` to match sidebar logo
- Theme toggle + logout hover states: inherit updated accent palette, no code changes needed

---

## 4. Login Page (`app/src/app/login/page.tsx`)

**Problem:** Bare card on a flat background, no branding, generic appearance.

**Changes:**

- Full-screen background: `--background` with an inline radial gradient overlay — soft cyan glow at 8% opacity centered behind the card
- Above the form card: "CORTEX" wordmark (`font-mono tracking-widest text-primary text-2xl`) + "Personal knowledge base" subtitle in muted foreground
- Card: `shadow-2xl border-border` — feels elevated and grounded
- Password input: full-width, styled with new palette, cyan focus ring via `focus-visible:ring-ring`
- Submit button: full-width, `bg-primary text-primary-foreground` — the one strong cyan element on the page
- Error state — two variants:
  1. Wrong password (`?error=wrong`): "Incorrect password. Please try again."
  2. Rate limited (`?error=ratelimit`): "Too many attempts — please wait before trying again."
- Login route (`/api/auth/login`): change the redirect from `?error=1` to `?error=wrong` on failed password — a one-line change
- Rate limit redirect: handled entirely in nginx via `error_page 429 /login?error=ratelimit` — the app route does not need to handle 429 itself

---

## 5. Dashboard Components (`app/src/app/(dashboard)/page.tsx`)

**Problem:** Cards, badges, and hover states inherit the flat grayscale — nothing draws the eye to important data.

**Changes (palette/depth only — no layout or data changes):**

- **Stat cards** (Total Items, This Week): add `border-l-2 border-primary` left accent border
- **Card hover**: `group-hover:border-primary/40` transition on library/discover item cards
- **Badges**:
  - `secondary` variant: chromatic dark background, slightly cyan-tinted text
  - `outline` variant: `border-primary/30` — subtle cyan border distinguishes tags from categories
  - `processing` status badge: styled with `bg-primary/20 text-primary border-primary/40`
- **"View all →" links**: `text-primary hover:text-primary/80`
- **Processing queue dividers**: use `divide-border` (chromatic)

---

## 6. Security: Nginx Rate Limiting (`nginx.conf`)

**Problem:** `/api/auth/login` is covered by the blanket `/api/` limit (10r/s, burst=20) — far too permissive for an authentication endpoint.

**Changes:**

- Add a dedicated `limit_req_zone` for login: `5r/m` per IP (5 attempts per minute), burst of 3 with nodelay
- Add a specific `location /api/auth/login` block before the general `/api/` block with this stricter zone
- Return `429` (not `503`) on limit breach — semantically correct for rate limiting
- Add `limit_req_status 429` directive

```nginx
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
```

```nginx
location = /api/auth/login {
    limit_req zone=login burst=3 nodelay;
    limit_req_status 429;
    proxy_pass http://app;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

At 5r/m with burst=3, an attacker gets 3 immediate attempts then one attempt every 12 seconds — effectively defeating automated brute force. A 40-character password remains the real defense; this is belt-and-suspenders.

**Login route update:** The app route changes `?error=1` to `?error=wrong` (one-line change). Nginx intercepts 429s before they reach the app and redirects to `/login?error=ratelimit` via `error_page 429 /login?error=ratelimit`.

---

## Files Changed

| File | Change |
|---|---|
| `app/src/app/globals.css` | Full color variable replacement |
| `app/src/components/layout/Sidebar.tsx` | Emoji → Lucide icons, logo wordmark |
| `app/src/components/layout/TopBar.tsx` | `bg-sidebar`, search styling, mobile wordmark |
| `app/src/app/login/page.tsx` | Radial gradient bg, wordmark, dual error states |
| `app/src/app/(dashboard)/page.tsx` | Accent borders, badge styling, hover states |
| `nginx.conf` | Login-specific rate limit zone + location block |

## Out of Scope

- Layout restructuring on any page
- New features or data changes
- Font changes (Geist is already correct for this aesthetic)
- Other dashboard pages beyond the main dashboard
