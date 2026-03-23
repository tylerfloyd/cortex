// Model routing
export const MODELS = {
  summarize: 'anthropic/claude-sonnet-4-5',   // high quality summarization
  categorize: 'anthropic/claude-haiku-4-5',   // cheaper for categorization
  embed: 'openai/text-embedding-3-small',     // embeddings
  chat: 'anthropic/claude-sonnet-4-5',        // RAG chat
  budget: 'meta-llama/llama-3.1-8b-instruct', // fallback
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

/**
 * Returns the configured model for a given task, falling back to the MODELS default.
 * Reads from config.json so user-selected models are honoured at call time.
 */
export async function getModel(task: keyof Omit<typeof MODELS, 'budget'>): Promise<string> {
  try {
    const { readConfig } = await import('@/lib/config');
    const config = await readConfig();
    const value = config.models[task as keyof typeof config.models];
    if (value) return value;
  } catch {
    // fall through to default
  }
  return MODELS[task];
}

type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatCompletionOptions = {
  jsonMode?: boolean;
};

import { readApiKeys } from '@/lib/config';

async function getApiKey(): Promise<string> {
  // Prefer config.json override over env var
  try {
    const keys = await readApiKeys();
    if (keys.openrouter) return keys.openrouter;
  } catch {
    // fall through to env var
  }
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }
  return key;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_ATTEMPTS = 4; // 1 initial + 3 retries
const BACKOFF_MS = [1000, 2000, 4000];

async function fetchWithRetry(
  url: string,
  init: RequestInit
): Promise<Response> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (err) {
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise(resolve => setTimeout(resolve, BACKOFF_MS[attempt]));
        continue;
      }
      throw err;
    }
    if (!response.ok && [429, 500, 503].includes(response.status) && attempt < MAX_ATTEMPTS - 1) {
      await new Promise(resolve => setTimeout(resolve, BACKOFF_MS[attempt]));
      continue;
    }
    return response;
  }
  throw new Error('fetchWithRetry: exceeded max attempts');
}

/**
 * Call OpenRouter chat completions endpoint with retry logic.
 * Returns the content string from the first choice message.
 */
export async function chatCompletion(
  model: string,
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
): Promise<string> {
  const { jsonMode = false } = options;
  const apiKey = await getApiKey();

  const body: Record<string, unknown> = { model, messages };
  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://github.com/cortex',
      'X-Title': 'Cortex',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${text}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string } }>;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };

  if (data.usage) {
    console.log('[openrouter] tokens:', data.usage);
  }

  const content = data.choices?.[0]?.message?.content;
  if (content == null) {
    throw new Error('OpenRouter returned no content in response');
  }
  return content;
}

/**
 * Call OpenRouter chat completions endpoint with streaming enabled.
 * Returns the raw Response so the caller can pipe it as SSE/NDJSON.
 * The response body is a stream of `data: {...}` SSE lines.
 */
export async function chatCompletionStream(
  model: string,
  messages: ChatMessage[],
): Promise<Response> {
  const apiKey = await getApiKey();

  const body: Record<string, unknown> = { model, messages, stream: true };

  const response = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://github.com/cortex',
      'X-Title': 'Cortex',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${text}`);
  }

  return response;
}

/**
 * Create an embedding vector for the given text.
 * Returns a 1536-dimension number[] vector.
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const apiKey = await getApiKey();
  const model = await getModel('embed');

  const response = await fetchWithRetry('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://github.com/cortex',
      'X-Title': 'Cortex',
    },
    body: JSON.stringify({
      model,
      input: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter embeddings error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as {
    data: Array<{ embedding: number[] }>;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };

  if (data.usage) {
    console.log('[openrouter] tokens:', data.usage);
  }

  const embedding = data.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error('OpenRouter embeddings returned no vector');
  }
  return embedding;
}
