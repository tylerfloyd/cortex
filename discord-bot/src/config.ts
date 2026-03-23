import 'dotenv/config';

export const config = {
  discordToken: process.env.DISCORD_TOKEN ?? '',
  apiUrl: process.env.API_URL ?? 'http://localhost:3000',
  apiKey: process.env.API_KEY ?? '',
  pollTimeoutMs: parseInt(process.env.POLL_TIMEOUT_MS ?? '60000', 10),
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS ?? '3000', 10),
  // Optional comma-separated list of channel IDs to watch for URLs.
  // If empty, all channels are watched (original behavior).
  allowedChannelIds: process.env.ALLOWED_CHANNELS
    ? process.env.ALLOWED_CHANNELS.split(',').map((id) => id.trim()).filter(Boolean)
    : [],
};

// Validate required config at startup
const missingVars: string[] = [];
if (!config.discordToken) missingVars.push('DISCORD_TOKEN');
if (!config.apiKey) missingVars.push('API_KEY');
if (missingVars.length > 0) {
  console.error(`[config] Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}
