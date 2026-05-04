# UI Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Radically simplify the Cortex UI — make Library the primary view, reduce nav to 4 core items, switch to a near-monochrome palette with a single muted accent, and move to compact content-dense layouts that feel like a focused research tool (not a feature showcase).

**Architecture:** Component-level changes to Sidebar, TopBar, Library page, and global CSS. The dashboard route (`/`) will redirect to `/library`. Secondary nav items (Analytics, Taxonomy, Hygiene) move to a collapsible "More" section. No database changes. No new routes except the redirect.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, Lucide React, shadcn/ui components

**Design reference:** Near-monochrome dark/light base, single muted slate-blue accent (replacing current cyan), compact list-first Library layout, minimal topbar chrome.

---

## Task 1: Update Global Color Palette

**Files:**
- Modify: `app/src/app/globals.css`

**Step 1: Read the current globals.css**

Read the full file first to understand the existing CSS variable structure before making changes.

**Step 2: Replace the color variables**

Replace the `:root` and `.dark` color variable blocks with a near-monochrome palette and single muted accent. The goal: less saturation, less cyan, more neutral. Use slate-blue (`oklch(0.55 0.10 240)`) as the accent instead of the current cyan.

Key variables to change in `.dark` (the primary theme):
```css
:root {
  /* Keep existing neutral scales but desaturate accent */
  --primary: oklch(0.62 0.09 240);          /* muted slate-blue, was cyan */
  --primary-foreground: oklch(0.98 0 0);
  --accent: oklch(0.25 0.03 240);           /* very subtle accent surface */
  --accent-foreground: oklch(0.85 0.03 240);
  --ring: oklch(0.62 0.09 240);
}
```

Also reduce the saturation of the background/card/sidebar surfaces — they should be near-black/near-white with minimal color cast.

**Step 3: Tighten typography defaults**

In `globals.css`, find any global heading size rules and reduce them. Page titles should feel like tool chrome, not document headings:

```css
/* Reduce heading scale — tool chrome, not document headings */
h1 { @apply text-xl font-semibold tracking-tight; }
h2 { @apply text-base font-semibold; }
```

**Step 4: Smoke test**

Start dev server, visit `/library` and `/search`. Verify the palette looks cohesive and the accent color (buttons, active states, links) is now slate-blue instead of cyan.

**Step 5: Commit**

```bash
git add app/src/app/globals.css
git commit -m "feat(ui): replace cyan accent with muted slate-blue, desaturate palette"
```

---

## Task 2: Restructure Sidebar Navigation

**Files:**
- Modify: `app/src/components/layout/Sidebar.tsx`

**Step 1: Read the current Sidebar**

Read the full file.

**Step 2: Reorganise nav items**

Split the nav links array into `PRIMARY_NAV` (always visible) and `SECONDARY_NAV` (collapsed under a "More" toggle):

```ts
const PRIMARY_NAV = [
  { href: '/library', label: 'Library', icon: BookOpen },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/settings', label: 'Settings', icon: Settings2 },
]

const SECONDARY_NAV = [
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/taxonomy', label: 'Taxonomy', icon: Tag },
  { href: '/hygiene', label: 'Data Hygiene', icon: ShieldCheck },
]
```

Remove `Dashboard` from nav entirely (the `/` route will redirect to `/library`).

**Step 3: Add "More" toggle for secondary nav**

Add a `showMore` state (default: `false`). Render a "More" button after primary nav items. When clicked, expand secondary nav items inline beneath it:

```tsx
const [showMore, setShowMore] = useState(false)

// In the nav JSX, after primary items:
<button
  onClick={() => setShowMore(m => !m)}
  className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground w-full rounded-md"
>
  <MoreHorizontal size={16} />
  <span>More</span>
</button>
{showMore && SECONDARY_NAV.map(item => /* same link rendering as primary */)}
```

**Step 4: Tighten sidebar visual weight**

- Reduce sidebar width from its current size to `w-56` (224px)
- Use `text-sm` throughout (not `text-base`)
- Active state: `bg-accent text-accent-foreground` (subtle, not a colored pill)
- Remove the category list section from the sidebar entirely — it adds vertical bulk and categories are accessible from Library filters

**Step 5: Verify active state logic**

The active state for `/library` should use `pathname.startsWith('/library')` so item detail pages (`/library/[id]`) also highlight Library in the nav.

**Step 6: Commit**

```bash
git add app/src/components/layout/Sidebar.tsx
git commit -m "feat(ui): restructure nav — Library-first, secondary items behind More toggle"
```

---

## Task 3: Simplify TopBar

**Files:**
- Modify: `app/src/components/layout/TopBar.tsx`

**Step 1: Read the current TopBar**

Read the full file.

**Step 2: Reduce to minimal chrome**

The topbar should only contain:
- Hamburger menu button (mobile only, to open sidebar)
- App wordmark "CORTEX" (left side, or center on mobile)
- Theme toggle (right side)

Remove any duplicate nav items, breadcrumbs, or feature-specific controls that belong on individual pages. The topbar is pure chrome — page-level actions live on the page.

**Step 3: Reduce topbar height**

Use `h-12` (48px) instead of `h-14` or `h-16`. Less vertical real estate consumed by chrome.

**Step 4: Commit**

```bash
git add app/src/components/layout/TopBar.tsx
git commit -m "feat(ui): simplify topbar to minimal chrome — wordmark + theme toggle only"
```

---

## Task 4: Redirect `/` to `/library`

**Files:**
- Modify: `app/src/app/(dashboard)/page.tsx`

**Step 1: Replace page with redirect**

Replace the entire dashboard page component with a simple redirect. In Next.js 16 App Router, use `redirect()` from `next/navigation`:

```ts
import { redirect } from 'next/navigation'

export default function DashboardPage() {
  redirect('/library')
}
```

Remove the `export const dynamic = 'force-dynamic'` and all imports — nothing else is needed.

**Step 2: Verify**

Visit `http://localhost:3000` (after session login). You should land on `/library` instead of the old dashboard page.

**Step 3: Commit**

```bash
git add app/src/app/(dashboard)/page.tsx
git commit -m "feat(ui): redirect / to /library — Library is the primary view"
```

---

## Task 5: Library Page — Compact List View + Stats Strip

**Files:**
- Modify: `app/src/app/(dashboard)/library/page.tsx`
- Possibly modify: `app/src/components/library/` (check what components exist)

**Step 1: Read the current Library page**

Read the full library page and any components in `app/src/components/library/`.

**Step 2: Add stats strip at top of Library**

The dashboard stats (total items, this week count) should live on the Library page as a small strip so users get the overview without a separate page. Add a small server-side data fetch for total and this-week counts, rendered as inline badges above the filter bar:

```tsx
<div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
  <span><strong className="text-foreground">{total}</strong> items total</span>
  <span><strong className="text-foreground">{thisWeek}</strong> this week</span>
  {topCategory && <span>Top: <strong className="text-foreground">{topCategory.name}</strong></span>}
</div>
```

**Step 3: Add compact list view as default**

If the Library currently shows a card grid, add a list view that shows more items per screen. Default to list view. Each row:
- Source icon (16px)
- Title (truncated to 1 line)
- Category badge
- Up to 2 tag chips
- Relative time (right-aligned, muted)

```tsx
<Link href={`/library/${item.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 rounded-md group">
  <SourceIcon sourceType={item.sourceType} className="shrink-0 size-4 text-muted-foreground" />
  <span className="flex-1 text-sm truncate group-hover:text-primary">{item.title ?? truncateUrl(item.url)}</span>
  {item.categoryName && <Badge variant="secondary" className="text-xs shrink-0">{item.categoryName}</Badge>}
  <span className="text-xs text-muted-foreground shrink-0">{relativeTime(item.createdAt)}</span>
</Link>
```

Wrap items in a single card with `divide-y` between rows.

**Step 4: Add view toggle (list / grid)**

Add a small toggle in the filter bar header (two icon buttons: list and grid). Store preference in `localStorage` via a client component. Default to list.

**Step 5: Verify**

Library shows the stats strip, defaults to compact list view, and the grid toggle works. Clicking a row navigates to the item detail page.

**Step 6: Commit**

```bash
git add app/src/app/(dashboard)/library/
git commit -m "feat(ui): add stats strip and compact list view to Library page"
```

---

## Task 6: Polish Card Components

**Files:**
- Modify: `app/src/components/ui/card.tsx`

**Step 1: Read the current card.tsx**

Read the full file.

**Step 2: Reduce visual weight**

The current card uses `ring-1 ring-foreground/10` which creates a border-heavy look across the app. Switch to a subtle shadow + slightly elevated background approach:

```tsx
// Replace ring-1 ring-foreground/10 with:
className={cn(
  "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground shadow-sm hover:shadow-md transition-shadow ...",
  className
)}
```

Also ensure `bg-card` in the CSS variables is a very slightly elevated surface (not the same as `bg-background`), creating depth without borders.

**Step 3: Commit**

```bash
git add app/src/components/ui/card.tsx
git commit -m "feat(ui): reduce card visual weight — shadow-based elevation over ring borders"
```
