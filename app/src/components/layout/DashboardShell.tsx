'use client'

import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

type Category = {
  id: string
  name: string
  slug: string
  itemCount: number
}

type DashboardShellProps = {
  categories: Category[]
  children: React.ReactNode
}

export function DashboardShell({ categories, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-full flex-col">
      <TopBar onMenuClick={() => setSidebarOpen((open) => !open)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          categories={categories}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
