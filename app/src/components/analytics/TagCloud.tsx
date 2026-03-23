'use client'

type TagData = {
  name: string
  slug: string
  count: number | null
}

type Props = {
  tags: TagData[]
}

export function TagCloud({ tags }: Props) {
  if (tags.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
        No tags yet
      </div>
    )
  }

  const counts = tags.map((t) => t.count ?? 0)
  const max = Math.max(...counts, 1)
  const min = Math.min(...counts)
  const range = max - min || 1

  return (
    <div className="flex flex-wrap gap-2 p-2">
      {tags.map((tag) => {
        const count = tag.count ?? 0
        // Normalize to 0–1, then map to font size 0.75–2rem
        const normalized = (count - min) / range
        const fontSize = 0.75 + normalized * 1.25
        // Opacity between 0.5 and 1
        const opacity = 0.5 + normalized * 0.5

        return (
          <span
            key={tag.slug}
            style={{ fontSize: `${fontSize}rem`, opacity }}
            className="text-foreground leading-tight cursor-default select-none transition-opacity hover:opacity-100"
            title={`${tag.name}: ${count} ${count === 1 ? 'item' : 'items'}`}
          >
            {tag.name}
          </span>
        )
      })}
    </div>
  )
}
