import { getSettings } from './actions'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const config = await getSettings()
  const discordConfigured = !!(
    config.apiKeys.discord ?? process.env.DISCORD_BOT_TOKEN ?? process.env.DISCORD_TOKEN
  )
  const apiKeysConfigured = {
    openrouter: config.apiKeys.openrouter !== null,
    jina: config.apiKeys.jina !== null,
    discord: config.apiKeys.discord !== null,
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Configure your Cortex instance.</p>
      </div>

      <SettingsClient
        initialModels={config.models}
        apiKeysConfigured={apiKeysConfigured}
        discordConfigured={discordConfigured}
      />
    </div>
  )
}
