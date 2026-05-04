'use client'

import { useState, useEffect, useTransition } from 'react'
import { PlayIcon, PlusIcon, Trash2Icon, ToggleLeftIcon, ToggleRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ResearchSource = {
  id: string
  type: string
  name: string
  config: Record<string, unknown>
  topics: string[]
  enabled: boolean
  lastFetchedAt: string | null
  createdAt: string
}

const API_KEY = process.env.NEXT_PUBLIC_API_KEY ?? ''

function apiHeaders(extra?: Record<string, string>) {
  return { 'Content-Type': 'application/json', ...(API_KEY ? { 'x-api-key': API_KEY } : {}), ...extra }
}

export function ResearchAgentSection() {
  const [sources, setSources] = useState<ResearchSource[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null)
  const [isPending, startTransition] = useTransition()

  // Add-source form state
  const [subreddit, setSubreddit] = useState('')
  const [channelId, setChannelId] = useState('')

  // Global topics (merged across all sources — editing updates all sources)
  const [topicsInput, setTopicsInput] = useState('')
  const [topicsEdited, setTopicsEdited] = useState(false)

  function flash(text: string, error = false) {
    setMsg({ text, error })
    setTimeout(() => setMsg(null), 5000)
  }

  async function loadSources() {
    try {
      const res = await fetch('/api/research/sources', { headers: API_KEY ? { 'x-api-key': API_KEY } : {} })
      if (!res.ok) return
      const data = await res.json() as ResearchSource[]
      setSources(data)
      // Merge topics from all sources into a single deduplicated list
      const all = Array.from(new Set(data.flatMap(s => s.topics)))
      setTopicsInput(all.join(', '))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadSources() }, [])

  async function handleSaveTopics() {
    const topics = topicsInput.split(',').map(t => t.trim()).filter(Boolean)
    startTransition(async () => {
      try {
        await Promise.all(sources.map(src =>
          fetch(`/api/research/sources/${src.id}`, {
            method: 'PATCH',
            headers: apiHeaders(),
            body: JSON.stringify({ topics }),
          })
        ))
        setTopicsEdited(false)
        flash('Topics saved.')
        await loadSources()
      } catch {
        flash('Failed to save topics.', true)
      }
    })
  }

  async function handleToggle(src: ResearchSource) {
    const res = await fetch(`/api/research/sources/${src.id}`, {
      method: 'PATCH',
      headers: apiHeaders(),
      body: JSON.stringify({ enabled: !src.enabled }),
    })
    if (res.ok) {
      setSources(s => s.map(x => x.id === src.id ? { ...x, enabled: !x.enabled } : x))
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/research/sources/${id}`, {
      method: 'DELETE',
      headers: API_KEY ? { 'x-api-key': API_KEY } : {},
    })
    if (res.ok) {
      setSources(s => s.filter(x => x.id !== id))
      flash('Source removed.')
    }
  }

  async function handleAddReddit() {
    if (!subreddit.trim()) return
    const topics = topicsInput.split(',').map(t => t.trim()).filter(Boolean)
    const res = await fetch('/api/research/sources', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ type: 'reddit', name: `r/${subreddit}`, config: { subreddit }, topics }),
    })
    if (res.ok) {
      setSubreddit('')
      flash('Reddit source added.')
      await loadSources()
    } else {
      flash('Failed to add subreddit.', true)
    }
  }

  async function handleAddYouTube() {
    if (!channelId.trim()) return
    const topics = topicsInput.split(',').map(t => t.trim()).filter(Boolean)
    const res = await fetch('/api/research/sources', {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ type: 'youtube', name: channelId, config: { channelId }, topics }),
    })
    if (res.ok) {
      setChannelId('')
      flash('YouTube source added.')
      await loadSources()
    } else {
      flash('Failed to add YouTube channel.', true)
    }
  }

  async function handleRunNow() {
    startTransition(async () => {
      const res = await fetch('/api/research/run', {
        method: 'POST',
        headers: API_KEY ? { 'x-api-key': API_KEY } : {},
      })
      const json = await res.json() as { jobId?: string; message?: string; error?: string }
      if (res.ok) {
        flash(`Run queued (job ${json.jobId ?? 'unknown'}).`)
      } else {
        flash(json.error ?? 'Failed to queue run.', true)
      }
    })
  }

  return (
    <div className="space-y-5">
      {msg && (
        <p className={`text-sm ${msg.error ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>
          {msg.text}
        </p>
      )}

      {/* Topics */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Research Topics</label>
        <p className="text-xs text-muted-foreground">
          Comma-separated topics used by the AI relevance filter (e.g. AI, TypeScript, market news).
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="AI, LLMs, TypeScript, security..."
            value={topicsInput}
            onChange={e => { setTopicsInput(e.target.value); setTopicsEdited(true) }}
          />
          <Button size="sm" disabled={!topicsEdited || isPending} onClick={handleSaveTopics}>
            Save
          </Button>
        </div>
      </div>

      {/* Sources table */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium">Sources</p>
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading…</p>
        ) : (
          <div className="rounded-lg border divide-y text-sm">
            {/* Static HN row */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              <ToggleRightIcon className="size-4 text-primary shrink-0" />
              <span className="flex-1">Hacker News</span>
              <span className="text-xs text-muted-foreground">Always enabled</span>
            </div>

            {/* Dynamic sources */}
            {sources.map(src => (
              <div key={src.id} className="flex items-center gap-3 px-3 py-2.5">
                <button
                  onClick={() => handleToggle(src)}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label={src.enabled ? 'Disable' : 'Enable'}
                >
                  {src.enabled
                    ? <ToggleRightIcon className="size-4 text-primary" />
                    : <ToggleLeftIcon className="size-4" />}
                </button>
                <span className="flex-1 truncate">{src.name}</span>
                <span className="text-xs text-muted-foreground shrink-0 capitalize">{src.type}</span>
                <button
                  onClick={() => handleDelete(src.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Remove source"
                >
                  <Trash2Icon className="size-3.5" />
                </button>
              </div>
            ))}

            {sources.length === 0 && (
              <div className="px-3 py-2.5 text-xs text-muted-foreground">
                No sources configured yet.
              </div>
            )}

            {/* Static Twitter row */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              <ToggleLeftIcon className="size-4 text-muted-foreground shrink-0" />
              <span className="flex-1">Twitter / X</span>
              <span className="text-xs text-muted-foreground">
                Set <code className="font-mono">TWITTER_USER_ACCESS_TOKEN</code> + <code className="font-mono">TWITTER_USER_ID</code> in .env to enable
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Add Reddit */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium">Add Subreddit</p>
        <div className="flex gap-2">
          <span className="flex items-center text-sm text-muted-foreground">r/</span>
          <input
            type="text"
            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="MachineLearning"
            value={subreddit}
            onChange={e => setSubreddit(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddReddit()}
          />
          <Button size="sm" variant="outline" onClick={handleAddReddit} disabled={!subreddit.trim()}>
            <PlusIcon className="size-3.5 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Add YouTube */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium">Add YouTube Channel</p>
        <p className="text-xs text-muted-foreground">
          Enter the channel ID (e.g. <code className="font-mono">UCXvT7auo7xUd7v0B2pmvwIA</code>).
          Find it in the channel URL after <code className="font-mono">/channel/</code>.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="UCXvT7auo7xUd7v0B2pmvwIA"
            value={channelId}
            onChange={e => setChannelId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddYouTube()}
          />
          <Button size="sm" variant="outline" onClick={handleAddYouTube} disabled={!channelId.trim()}>
            <PlusIcon className="size-3.5 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Run Now */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <p className="text-sm font-medium">Run Now</p>
          <p className="text-xs text-muted-foreground">Trigger an immediate research agent run.</p>
        </div>
        <Button size="sm" onClick={handleRunNow} disabled={isPending}>
          <PlayIcon className="size-3.5 mr-1" />
          Run Now
        </Button>
      </div>
    </div>
  )
}
