export function relativeTime(date: Date | string | null): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  if (diffSecs < 60) return 'just now'
  const diffMins = Math.floor(diffSecs / 60)
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`
  const diffYears = Math.floor(diffMonths / 12)
  return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`
}

export function truncateUrl(url: string, maxLen = 60): string {
  try {
    const u = new URL(url)
    const display = u.hostname + u.pathname
    return display.length > maxLen ? display.slice(0, maxLen) + '…' : display
  } catch {
    return url.length > maxLen ? url.slice(0, maxLen) + '…' : url
  }
}
