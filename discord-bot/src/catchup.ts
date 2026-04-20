import type { Client, TextChannel } from 'discord.js';
import { ChannelType } from 'discord.js';
import { extractUrls, extractNotes } from './url-detector.js';
import { handleUrlMessage } from './message-handler.js';
import { getCategoryForChannel } from './channel-mapper.js';
import { config } from './config.js';

const DONE_REACTIONS = ['✅', '❌'];
const CATCHUP_LIMIT = parseInt(process.env.CATCHUP_LIMIT ?? '100', 10);

/**
 * On startup, scan allowed channels for messages with URLs that the bot
 * hasn't reacted to yet (no ✅ or ❌), and process them.
 *
 * Skipped if ALLOWED_CHANNELS is not configured — without an explicit list
 * there is no reasonable scope to scan.
 */
export async function catchUpOnMissedMessages(client: Client): Promise<void> {
  if (config.allowedChannelIds.length === 0) {
    console.log('[catchup] No ALLOWED_CHANNELS configured — skipping catch-up scan');
    return;
  }

  const botId = client.user!.id;
  console.log(`[catchup] Scanning ${config.allowedChannelIds.length} channel(s) for missed messages (limit: ${CATCHUP_LIMIT})...`);

  for (const channelId of config.allowedChannelIds) {
    try {
      const channel = await client.channels.fetch(channelId);

      if (!channel || channel.type !== ChannelType.GuildText) {
        console.warn(`[catchup] Channel ${channelId} is not a guild text channel — skipping`);
        continue;
      }

      const textChannel = channel as TextChannel;
      const channelName = textChannel.name;

      const messages = await textChannel.messages.fetch({ limit: CATCHUP_LIMIT });

      const categorySlug = await getCategoryForChannel(channelId, channelName).catch(() => null);

      // Process oldest-first so reactions appear in chronological order
      const sorted = [...messages.values()].reverse();

      let processed = 0;
      for (const message of sorted) {
        if (message.author.bot) continue;

        const urls = extractUrls(message.content);
        if (urls.length === 0) continue;

        // Skip if the bot already left a terminal reaction on this message.
        // We only check emoji presence — users rarely react with ✅/❌ so
        // this avoids extra API calls to fetch reaction user lists.
        const alreadyHandled = DONE_REACTIONS.some((emoji) => {
          const reaction = message.reactions.cache.get(emoji);
          // If reaction users are cached, confirm the bot reacted; otherwise
          // trust that the emoji being present means we handled it.
          if (!reaction) return false;
          const users = reaction.users.cache;
          return users.size === 0 ? true : users.has(botId);
        });

        if (alreadyHandled) continue;

        const notes = extractNotes(message.content);
        await Promise.allSettled(
          urls.map((url) =>
            handleUrlMessage(message, url, channelName, notes, categorySlug ?? undefined),
          ),
        );
        processed++;
      }

      console.log(`[catchup] #${channelName}: ${processed} missed message(s) processed`);
    } catch (err) {
      console.error(`[catchup] Error scanning channel ${channelId}:`, err);
    }
  }

  console.log('[catchup] Catch-up scan complete');
}
