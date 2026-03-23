import fs from 'fs/promises';
import path from 'path';

export const CONFIG_PATH = path.join(process.cwd(), 'data', 'config.json');

export type ModelSettings = {
  summarize: string;
  categorize: string;
  embed: string;
  chat: string;
};

export type ApiKeys = {
  openrouter: string | null;
  jina: string | null;
  discord: string | null;
};

export type AppConfig = {
  models: ModelSettings;
  apiKeys: ApiKeys;
};

const DEFAULT_CONFIG: AppConfig = {
  models: {
    summarize: 'anthropic/claude-sonnet-4-5',
    categorize: 'anthropic/claude-haiku-4-5',
    embed: 'openai/text-embedding-3-small',
    chat: 'anthropic/claude-sonnet-4-5',
  },
  apiKeys: {
    openrouter: null,
    jina: null,
    discord: null,
  },
};

export async function readConfig(): Promise<AppConfig> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    return {
      models: {
        ...DEFAULT_CONFIG.models,
        ...(parsed.models ?? {}),
      },
      apiKeys: {
        ...DEFAULT_CONFIG.apiKeys,
        ...(parsed.apiKeys ?? {}),
      },
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/** Read just API keys from config; returns nulls if config doesn't exist. */
export async function readApiKeys(): Promise<ApiKeys> {
  const config = await readConfig();
  return config.apiKeys;
}

export async function writeConfig(config: AppConfig): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}
