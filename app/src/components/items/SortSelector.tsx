'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

export function SortSelector({ currentSort }: { currentSort: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', e.target.value)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <select
      value={currentSort}
      onChange={handleChange}
      aria-label="Sort order"
      className="text-sm border border-input rounded-md px-2 py-1 bg-background"
    >
      <option value="newest">Newest first</option>
      <option value="oldest">Oldest first</option>
      <option value="alphabetical">A–Z</option>
    </select>
  )
}
