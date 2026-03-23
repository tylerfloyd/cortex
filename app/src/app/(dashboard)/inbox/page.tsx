import { db } from '@/lib/db'
import { categories } from '@/lib/db/schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InboxClient } from './InboxClient'
import { getActiveQueueItems } from './actions'

async function getCategories() {
  try {
    return await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .orderBy(categories.name)
  } catch {
    return []
  }
}

export default async function InboxPage() {
  const [categoriesList, queueItems] = await Promise.all([
    getCategories(),
    getActiveQueueItems(),
  ])

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
        <p className="mt-1 text-muted-foreground">
          Add URLs to your knowledge base for processing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Content</CardTitle>
        </CardHeader>
        <CardContent>
          <InboxClient categories={categoriesList} initialQueueItems={queueItems} />
        </CardContent>
      </Card>
    </div>
  )
}
