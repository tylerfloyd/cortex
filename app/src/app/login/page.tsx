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
