import { getCategories, getTags, getChannelMappings } from './actions'
import { CategoryManager } from './CategoryManager'
import { TagManager } from './TagManager'

export default async function TaxonomyPage() {
  const [categoriesList, tagsList, channelMappingsList] = await Promise.all([
    getCategories(),
    getTags(),
    getChannelMappings(),
  ])

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Taxonomy</h1>
        <p className="mt-1 text-muted-foreground">
          Manage categories, tags, and how content is organized.
        </p>
      </div>

      <CategoryManager
        initialCategories={categoriesList}
        initialChannelMappings={channelMappingsList}
      />

      <hr className="border-border" />

      <TagManager initialTags={tagsList} />
    </div>
  )
}
