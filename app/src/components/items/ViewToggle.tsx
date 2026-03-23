'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function ViewToggle({ currentView }: { currentView: 'grid' | 'list' }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setView = (view: 'grid' | 'list') => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', view)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1" aria-label="View mode">
      <Button
        variant={currentView === 'grid' ? 'default' : 'outline'}
        size="icon-sm"
        onClick={() => setView('grid')}
        aria-label="Grid view"
        title="Grid view"
      >
        {/* 2x2 grid icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <rect x="1" y="1" width="6" height="6" rx="1" />
          <rect x="9" y="1" width="6" height="6" rx="1" />
          <rect x="1" y="9" width="6" height="6" rx="1" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
      </Button>
      <Button
        variant={currentView === 'list' ? 'default' : 'outline'}
        size="icon-sm"
        onClick={() => setView('list')}
        aria-label="List view"
        title="List view"
      >
        {/* lines icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
        >
          <rect x="1" y="2" width="14" height="2" rx="1" />
          <rect x="1" y="7" width="14" height="2" rx="1" />
          <rect x="1" y="12" width="14" height="2" rx="1" />
        </svg>
      </Button>
    </div>
  )
}
