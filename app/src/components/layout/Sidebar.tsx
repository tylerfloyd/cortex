'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

const navLinks = [
  { href: '/', label: 'Dashboard', emoji: '🏠' },
  { href: '/library', label: 'Library', emoji: '📚' },
  { href: '/inbox', label: 'Inbox', emoji: '📥' },
  { href: '/search', label: 'Search', emoji: '🔍' },
  { href: '/analytics', label: 'Analytics', emoji: '📊' },
  { href: '/taxonomy', label: 'Taxonomy', emoji: '🏷️' },
  { href: '/hygiene', label: 'Data Hygiene', emoji: '🧹' },
  { href: '/settings', label: 'Settings', emoji: '⚙️' },
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
          'fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-border bg-sidebar transition-transform duration-200',
          'md:static md:translate-x-0 md:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo / App name */}
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
            Cortex
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-0.5 px-2 py-3">
          {navLinks.map(({ href, label, emoji }) => {
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
                <span aria-hidden="true">{emoji}</span>
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
