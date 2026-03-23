'use client'

import { useRouter } from 'next/navigation'

type LibraryListRowProps = {
  href: string
  children: React.ReactNode
}

export function LibraryListRow({ href, children }: LibraryListRowProps) {
  const router = useRouter()
  return (
    <tr
      className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => router.push(href)}
    >
      {children}
    </tr>
  )
}
