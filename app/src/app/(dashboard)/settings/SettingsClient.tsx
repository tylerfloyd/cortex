'use client'

import { useState, useTransition } from 'react'
import { DownloadIcon, UploadIcon, AlertTriangleIcon, RefreshCwIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateModelSettings, updateApiKeys } from './actions'
import type { AppConfig } from '@/lib/config'

const AVAILABLE_MODELS = [
  'anthropic/claude-sonnet-4-5',
  'anthropic/claude-haiku-4-5',
  'anthropic/claude-opus-4-5',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'openai/text-embedding-3-small',
  'openai/text-embedding-3-large',
  'meta-llama/llama-3.1-8b-instruct',
  'meta-llama/llama-3.3-70b-instruct',
  'google/gemini-flash-1.5',
  'google/gemini-pro-1.5',
]

const EMBED_MODELS = [
  'openai/text-embedding-3-small',
  'openai/text-embedding-3-large',
  'openai/text-embedding-ada-002',
]

const CHAT_MODELS = AVAILABLE_MODELS.filter(
  (m) => !m.includes('embedding')
)

type ApiKeysConfigured = {
  openrouter: boolean
  jina: boolean
  discord: boolean
}

type Props = {
  initialModels: AppConfig['models']
  apiKeysConfigured: ApiKeysConfigured
  discordConfigured: boolean
}

export function SettingsClient({ initialModels, apiKeysConfigured, discordConfigured }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [models, setModels] = useState(initialModels)

  // API keys (masked inputs — empty means unchanged)
  const [apiKeys, setApiKeys] = useState({
    openrouter: '',
    jina: '',
    discord: '',
  })
  // Track which key inputs the user has typed in (touched)
  const [apiKeysTouched, setApiKeysTouched] = useState({
    openrouter: false,
    jina: false,
    discord: false,
  })

  // Import file
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<string | null>(null)

  // Danger zone confirm states
  const [clearConfirm, setClearConfirm] = useState(false)
  const [reprocessConfirm, setReprocessConfirm] = useState(false)
  const [rebuildEmbedConfirm, setRebuildEmbedConfirm] = useState(false)

  function showMsg(msg: string, isError = false) {
    if (isError) {
      setError(msg)
      setSuccess(null)
    } else {
      setSuccess(msg)
      setError(null)
    }
    setTimeout(() => {
      setError(null)
      setSuccess(null)
    }, 6000)
  }

  function handleModelChange(key: keyof AppConfig['models'], value: string) {
    setModels((m) => ({ ...m, [key]: value }))
  }

  function handleSaveModels() {
    const fd = new FormData()
    fd.append('summarize', models.summarize)
    fd.append('categorize', models.categorize)
    fd.append('embed', models.embed)
    fd.append('chat', models.chat)

    startTransition(async () => {
      const result = await updateModelSettings(fd)
      if (result.error) {
        showMsg(result.error, true)
      } else {
        showMsg('Model settings saved.')
      }
    })
  }

  function handleSaveApiKeys() {
    // Only include keys the user has typed into
    const payload: { openrouter?: string | null; jina?: string | null; discord?: string | null } = {}
    if (apiKeysTouched.openrouter) payload.openrouter = apiKeys.openrouter
    if (apiKeysTouched.jina) payload.jina = apiKeys.jina
    if (apiKeysTouched.discord) payload.discord = apiKeys.discord

    startTransition(async () => {
      const result = await updateApiKeys(payload)
      if (result.error) {
        showMsg(result.error, true)
      } else {
        setApiKeys({ openrouter: '', jina: '', discord: '' })
        setApiKeysTouched({ openrouter: false, jina: false, discord: false })
        showMsg('API keys saved.')
      }
    })
  }

  async function handleExport() {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY ?? ''
    const res = await fetch('/api/export/json', {
      headers: apiKey ? { 'x-api-key': apiKey } : {},
    })
    if (!res.ok) {
      showMsg('Export failed.', true)
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cortex-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleExportZip() {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY ?? ''
    const res = await fetch('/api/export/zip', {
      headers: apiKey ? { 'x-api-key': apiKey } : {},
    })
    if (!res.ok) {
      showMsg('ZIP export failed.', true)
      return
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cortex-knowledge.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport() {
    if (!importFile) return
    const formData = new FormData()
    formData.append('file', importFile)
    const apiKey = process.env.NEXT_PUBLIC_API_KEY ?? ''
    const res = await fetch('/api/import', {
      method: 'POST',
      headers: apiKey ? { 'x-api-key': apiKey } : {},
      body: formData,
    })
    const json = await res.json() as {
      imported?: boolean
      stats?: {
        categories: { imported: number; skipped: number }
        tags: { imported: number; skipped: number }
        items: { imported: number; skipped: number }
        itemTags: { imported: number; skipped: number }
      }
      error?: string
    }
    if (!res.ok || json.error) {
      setImportResult(`Error: ${json.error ?? 'Import failed'}`)
    } else if (json.stats) {
      setImportResult(
        `Imported: ${json.stats.items.imported} items, ${json.stats.categories.imported} categories, ${json.stats.tags.imported} tags. Skipped duplicates: ${json.stats.items.skipped + json.stats.categories.skipped + json.stats.tags.skipped}.`
      )
    }
    setImportFile(null)
  }

  async function handleClearData() {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY ?? ''
    const res = await fetch('/api/admin/clear-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
      body: JSON.stringify({ confirm: true }),
    })
    if (res.ok) {
      showMsg('All items have been deleted.')
      setClearConfirm(false)
    } else {
      showMsg('Failed to clear data.', true)
    }
  }

  async function handleReprocessAll() {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY ?? ''
    const res = await fetch('/api/admin/reprocess-all', {
      method: 'POST',
      headers: apiKey ? { 'x-api-key': apiKey } : {},
    })
    const json = await res.json() as { enqueued?: number; error?: string }
    if (res.ok) {
      showMsg(`Enqueued ${json.enqueued ?? 0} items for reprocessing.`)
      setReprocessConfirm(false)
    } else {
      showMsg('Failed to enqueue reprocessing.', true)
    }
  }

  async function handleRebuildMarkdown() {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY ?? ''
    const res = await fetch('/api/export/rebuild', {
      method: 'POST',
      headers: apiKey ? { 'x-api-key': apiKey } : {},
    })
    const json = await res.json() as { rebuilt?: number; errors?: number; error?: string }
    if (res.ok) {
      showMsg(`Rebuilt ${json.rebuilt ?? 0} markdown files. Errors: ${json.errors ?? 0}.`)
    } else {
      showMsg('Failed to rebuild markdown files.', true)
    }
  }

  async function handleRebuildEmbeddings() {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY ?? ''
    const res = await fetch('/api/admin/rebuild-embeddings', {
      method: 'POST',
      headers: apiKey ? { 'x-api-key': apiKey } : {},
    })
    const json = await res.json() as { enqueued?: number; error?: string }
    if (res.ok) {
      showMsg(`Enqueued ${json.enqueued ?? 0} items for embedding rebuild.`)
      setRebuildEmbedConfirm(false)
    } else {
      showMsg('Failed to enqueue embedding rebuild.', true)
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800 px-4 py-3 text-sm text-green-800 dark:text-green-200">
          {success}
        </div>
      )}

      {/* API Keys */}
      <Section title="API Keys">
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Keys saved here take precedence over environment variables. Leave blank to use the env var.
          </p>
          <ApiKeyInput
            label="OpenRouter API Key"
            placeholder={apiKeysConfigured.openrouter ? 'Configured' : 'Not set'}
            value={apiKeys.openrouter}
            onChange={(v) => {
              setApiKeys((k) => ({ ...k, openrouter: v }))
              setApiKeysTouched((t) => ({ ...t, openrouter: true }))
            }}
          />
          <ApiKeyInput
            label="Jina API Key"
            placeholder={apiKeysConfigured.jina ? 'Configured' : 'Not set'}
            value={apiKeys.jina}
            onChange={(v) => {
              setApiKeys((k) => ({ ...k, jina: v }))
              setApiKeysTouched((t) => ({ ...t, jina: true }))
            }}
          />
          <ApiKeyInput
            label="Discord Bot Token"
            placeholder={apiKeysConfigured.discord ? 'Configured' : 'Not set'}
            value={apiKeys.discord}
            onChange={(v) => {
              setApiKeys((k) => ({ ...k, discord: v }))
              setApiKeysTouched((t) => ({ ...t, discord: true }))
            }}
          />
          <Button onClick={handleSaveApiKeys} disabled={isPending}>
            Save API Keys
          </Button>
        </div>
      </Section>

      {/* Discord Bot Status */}
      <Section title="Discord Bot">
        <div className="flex items-center gap-3">
          <div
            className={`h-2.5 w-2.5 rounded-full shrink-0 ${
              discordConfigured ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <div>
            <p className="text-sm font-medium">
              {discordConfigured ? 'Token configured' : 'Not configured'}
            </p>
            <p className="text-xs text-muted-foreground">
              {discordConfigured
                ? 'Discord token is set. The bot can connect when the worker is running.'
                : 'Set DISCORD_BOT_TOKEN in your environment or configure it above.'}
            </p>
          </div>
        </div>
      </Section>

      {/* Model Selection */}
      <Section title="AI Model Selection">
        <div className="space-y-4">
          <ModelSelector
            label="Summarization Model"
            description="Used to summarize articles and extract key insights."
            value={models.summarize}
            options={CHAT_MODELS}
            onChange={(v) => handleModelChange('summarize', v)}
          />
          <ModelSelector
            label="Categorization Model"
            description="Used to classify content into categories."
            value={models.categorize}
            options={CHAT_MODELS}
            onChange={(v) => handleModelChange('categorize', v)}
          />
          <ModelSelector
            label="Embedding Model"
            description="Used for semantic search and similarity."
            value={models.embed}
            options={EMBED_MODELS}
            onChange={(v) => handleModelChange('embed', v)}
          />
          <ModelSelector
            label="Chat / RAG Model"
            description="Used for Ask mode and conversational queries."
            value={models.chat}
            options={CHAT_MODELS}
            onChange={(v) => handleModelChange('chat', v)}
          />
          <Button onClick={handleSaveModels} disabled={isPending}>
            Save Model Settings
          </Button>
        </div>
      </Section>

      {/* Data Export */}
      <Section title="Data Export & Import">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Export as JSON</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Download all items, categories, and tags as a JSON backup.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <DownloadIcon />
                Export JSON
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportZip}>
                <DownloadIcon />
                Download ZIP
              </Button>
            </div>
          </div>

          <hr className="border-border" />

          <div className="space-y-2">
            <p className="text-sm font-medium">Import from JSON Backup</p>
            <p className="text-xs text-muted-foreground">
              Upload a previously exported JSON file. Existing items will not be overwritten.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".json,application/json"
                className="text-sm file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium cursor-pointer"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleImport}
                disabled={!importFile}
              >
                <UploadIcon />
                Import
              </Button>
            </div>
            {importResult && (
              <p className="text-sm text-muted-foreground">{importResult}</p>
            )}
          </div>

          <hr className="border-border" />

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Rebuild Markdown Files</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Re-generate all markdown export files from the database.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRebuildMarkdown}>
              <RefreshCwIcon />
              Rebuild
            </Button>
          </div>
        </div>
      </Section>

      {/* Danger Zone */}
      <Section title="Danger Zone" danger>
        <div className="space-y-4">
          <DangerAction
            label="Rebuild Embeddings"
            description="Re-enqueue all completed items for embedding only. Useful after changing the embedding model."
            buttonLabel="Rebuild Embeddings"
            confirm={rebuildEmbedConfirm}
            onRequestConfirm={() => setRebuildEmbedConfirm(true)}
            onCancel={() => setRebuildEmbedConfirm(false)}
            onConfirm={handleRebuildEmbeddings}
          />

          <hr className="border-destructive/20" />

          <DangerAction
            label="Reprocess All Items"
            description="Re-enqueue all items for extraction, AI processing, and embedding. This will overwrite existing data."
            buttonLabel="Reprocess All"
            confirm={reprocessConfirm}
            onRequestConfirm={() => setReprocessConfirm(true)}
            onCancel={() => setReprocessConfirm(false)}
            onConfirm={handleReprocessAll}
          />

          <hr className="border-destructive/20" />

          <DangerAction
            label="Clear All Items"
            description="Permanently delete all items from the database. Categories and tags are kept. This cannot be undone."
            buttonLabel="Clear All Items"
            confirm={clearConfirm}
            onRequestConfirm={() => setClearConfirm(true)}
            onCancel={() => setClearConfirm(false)}
            onConfirm={handleClearData}
            destructive
          />
        </div>
      </Section>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Section({
  title,
  children,
  danger = false,
}: {
  title: string
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-6 space-y-4 ${
        danger ? 'border-destructive/40 bg-destructive/5' : ''
      }`}
    >
      <h2
        className={`text-base font-semibold ${danger ? 'text-destructive' : ''}`}
      >
        {danger && <AlertTriangleIcon className="inline size-4 mr-1.5 -mt-0.5" />}
        {title}
      </h2>
      {children}
    </div>
  )
}

function ApiKeyInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <label className="text-sm font-medium">{label}</label>
        <p className="text-xs text-muted-foreground mt-0.5">Current: {placeholder}</p>
      </div>
      <input
        type="password"
        className="w-56 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="Enter new value…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="new-password"
      />
    </div>
  )
}

function ModelSelector({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string
  description: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  // Allow a custom value not in the list
  const isCustom = !options.includes(value)

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <select
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={isCustom ? '__custom__' : value}
        onChange={(e) => {
          if (e.target.value !== '__custom__') onChange(e.target.value)
        }}
      >
        {options.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
        {isCustom && (
          <option value="__custom__">{value} (custom)</option>
        )}
      </select>
      {isCustom && (
        <input
          type="text"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="model-id"
        />
      )}
    </div>
  )
}

function DangerAction({
  label,
  description,
  buttonLabel,
  confirm,
  onRequestConfirm,
  onCancel,
  onConfirm,
  destructive = false,
}: {
  label: string
  description: string
  buttonLabel: string
  confirm: boolean
  onRequestConfirm: () => void
  onCancel: () => void
  onConfirm: () => void
  destructive?: boolean
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        {confirm && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-destructive font-medium">Are you sure?</span>
            <Button variant="destructive" size="sm" onClick={onConfirm}>
              Yes, {buttonLabel}
            </Button>
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        )}
      </div>
      {!confirm && (
        <Button
          variant={destructive ? 'destructive' : 'outline'}
          size="sm"
          onClick={onRequestConfirm}
        >
          {buttonLabel}
        </Button>
      )}
    </div>
  )
}
