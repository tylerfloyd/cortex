import { cn } from '@/lib/utils'

type SourceType = 'article' | 'youtube' | 'reddit' | 'twitter' | 'pdf' | 'newsletter' | string

export const SOURCE_ICONS: Record<string, string> = {
  article: '📄',
  youtube: '🎥',
  reddit: '🤖',
  twitter: '🐦',
  pdf: '📋',
  newsletter: '📧',
}

export const SOURCE_LABELS: Record<string, string> = {
  article: 'Article',
  youtube: 'YouTube',
  reddit: 'Reddit',
  twitter: 'Twitter',
  pdf: 'PDF',
  newsletter: 'Newsletter',
}

type SourceIconProps = {
  sourceType: SourceType
  className?: string
  showLabel?: boolean
}

export function SourceIcon({ sourceType, className, showLabel = false }: SourceIconProps) {
  const icon = SOURCE_ICONS[sourceType] ?? '🔗'
  const label = SOURCE_LABELS[sourceType] ?? sourceType

  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      title={label}
      aria-label={label}
    >
      <span role="img" aria-hidden="true">{icon}</span>
      {showLabel && <span className="text-xs text-muted-foreground">{label}</span>}
    </span>
  )
}
