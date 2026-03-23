import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { categories, items } from '@/lib/db/schema'
import { DashboardShell } from '@/components/layout/DashboardShell'

async function getCategories() {
  try {
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        itemCount: sql<number>`count(${items.id})::int`,
      })
      .from(categories)
      .leftJoin(items, eq(items.categoryId, categories.id))
      .groupBy(categories.id, categories.name, categories.slug)
      .orderBy(categories.name)

    return rows
  } catch {
    // If DB is unavailable (e.g. during build), return empty list
    return []
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const categoriesList = await getCategories()

  return (
    <DashboardShell categories={categoriesList}>
      {children}
    </DashboardShell>
  )
}
