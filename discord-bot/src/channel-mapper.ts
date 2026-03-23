import { config } from './config.js';

interface ChannelMapping {
  discordChannelId: string;
  discordChannelName: string;
  categorySlug: string;
  categoryName: string;
}

let cachedMappings: ChannelMapping[] | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchMappings(): Promise<ChannelMapping[]> {
  const response = await fetch(`${config.apiUrl}/api/channels`, {
    headers: {
      'x-api-key': config.apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch channel mappings: ${response.status}`);
  }

  return response.json() as Promise<ChannelMapping[]>;
}

async function getMappings(): Promise<ChannelMapping[]> {
  const now = Date.now();
  if (cachedMappings !== null && now < cacheExpiresAt) {
    return cachedMappings;
  }

  try {
    const mappings = await fetchMappings();
    cachedMappings = mappings;
    cacheExpiresAt = now + CACHE_TTL_MS;
    return mappings;
  } catch (err) {
    console.error('[channel-mapper] Failed to refresh mappings:', err);
    // Return stale cache if available, otherwise empty
    return cachedMappings ?? [];
  }
}

/**
 * Returns the category slug mapped to the given channel, or null if not mapped.
 * Looks up by channelId first, then falls back to channelName.
 */
export async function getCategoryForChannel(channelId: string, channelName: string): Promise<string | null> {
  const mappings = await getMappings();

  const byId = mappings.find((m) => m.discordChannelId === channelId);
  if (byId) return byId.categorySlug;

  const byName = mappings.find((m) => m.discordChannelName === channelName);
  if (byName) return byName.categorySlug;

  return null;
}

/**
 * Force-invalidate the in-memory cache so the next call re-fetches.
 */
export function invalidateMappingsCache(): void {
  cachedMappings = null;
  cacheExpiresAt = 0;
}
