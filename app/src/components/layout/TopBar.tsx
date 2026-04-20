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
