'use server'

import { revalidatePath } from 'next/cache'
import { readConfig, writeConfig } from '@/lib/config'
import type { AppConfig } from '@/lib/config'

export async function getSettings(): Promise<AppConfig> {
  return readConfig()
}

export async function updateModelSettings(
  formData: FormData,
): Promise<{ error?: string }> {
  const summarize = (formData.get('summarize') as string | null)?.trim()
  const categorize = (formData.get('categorize') as string | null)?.trim()
  const embed = (formData.get('embed') as string | null)?.trim()
  const chat = (formData.get('chat') as string | null)?.trim()

  if (!summarize || !categorize || !embed || !chat) {
    return { error: 'All model fields are required' }
  }

  try {
    // Preserve existing config (including apiKeys) when saving model settings
    const existing = await readConfig()
    const config: AppConfig = {
      ...existing,
      models: { summarize, categorize, embed, chat },
    }
    await writeConfig(config)
    revalidatePath('/settings')
    return {}
  } catch (err) {
    console.error('[updateModelSettings]', err)
    return { error: 'Failed to save settings' }
  }
}

export async function updateApiKeys(keys: {
  openrouter?: string | null
  jina?: string | null
  discord?: string | null
}): Promise<{ error?: string }> {
  try {
    const config = await readConfig()
    if (keys.openrouter !== undefined) config.apiKeys.openrouter = keys.openrouter || null
    if (keys.jina !== undefined) config.apiKeys.jina = keys.jina || null
    if (keys.discord !== undefined) config.apiKeys.discord = keys.discord || null
    await writeConfig(config)
    revalidatePath('/settings')
    return {}
  } catch (err) {
    console.error('[updateApiKeys]', err)
    return { error: 'Failed to save API keys' }
  }
}
