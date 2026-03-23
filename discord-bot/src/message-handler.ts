import type { Message, MessageReaction } from 'discord.js';
import { ApiError, ingestUrl, getItem } from './api-client.js';
import { pollUntilComplete } from './status-poller.js';
import { buildSavedEmbed, buildErrorEmbed, buildTimeoutEmbed, buildDuplicateEmbed } from './embed-builder.js';
import { config } from './config.js';

// Process a single URL extracted from a Discord message.
export async function handleUrlMessage(
  message: Message,
  url: string,
  channelName: string,
  userNotes: string,
  categorySlug?: string,
): Promise<void> {
  // React with hourglass to indicate work-in-progress
  let pendingReaction: MessageReaction | null = null;
  try {
    pendingReaction = await message.react('⏳');
  } catch {
    // Non-fatal — continue even if we can't react (e.g. missing permissions)
  }

  try {
    const ingestResult = await ingestUrl({
      url,
      captureSource: 'discord',
      discordChannel: channelName,
      userNotes: userNotes || undefined,
      categorySlug: categorySlug || undefined,
    });

    const finalStatus = await pollUntilComplete(
      ingestResult.id,
      config.pollTimeoutMs,
      config.pollIntervalMs,
    );

    if (finalStatus === 'completed') {
      await pendingReaction?.remove().catch(() => {});
      await message.react('✅').catch(() => {});
      const item = await getItem(ingestResult.id);
      await message.reply({ embeds: [buildSavedEmbed(item)] });
    } else if (finalStatus === 'failed') {
      await pendingReaction?.remove().catch(() => {});
      await message.react('❌').catch(() => {});
      await message.reply({ embeds: [buildErrorEmbed(url, 'Processing failed')] });
    } else {
      // timeout: leave ⏳ in place, just reply
      await message.reply({ embeds: [buildTimeoutEmbed(url, ingestResult.id)] }).catch(() => {});
    }
  } catch (err) {
    // Remove the hourglass reaction on error
    try {
      await pendingReaction?.remove();
    } catch {
      // Non-fatal
    }

    if (err instanceof ApiError && err.status === 409) {
      // Duplicate URL
      await message.react('✅');
      await message.reply({ embeds: [buildDuplicateEmbed(url)] });
      return;
    }

    // Generic error
    await message.react('❌');
    const errorMessage = err instanceof Error ? err.message : String(err);
    await message.reply({ embeds: [buildErrorEmbed(url, errorMessage)] });
  }
}
