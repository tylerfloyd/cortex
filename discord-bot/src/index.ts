import { Client, GatewayIntentBits, Events } from 'discord.js';
import { config } from './config.js';
import { extractUrls, extractNotes } from './url-detector.js';
import { handleUrlMessage } from './message-handler.js';
import { handleCommand, handleSlashCommand, registerSlashCommands } from './commands.js';
import { getCategoryForChannel } from './channel-mapper.js';
import { RateLimiter } from './rate-limiter.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const rateLimiter = new RateLimiter();

client.once(Events.ClientReady, async (readyClient) => {
  try {
    console.log(`Cortex Discord bot ready — logged in as ${readyClient.user.tag}`);

    // Register slash commands for all guilds the bot is in
    const clientId = readyClient.user.id;
    const guilds = readyClient.guilds.cache;

    if (guilds.size > 0) {
      for (const [guildId] of guilds) {
        await registerSlashCommands(clientId, guildId);
      }
    } else {
      // Fall back to global registration if not in any guilds yet
      await registerSlashCommands(clientId);
    }
  } catch (err) {
    console.error('[bot] Failed to register slash commands:', err);
    // Don't crash — bot can still work without slash commands
  }
});

client.on(Events.MessageCreate, async (message) => {
  // Ignore messages from bots (including ourselves)
  if (message.author.bot) return;

  // Route prefix commands first
  if (message.content.trimStart().startsWith('!')) {
    const handled = await handleCommand(message);
    if (handled) return;
  }

  const urls = extractUrls(message.content);
  if (urls.length === 0) return;

  const notes = extractNotes(message.content);

  // Resolve channel name — fall back to channel ID for DMs/threads without names
  const channelName =
    'name' in message.channel && typeof message.channel.name === 'string'
      ? message.channel.name
      : message.channel.id;

  // Look up channel-to-category mapping
  const categorySlug = await getCategoryForChannel(message.channelId, channelName).catch(() => null);

  // Process all URLs concurrently
  await Promise.allSettled(
    urls.map((url) => handleUrlMessage(message, url, channelName, notes, categorySlug ?? undefined)),
  );
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (!rateLimiter.isAllowed(interaction.user.id)) {
    await interaction.reply({ content: 'Rate limit exceeded. Please wait.', ephemeral: true }).catch(() => {});
    return;
  }
  await handleSlashCommand(interaction).catch(err => {
    console.error('[bot] Slash command error:', err);
  });
});

// Graceful shutdown
function shutdown(): void {
  console.log('Shutting down Cortex Discord bot...');
  client.destroy();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

client.login(config.discordToken).catch((err) => {
  console.error('Failed to login to Discord:', err);
  process.exit(1);
});
