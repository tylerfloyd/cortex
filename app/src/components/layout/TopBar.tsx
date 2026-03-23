'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Menu, Sun, Moon, Monitor } from 'lucide-react'

type TopBarProps = {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch for theme icon
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
    <header className="flex h-14 items-center gap-3 border-b border-border bg-background px-4">
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

      {/* App name — mobile only (sidebar is hidden) */}
      <span className="text-base font-bold tracking-tight md:hidden">
        Cortex
      </span>

      {/* Global search */}
      <form
        onSubmit={handleSearch}
        className="mx-auto flex w-full max-w-md items-center"
      >
        <Input
          type="search"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full"
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
    </header>
  )
}
