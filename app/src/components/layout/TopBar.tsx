'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Menu, Sun, Moon, Monitor } from 'lucide-react'

type TopBarProps = {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
    <header className="flex h-12 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4">
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

      {/* Wordmark */}
      <span className="font-semibold tracking-widest text-sm uppercase text-primary">
        CORTEX
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme toggle */}
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
