# Authentication Design — Cortex Dashboard

**Date:** 2026-04-19
**Status:** Approved

## Problem

Cortex is now publicly accessible on a VPS. The dashboard UI has no authentication — anyone who knows the IP can read and modify the knowledge base. API routes are already protected by API key auth (`x-api-key` header), but page routes are open.

## Goal

Protect all dashboard UI routes behind a single-user password login with a 30-day session. External integrations (MCP server, browser extension, Discord bot) must continue working without changes.

## Approach

Next.js middleware + HMAC-signed session cookie. No external auth dependencies, no database session store.

## Prerequisites

The current nginx config only serves HTTP (port 80). The `Secure` cookie flag must NOT be set until HTTPS is configured. Sessions are transmitted over plain HTTP in the current deployment — acceptable for a self-hosted personal tool, and can be upgraded later by adding TLS to nginx.

## Environment Variables

Two new variables added to `.env`, `.env.example`, and the `app` service `environment:` block in `docker-compose.prod.yml`:

- `AUTH_PASSWORD` — the login password (plaintext, compared server-side only with `timingSafeEqual`)
- `AUTH_SECRET` — a random 32-byte hex string used to sign session cookies

`AUTH_SECRET` confidentiality is the entire security boundary for session integrity. If it is compromised, all session cookies must be considered invalid — rotate it to force re-login.

If either variable is absent at startup, the login handler returns 500 with a clear error message. `verifySession` returns `false` (denies access) if `AUTH_SECRET` is unset, preventing silent bypass.

## Session Cookie

| Property | Value |
|----------|-------|
| Name | `cortex-session` |
| Value | `${expires_unix_ms}:${HMAC-SHA256(AUTH_SECRET, expires_unix_ms)}` |
| Expiry | 30 days |
| Flags | `HttpOnly`, `SameSite=Strict` — **no `Secure` flag** until HTTPS is configured |

The cookie encodes its own expiry timestamp, signed with `AUTH_SECRET`. Verification requires no server-side state — middleware recomputes the HMAC and checks the timestamp.

**The HMAC comparison in `verifySession` must use `timingSafeEqual`** (same pattern as `api-key.ts`) to prevent timing oracle attacks on `AUTH_SECRET` across every middleware invocation.

## Route Protection

The middleware exports a `config.matcher` to skip static assets entirely, avoiding unnecessary HMAC computation on every `/_next/static/**` request.

Matcher covers: all routes except `/_next/**`, `/favicon.ico`, `/login`, `/api/auth/**`.

| Pattern | Protected | Auth method |
|---------|-----------|-------------|
| `/(dashboard)/**` | Yes | Session cookie (middleware) |
| Server Actions on `/(dashboard)/**` | Yes | Same middleware — Next.js middleware fires on Server Action POSTs |
| `/login` | No | — |
| `/api/auth/**` | No | — |
| `/api/**` | No (existing `x-api-key`) | API key header |
| `/_next/**`, `/favicon.ico` | No | — |

Note: the middleware matcher must list `/login` and `/api/auth/:path*` exclusions before any catch-all, to avoid accidentally protecting the login endpoint and creating an unbreakable redirect loop.

## `next` Redirect Parameter Validation

On failed auth, middleware redirects to `/login?next=<original-url>`. After successful login, the handler redirects to the `next` param.

Validation rule: `next` must start with `/` and must NOT start with `//` (which browsers treat as a protocol-relative URL and redirect to an external host). Implementation: check `next.startsWith('/') && !next.startsWith('//')`.

## New Files

### `src/lib/auth/session.ts`
Shared helpers:
- `createSession(): string` — generates `${expires}:${hmac}` cookie value; throws if `AUTH_SECRET` is unset
- `verifySession(value: string): boolean` — validates HMAC with `timingSafeEqual`, checks expiry; returns `false` if `AUTH_SECRET` is unset

### `src/lib/auth/session.test.ts`
Unit tests for `createSession` and `verifySession`:
- Valid session verifies correctly
- Expired session returns false
- Tampered HMAC returns false
- Missing `AUTH_SECRET` returns false (no throw)

### `src/middleware.ts`
- Exports `config.matcher` to exclude `/_next/**`, `/favicon.ico`, `/login`, `/api/auth/:path*`
- Reads `cortex-session` cookie and calls `verifySession()`
- Valid session → passes through
- Invalid/missing → redirects to `/login?next=<original-url>`

### `src/app/login/page.tsx`
- Simple form: single password field + submit button
- Native `<form method="POST" action="/api/auth/login">` — no JavaScript required, redirect handled by browser following the 303 response
- `<input type="hidden" name="next" value={searchParams.next} />`
- Styled to match existing app (dark/light theme aware, same font/radius as dashboard)
- Shows error message on wrong password (via `?error=1` query param set by the login handler on failure)

### `src/app/api/auth/login/route.ts`
- `POST` handler
- Reads `password` and `next` from form body (`request.formData()`)
- Compares to `AUTH_PASSWORD` using `timingSafeEqual`
- Returns 500 if `AUTH_PASSWORD` or `AUTH_SECRET` is unset
- On success: sets `cortex-session` cookie, returns 303 redirect to validated `next` or `/`
- On failure: returns 303 redirect to `/login?error=1&next=<next>`

### `src/app/api/auth/logout/route.ts`
- `POST` handler
- Triggered by a native `<form method="POST" action="/api/auth/logout">` in `DashboardShell`
- Clears `cortex-session` cookie (sets it with `maxAge=0`)
- Returns 303 redirect to `/login`
- No JavaScript required; browser follows redirect automatically

## Logout UI

A logout button (rendered as a `<form>` with a submit button) added to the existing `DashboardShell` header. Native form POST — no `fetch`, no `router.push` needed.

## Changes to Existing Files

- `.env` — add `AUTH_PASSWORD` and `AUTH_SECRET`
- `.env.example` — add `AUTH_PASSWORD=` and `AUTH_SECRET=` with comments
- `docker-compose.prod.yml` — add `AUTH_PASSWORD` and `AUTH_SECRET` to the `app` service `environment:` block
- `src/app/(dashboard)/layout.tsx` — no changes (middleware handles protection)
- `DashboardShell` — add logout form to header

## What Does Not Change

- `src/lib/auth/api-key.ts` — unchanged
- All `/api/**` route handlers — unchanged
- MCP server, browser extension, Discord bot — unaffected
