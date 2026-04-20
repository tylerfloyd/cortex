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
      // Resolve against a dummy base and verify no host was extracted
      const resolved = new URL(next, 'http://localhost');
      if (resolved.host === 'localhost') {
        nextValue = next;
      }
    } catch {
      // malformed — keep '/'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Cortex</h1>
          <p className="text-sm text-muted-foreground">
            Enter your password to continue
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            Incorrect password. Please try again.
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
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Password"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  )
}
