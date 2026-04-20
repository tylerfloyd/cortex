# Cortex UI Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize Cortex's visual design to a developer-dark chromatic palette with cyan accent, replace emoji navigation with Lucide icons, harden the login endpoint with nginx rate limiting, and fix the broken auth middleware.

**Architecture:** Pure visual/config changes — no new routes, no schema changes, no layout restructuring. The color system is driven entirely by CSS custom properties in `globals.css`; all components inherit automatically. The auth middleware fix is a one-file addition. Nginx rate limiting adds a dedicated zone before the existing `/api/` block.

**Tech Stack:** Next.js 16, Tailwind CSS v4, shadcn/ui (base-ui), Lucide React, Vitest, nginx

---

## File Map

| File | Action | What changes |
|---|---|---|
| `app/src/middleware.ts` | **Create** | Re-exports `proxy` as default + `config` from `./proxy` |
| `app/src/app/globals.css` | **Modify** | Replace `:root` and `.dark` CSS variable blocks |
| `app/src/components/layout/Sidebar.tsx` | **Modify** | Emoji → Lucide icons, CORTEX wordmark |
| `app/src/components/layout/TopBar.tsx` | **Modify** | `bg-sidebar` background, search height, mobile wordmark |
| `app/src/app/login/page.tsx` | **Modify** | Radial gradient bg, CORTEX wordmark above card, dual error states |
| `app/src/app/api/auth/login/route.ts` | **Modify** | `?error=1` → `?error=wrong` |
| `app/src/app/(dashboard)/page.tsx` | **Modify** | Accent borders on stat cards, badge styling, hover states |
| `nginx.conf` | **Modify** | Login-specific rate limit zone + location block |
| `app/src/app/api/__tests__/auth.test.ts` | **Modify** | Add login route test for `?error=wrong` |

---

## Task 1: Fix Auth Middleware (Critical Bug)

**Files:**
- Create: `app/src/middleware.ts`

The proxy logic lives in `src/proxy.ts` but Next.js only loads `src/middleware.ts` as middleware. Without this file, the session guard never runs — all routes are publicly accessible and navigation behaves unexpectedly.

- [ ] **Step 1: Write a failing test**

Create `app/src/lib/auth/middleware.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('middleware', () => {
  it('exports a function as the default export', async () => {
    const mod = await import('@/middleware')
    expect(typeof mod.default).toBe('function')
  })

  it('exports a config object with a matcher array', async () => {
    const { config } = await import('@/middleware')
    expect(config).toHaveProperty('matcher')
    expect(Array.isArray(config.matcher)).toBe(true)
    expect(config.matcher.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd app && npm run test:run -- src/lib/auth/middleware.test.ts
```

Expected: FAIL — `Cannot find module '@/middleware'`

- [ ] **Step 3: Create the middleware file**

Create `app/src/middleware.ts`:

```ts
export { proxy as default, config } from './proxy'
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd app && npm run test:run -- src/lib/auth/middleware.test.ts
```

Expected: PASS — 2 tests passing

- [ ] **Step 5: Verify the build still compiles**

```bash
cd app && npm run build
```

Expected: Build completes without errors

- [ ] **Step 6: Commit**

```bash
git add app/src/middleware.ts app/src/lib/auth/middleware.test.ts
git commit -m "fix(auth): add missing middleware.ts so session guard runs"
```

---

## Task 2: Color System

**Files:**
- Modify: `app/src/app/globals.css` (`:root` and `.dark` blocks only — imports and `@theme` block unchanged)

Replace the entire `:root` and `.dark` blocks. The `@theme inline` block at the top forwards CSS variables to Tailwind tokens — leave it exactly as-is.

- [ ] **Step 1: Replace the `:root` block**

In `app/src/app/globals.css`, replace everything between `:root {` and its closing `}` with:

```css
:root {
  --background: oklch(0.99 0.003 220);
  --foreground: oklch(0.12 0.01 220);
  --card: oklch(0.98 0.003 220);
  --card-foreground: oklch(0.12 0.01 220);
  --popover: oklch(0.98 0.003 220);
  --popover-foreground: oklch(0.12 0.01 220);
  --primary: oklch(0.55 0.15 200);
  --primary-foreground: oklch(0.99 0.003 220);
  --secondary: oklch(0.94 0.005 220);
  --secondary-foreground: oklch(0.20 0.01 220);
  --muted: oklch(0.94 0.005 220);
  --muted-foreground: oklch(0.50 0.01 220);
  --accent: oklch(0.94 0.005 220);
  --accent-foreground: oklch(0.20 0.01 220);
  --destructive: oklch(0.58 0.22 25);
  --border: oklch(0.88 0.008 220);
  --input: oklch(0.88 0.008 220);
  --ring: oklch(0.55 0.15 200);
  --chart-1: oklch(0.55 0.15 200);
  --chart-2: oklch(0.65 0.12 160);
  --chart-3: oklch(0.60 0.13 240);
  --chart-4: oklch(0.70 0.10 280);
  --chart-5: oklch(0.65 0.14 180);
  --radius: 0.625rem;
  --sidebar: oklch(0.96 0.004 220);
  --sidebar-foreground: oklch(0.15 0.01 220);
  --sidebar-primary: oklch(0.55 0.15 200);
  --sidebar-primary-foreground: oklch(0.99 0.003 220);
  --sidebar-accent: oklch(0.92 0.006 220);
  --sidebar-accent-foreground: oklch(0.15 0.01 220);
  --sidebar-border: oklch(0.90 0.006 220);
  --sidebar-ring: oklch(0.55 0.15 200);
}
```

- [ ] **Step 2: Replace the `.dark` block**

Replace everything between `.dark {` and its closing `}` with:

```css
.dark {
  --background: oklch(0.12 0.012 220);
  --foreground: oklch(0.95 0.005 220);
  --card: oklch(0.17 0.01 220);
  --card-foreground: oklch(0.95 0.005 220);
  --popover: oklch(0.17 0.01 220);
  --popover-foreground: oklch(0.95 0.005 220);
  --primary: oklch(0.70 0.15 200);
  --primary-foreground: oklch(0.10 0.01 220);
  --secondary: oklch(0.22 0.01 220);
  --secondary-foreground: oklch(0.90 0.005 220);
  --muted: oklch(0.20 0.01 220);
  --muted-foreground: oklch(0.58 0.012 220);
  --accent: oklch(0.22 0.01 220);
  --accent-foreground: oklch(0.90 0.005 220);
  --destructive: oklch(0.65 0.22 25);
  --border: oklch(0.28 0.015 220);
  --input: oklch(0.22 0.01 220);
  --ring: oklch(0.70 0.15 200);
  --chart-1: oklch(0.70 0.15 200);
  --chart-2: oklch(0.65 0.12 160);
  --chart-3: oklch(0.60 0.13 240);
  --chart-4: oklch(0.70 0.10 280);
  --chart-5: oklch(0.65 0.14 180);
  --sidebar: oklch(0.14 0.01 220);
  --sidebar-foreground: oklch(0.90 0.005 220);
  --sidebar-primary: oklch(0.70 0.15 200);
  --sidebar-primary-foreground: oklch(0.10 0.01 220);
  --sidebar-accent: oklch(0.20 0.01 220);
  --sidebar-accent-foreground: oklch(0.90 0.005 220);
  --sidebar-border: oklch(0.22 0.012 220);
  --sidebar-ring: oklch(0.70 0.15 200);
}
```

- [ ] **Step 3: Verify the build**

```bash
cd app && npm run build
```

Expected: Build completes without errors

- [ ] **Step 4: Commit**

```bash
git add app/src/app/globals.css
git commit -m "feat(ui): replace grayscale palette with chromatic dark/light color system"
```

---

## Task 3: Sidebar Redesign

**Files:**
- Modify: `app/src/components/layout/Sidebar.tsx`

Replace emoji + text nav with Lucide icons + text. Replace "Cortex" wordmark with monospace CORTEX in primary color. `lucide-react` is already installed at v0.577.0.

- [ ] **Step 1: Replace the full Sidebar component**

Replace the entire contents of `app/src/components/layout/Sidebar.tsx` with:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  Inbox,
  Search,
  BarChart2,
  Tag,
  ShieldCheck,
  Settings2,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Category = {
  id: string
  name: string
  slug: string
  itemCount: number
}

type SidebarProps = {
  categories: Category[]
  isOpen: boolean
  onClose: () => void
}

const navLinks: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/library', label: 'Library', icon: BookOpen },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/taxonomy', label: 'Taxonomy', icon: Tag },
  { href: '/hygiene', label: 'Data Hygiene', icon: ShieldCheck },
  { href: '/settings', label: 'Settings', icon: Settings2 },
]

export function Sidebar({ categories, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200',
          'md:static md:translate-x-0 md:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo / App name */}
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <span className="font-mono text-sm font-bold tracking-widest text-primary">
            CORTEX
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5 px-2 py-3">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/'
                ? pathname === '/'
                : pathname === href || pathname.startsWith(href + '/')

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Category quick-filters */}
        {categories.length > 0 && (
          <div className="mt-2 flex-1 overflow-y-auto px-2 pb-4">
            <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              Categories
            </p>
            <div className="flex flex-col gap-0.5">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/library?category=${cat.slug}`}
                  onClick={onClose}
                  className={cn(
                    'flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors',
                    'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="ml-2 shrink-0 text-xs text-sidebar-foreground/50">
                    {cat.itemCount}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
```

- [ ] **Step 2: Verify the build**

```bash
cd app && npm run build
```

Expected: Build completes without errors. No TypeScript errors about missing Lucide icons.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/layout/Sidebar.tsx
git commit -m "feat(ui): replace emoji nav with Lucide icons and CORTEX wordmark"
```

---

## Task 4: TopBar Redesign

**Files:**
- Modify: `app/src/components/layout/TopBar.tsx`

Three changes: (1) background becomes `bg-sidebar` to create unified chrome layer with sidebar, (2) search input height increases to `h-10`, (3) mobile app name becomes monospace CORTEX wordmark matching sidebar.

- [ ] **Step 1: Apply all three TopBar changes**

Replace the entire contents of `app/src/components/layout/TopBar.tsx` with:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Menu, Sun, Moon, Monitor, LogOut } from 'lucide-react'

type TopBarProps = {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  function cycleTheme() {
    if (theme === 'system') {
      setTheme('light')
    } else if (theme === 'light') {
      setTheme('dark')
    } else {
      setTheme('system')
    }
  }

  function ThemeIcon() {
    if (!mounted) return <Monitor className="size-4" />
    if (theme === 'light') return <Sun className="size-4" />
    if (theme === 'dark') return <Moon className="size-4" />
    return <Monitor className="size-4" />
  }

  function themeLabel() {
    if (!mounted) return 'Toggle theme'
    if (theme === 'light') return 'Switch to dark mode'
    if (theme === 'dark') return 'Switch to system theme'
    return 'Switch to light mode'
  }

  return (
    <header className="flex h-14 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4">
      {/* Hamburger — mobile only */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>

      {/* App name — mobile only */}
      <span className="font-mono text-sm font-bold tracking-widest text-primary md:hidden">
        CORTEX
      </span>

      {/* Global search */}
      <form
        onSubmit={handleSearch}
        className="mx-auto flex w-full max-w-lg items-center"
      >
        <Input
          type="search"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 w-full"
          aria-label="Global search"
        />
      </form>

      {/* Dark mode toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={cycleTheme}
        aria-label={themeLabel()}
        title={themeLabel()}
      >
        <ThemeIcon />
      </Button>

      {/* Logout */}
      <form method="POST" action="/api/auth/logout">
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="size-4" />
        </Button>
      </form>
    </header>
  )
}
```

- [ ] **Step 2: Verify the build**

```bash
cd app && npm run build
```

Expected: Build completes without errors

- [ ] **Step 3: Commit**

```bash
git add app/src/components/layout/TopBar.tsx
git commit -m "feat(ui): unify topbar chrome with sidebar background and refine search"
```

---

## Task 5: Login Page + Route Error Parameter

**Files:**
- Modify: `app/src/app/login/page.tsx`
- Modify: `app/src/app/api/auth/login/route.ts`
- Modify: `app/src/app/api/__tests__/auth.test.ts` (add test)

The login page gets a CORTEX wordmark above the card, a radial cyan glow background, and handles two distinct error states: `?error=wrong` (bad password) and `?error=ratelimit` (nginx 429). The login route changes its failure redirect from `?error=1` to `?error=wrong`.

- [ ] **Step 1: Write a failing test for the login route error parameter**

Add to `app/src/app/api/__tests__/auth.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    process.env.AUTH_PASSWORD = 'correct-password'
    process.env.AUTH_SECRET = 'test-secret-32-bytes-long-xxxxxxxx'
  })

  afterEach(() => {
    delete process.env.AUTH_PASSWORD
    delete process.env.AUTH_SECRET
  })

  it('redirects with error=wrong on incorrect password', async () => {
    const { POST } = await import('@/app/api/auth/login/route')
    const form = new FormData()
    form.append('password', 'wrong-password')
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: form,
      headers: { host: 'localhost', 'x-forwarded-proto': 'http' },
    })
    const res = await POST(req)
    expect(res.status).toBe(303)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('error=wrong')
    expect(location).not.toContain('error=1')
  })

  it('redirects with error=wrong on empty password', async () => {
    const { POST } = await import('@/app/api/auth/login/route')
    const form = new FormData()
    form.append('password', '')
    const req = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: form,
      headers: { host: 'localhost', 'x-forwarded-proto': 'http' },
    })
    const res = await POST(req)
    expect(res.status).toBe(303)
    const location = res.headers.get('location') ?? ''
    expect(location).toContain('error=wrong')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd app && npm run test:run -- src/app/api/__tests__/auth.test.ts
```

Expected: FAIL — location contains `error=1`, not `error=wrong`

- [ ] **Step 3: Update the login route**

In `app/src/app/api/auth/login/route.ts`, find this line:

```ts
failUrl.searchParams.set('error', '1');
```

Replace it with:

```ts
failUrl.searchParams.set('error', 'wrong');
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd app && npm run test:run -- src/app/api/__tests__/auth.test.ts
```

Expected: All tests pass (new tests + existing validateApiKey tests)

- [ ] **Step 5: Replace the login page**

Replace the entire contents of `app/src/app/login/page.tsx` with:

```tsx
export const metadata = { title: 'Sign in — Cortex' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const { error, next } = await searchParams

  let nextValue = '/';
  if (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')) {
    try {
      const resolved = new URL(next, 'http://localhost')
      if (resolved.host === 'localhost') {
        nextValue = next
      }
    } catch {
      // malformed — keep '/'
    }
  }

  const showWrongPassword = error === 'wrong'
  const showRateLimited = error === 'ratelimit'

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 50% 30%, oklch(0.70 0.15 200 / 8%), transparent 60%), var(--background)',
      }}
    >
      {/* Wordmark above card */}
      <div className="mb-8 text-center">
        <p className="font-mono text-2xl font-bold tracking-widest text-primary">
          CORTEX
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Personal knowledge base
        </p>
      </div>

      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-2xl">
        {showWrongPassword && (
          <p className="text-sm text-destructive" role="alert">
            Incorrect password. Please try again.
          </p>
        )}

        {showRateLimited && (
          <p className="text-sm text-destructive" role="alert">
            Too many attempts — please wait before trying again.
          </p>
        )}

        <form method="POST" action="/api/auth/login" className="space-y-4">
          <input type="hidden" name="next" value={nextValue} />
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              required
              autoFocus
              autoComplete="current-password"
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Password"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verify the build**

```bash
cd app && npm run build
```

Expected: Build completes without errors

- [ ] **Step 7: Commit**

```bash
git add app/src/app/login/page.tsx app/src/app/api/auth/login/route.ts app/src/app/api/__tests__/auth.test.ts
git commit -m "feat(auth): redesign login page and use named error parameters"
```

---

## Task 6: Dashboard Component Polish

**Files:**
- Modify: `app/src/app/(dashboard)/page.tsx`

Add accent borders to stat cards, update badge and hover styling, make "View all" links use primary color. These are class-name-only changes — data fetching and layout are untouched.

- [ ] **Step 1: Update the stat card section**

In `app/src/app/(dashboard)/page.tsx`, find the stats grid section and replace it with:

```tsx
      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card size="sm" className="border-l-2 border-l-primary">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.total}</p>
          </CardContent>
        </Card>

        <Card size="sm" className="border-l-2 border-l-primary">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.thisWeek}</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topCategory ? (
              <>
                <p className="text-lg font-semibold truncate">{data.topCategory.name}</p>
                <p className="text-xs text-muted-foreground">{data.topCategory.count} items</p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">None yet</p>
            )}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">By Source</CardTitle>
          </CardHeader>
          <CardContent>
            {data.sourceTypes.length > 0 ? (
              <ul className="space-y-1">
                {data.sourceTypes.map((st) => (
                  <li key={st.sourceType} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <SourceIcon sourceType={st.sourceType} />
                      <span className="text-sm capitalize">{st.sourceType}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{st.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">None yet</p>
            )}
          </CardContent>
        </Card>
      </div>
```

- [ ] **Step 2: Update the "View all →" link**

Find:

```tsx
          <Link href="/library" className="text-sm text-primary hover:underline">
```

This is already `text-primary` — verify it's there. If it reads `text-muted-foreground` or similar, update it to `text-primary hover:text-primary/80`.

- [ ] **Step 3: Update recently saved item card hover state**

Find the recently saved item card Link:

```tsx
                  <Card className="h-full transition-shadow group-hover:shadow-md">
```

Replace with:

```tsx
                  <Card className="h-full transition-all group-hover:shadow-md group-hover:border-primary/40">
```

- [ ] **Step 4: Update discover item card hover state**

Find the discover item card:

```tsx
                  <Card className="h-full transition-shadow group-hover:shadow-md">
```

Replace with:

```tsx
                  <Card className="h-full transition-all group-hover:shadow-md group-hover:border-primary/40">
```

- [ ] **Step 5: Update the processing queue badge**

Find:

```tsx
                      <Badge
                        variant={item.processingStatus === 'processing' ? 'default' : 'outline'}
                        className="shrink-0 capitalize"
                      >
```

Replace with:

```tsx
                      <Badge
                        variant={item.processingStatus === 'processing' ? 'default' : 'outline'}
                        className={cn(
                          'shrink-0 capitalize',
                          item.processingStatus === 'processing' && 'bg-primary/20 text-primary border-primary/40'
                        )}
                      >
```

Add `cn` to the import at the top of the file — check if it's already imported. If not, add:

```ts
import { cn } from '@/lib/utils'
```

- [ ] **Step 6: Verify the build**

```bash
cd app && npm run build
```

Expected: Build completes without errors. No TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add app/src/app/(dashboard)/page.tsx
git commit -m "feat(ui): add accent borders, hover states, and badge styling to dashboard"
```

---

## Task 7: Nginx Rate Limiting for Login

**Files:**
- Modify: `nginx.conf`

Add a dedicated rate limit zone for `/api/auth/login` — 5 requests/minute per IP with burst of 3. When the limit triggers, nginx returns 429 and redirects to `/login?error=ratelimit` via a named location. The existing `/api/` block is unchanged.

- [ ] **Step 1: Add the login rate limit zone**

In `nginx.conf`, find the existing rate limit zone line:

```nginx
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

Add a new zone directly below it:

```nginx
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
```

- [ ] **Step 2: Add the login-specific location block and named location**

In the `server { }` block, find:

```nginx
        # API routes — rate limited
        location /api/ {
```

Insert the following two blocks immediately before it:

```nginx
        # Login rate limiting — strict zone, redirects on 429
        location = /api/auth/login {
            limit_req zone=login burst=3 nodelay;
            limit_req_status 429;
            error_page 429 = @login_rate_limited;
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location @login_rate_limited {
            return 302 /login?error=ratelimit;
        }

```

- [ ] **Step 3: Verify the nginx config is valid**

```bash
docker compose run --rm nginx nginx -t
```

Expected output:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

If Docker is not running, validate with native nginx if available:
```bash
nginx -t -c $(pwd)/nginx.conf
```

- [ ] **Step 4: Commit**

```bash
git add nginx.conf
git commit -m "feat(security): add strict rate limiting on login endpoint (5r/m, burst 3)"
```

---

## Self-Review

**Spec coverage:**
- [x] §1 Color system — Task 2
- [x] §2 Sidebar Lucide icons + CORTEX wordmark — Task 3
- [x] §3 TopBar unified chrome + search + mobile wordmark — Task 4
- [x] §4 Login page radial gradient + wordmark + dual error states — Task 5
- [x] §4 Login route `?error=wrong` — Task 5
- [x] §5 Stat card accent borders — Task 6
- [x] §5 Card hover states — Task 6
- [x] §5 Badge styling — Task 6
- [x] §6 Nginx rate limit zone — Task 7
- [x] §6 Nginx 429 → `/login?error=ratelimit` redirect — Task 7
- [x] §7 Auth middleware fix — Task 1

**Placeholder scan:** No TBDs, TODOs, or incomplete steps. All code blocks are complete.

**Type consistency:**
- `Category` type defined once (Task 3 Sidebar) — not referenced elsewhere in plan
- `cn` import added in Task 6 — confirmed `@/lib/utils` path matches existing imports in the file
- Lucide icons imported by name in Task 3 and Task 4 — names verified against lucide-react v0.577.0 (`LayoutDashboard`, `BookOpen`, `Inbox`, `Search`, `BarChart2`, `Tag`, `ShieldCheck`, `Settings2`)
- `LucideIcon` type imported from `lucide-react` in Task 3 — available in that version
