import { EmbedBuilder } from 'discord.js';
import type { ItemDetails } from './api-client.js';

const GREEN = 0x10b981;
const RED = 0xef4444;
const YELLOW = 0xf59e0b;

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '…';
}

// Build success embed showing saved item details
export function buildSavedEmbed(item: ItemDetails): EmbedBuilder {
  const categoryName = item.category?.name ?? 'Uncategorized';
  const tagList = item.tags
    .slice(0, 5)
    .map((t) => t.name)
    .join(', ') || 'None';

  const embed = new EmbedBuilder()
    .setColor(GREEN)
    .setFooter({ text: `Cortex | Saved ${item.source_type}` });

  const title = item.title ? truncate(item.title, 200) : item.url;
  embed.setTitle(title);
  embed.setURL(item.url);

  if (item.summary) {
    embed.setDescription(truncate(item.summary, 1000));
  }

  embed.addFields(
    { name: '📂 Category', value: categoryName, inline: true },
    { name: '🏷️ Tags', value: tagList, inline: true },
  );

  return embed;
}

// Build error embed
export function buildErrorEmbed(url: string, error: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(RED)
    .setTitle('Failed to save URL')
    .setDescription(`**URL:** ${url}\n**Error:** ${truncate(error, 500)}`)
    .setFooter({ text: 'Cortex | Processing failed' });
}

// Build duplicate URL embed shown when a 409 is returned
export function buildDuplicateEmbed(url: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0xf59e0b) // amber
    .setTitle('Already saved')
    .setDescription(`This URL was already saved to your knowledge base.\n${url}`)
    .setFooter({ text: 'Cortex' });
}

// Build timeout embed shown when processing takes too long
export function buildTimeoutEmbed(url: string, itemId: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(YELLOW)
    .setTitle('Processing taking longer than expected')
    .setDescription(
      `The URL is still being processed.\n\n**URL:** ${url}\n**Item ID:** \`${itemId}\`\n\nCheck back later — it will be available in your Cortex library once complete.`,
    )
    .setFooter({ text: 'Cortex | Processing pending' });
}
