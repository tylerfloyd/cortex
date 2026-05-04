'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  Inbox,
  Search,
  Settings2,
  BarChart2,
  Tag,
  ShieldCheck,
  MoreHorizontal,
  LogOut,
  Newspaper,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type SidebarProps = {
  isOpen: boolean
  onClose: () => void
}

const PRIMARY_NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/library', label: 'Library', icon: BookOpen },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/recap', label: 'Recap', icon: Newspaper },
  { href: '/settings', label: 'Settings', icon: Settings2 },
]

const SECONDARY_NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/taxonomy', label: 'Taxonomy', icon: Tag },
  { href: '/hygiene', label: 'Data Hygiene', icon: ShieldCheck },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  function isActive(href: string): boolean {
    if (href === '/library') return pathname.startsWith('/library')
    return pathname === href || pathname.startsWith(href + '/')
  }

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
          'fixed inset-y-0 left-0 z-30 flex w-56 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200',
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
        <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3">
          {PRIMARY_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive(href)
                  ? 'bg-accent text-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </Link>
          ))}

          {/* More toggle */}
          <button
            onClick={() => setShowMore(m => !m)}
            className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground w-full rounded-md transition-colors"
          >
            <MoreHorizontal size={16} />
            <span>More</span>
          </button>

          {showMore && SECONDARY_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive(href)
                  ? 'bg-accent text-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout at bottom of sidebar */}
        <div className="mt-auto pt-4 border-t border-sidebar-border">
          <form method="POST" action="/api/auth/logout">
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2 w-full text-sm text-muted-foreground hover:text-foreground rounded-md transition-colors"
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
