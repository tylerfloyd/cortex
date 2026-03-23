import {
  Message,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from 'discord.js';
import { config } from './config.js';
import { RateLimiter } from './rate-limiter.js';
import { getCategoryForChannel, invalidateMappingsCache } from './channel-mapper.js';
import {
  searchKnowledge,
  askKnowledge,
  listCategories,
  getRecentItems,
  mapChannel,
  ApiError,
} from './api-client.js';

const BLUE = 0x3b82f6;
const GREEN = 0x10b981;
const YELLOW = 0xf59e0b;
const RED = 0xef4444;

const rateLimiter = new RateLimiter();

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

function resolveChannelName(channel: Message['channel']): string {
  return 'name' in channel && typeof channel.name === 'string'
    ? channel.name
    : channel.id;
}

// ---- Slash command definitions ----

export const slashCommands = [
  new SlashCommandBuilder()
    .setName('search')
    .setDescription('Semantic search your knowledge base')
    .addStringOption((opt) =>
      opt.setName('query').setDescription('Search query').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('category').setDescription('Filter by category slug').setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask a question using your knowledge base (RAG)')
    .addStringOption((opt) =>
      opt.setName('question').setDescription('Your question').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('category').setDescription('Limit to a category slug').setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('recent')
    .setDescription('Show recently saved items')
    .addStringOption((opt) =>
      opt.setName('category').setDescription('Filter by category slug').setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('categories')
    .setDescription('List all categories with item counts'),

  new SlashCommandBuilder()
    .setName('map')
    .setDescription('Map this channel to a category for automatic tagging')
    .addStringOption((opt) =>
      opt.setName('category').setDescription('Category slug to map').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
].map((cmd) => cmd.toJSON());

/**
 * Register slash commands with Discord for a guild.
 * Pass guildId to register guild-scoped commands (instant update) instead of global.
 */
export async function registerSlashCommands(clientId: string, guildId?: string): Promise<void> {
  if (!config.discordToken) return;

  const rest = new REST({ version: '10' }).setToken(config.discordToken);

  try {
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: slashCommands,
      });
      console.log(`[commands] Registered ${slashCommands.length} slash commands for guild ${guildId}`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), {
        body: slashCommands,
      });
      console.log(`[commands] Registered ${slashCommands.length} global slash commands`);
    }
  } catch (err) {
    console.error('[commands] Failed to register slash commands:', err);
  }
}

// ---- Command reply helpers ----

async function replyError(message: Message, text: string): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(RED)
    .setDescription(text)
    .setFooter({ text: 'Cortex' });
  await message.reply({ embeds: [embed] });
}

// ---- Command handlers ----

async function handleSearch(message: Message, args: string): Promise<void> {
  const query = args.trim();
  if (!query) {
    await replyError(message, 'Usage: `!search <query>`');
    return;
  }

  const channelId = message.channelId;
  const channelName = resolveChannelName(message.channel);

  const category = await getCategoryForChannel(channelId, channelName);

  let data;
  try {
    data = await searchKnowledge(query, category ?? undefined, 5);
  } catch (err) {
    const msg = err instanceof ApiError ? err.message : 'Search failed';
    await replyError(message, msg);
    return;
  }

  if (data.results.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(YELLOW)
      .setTitle('No results found')
      .setDescription(`No items matched **${truncate(query, 200)}**`)
      .setFooter({ text: 'Cortex | Search' });
    await message.reply({ embeds: [embed] });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(BLUE)
    .setTitle(`Search: ${truncate(query, 100)}`)
    .setFooter({ text: `Cortex | ${data.results.length} result(s)` });

  for (const result of data.results) {
    const title = result.title ?? result.url;
    const summary = result.summary ? truncate(result.summary, 150) : 'No summary';
    const score = (result.similarity * 100).toFixed(0);
    embed.addFields({
      name: truncate(title, 256),
      value: `${summary}\n[View](${result.url}) | Score: ${score}%`,
    });
  }

  await message.reply({ embeds: [embed] });
}

async function handleAsk(message: Message, args: string): Promise<void> {
  const question = args.trim();
  if (!question) {
    await replyError(message, 'Usage: `!ask <question>`');
    return;
  }

  const channelId = message.channelId;
  const channelName = resolveChannelName(message.channel);

  const category = await getCategoryForChannel(channelId, channelName);

  // Show a thinking reaction while we wait
  await message.react('🤔').catch(() => {});

  let data;
  try {
    data = await askKnowledge(question, category ?? undefined);
  } catch (err) {
    await message.reactions.removeAll().catch(() => {});
    const msg = err instanceof ApiError ? err.message : 'Ask failed';
    await replyError(message, msg);
    return;
  }

  await message.reactions.removeAll().catch(() => {});

  const embed = new EmbedBuilder()
    .setColor(GREEN)
    .setTitle('Answer')
    .setDescription(truncate(data.answer, 2048))
    .setFooter({ text: 'Cortex | RAG' });

  if (data.sources.length > 0) {
    const sourceList = data.sources
      .slice(0, 3)
      .map((s) => `• [${truncate(s.title ?? s.url, 80)}](${s.url})`)
      .join('\n');
    embed.addFields({ name: 'Sources', value: sourceList });
  }

  await message.reply({ embeds: [embed] });
}

async function handleRecent(message: Message, args: string): Promise<void> {
  const category = args.trim() || undefined;

  let recentItems;
  try {
    recentItems = await getRecentItems(category, 5);
  } catch (err) {
    const msg = err instanceof ApiError ? err.message : 'Failed to fetch recent items';
    await replyError(message, msg);
    return;
  }

  if (recentItems.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(YELLOW)
      .setDescription(category ? `No items found in category **${category}**` : 'No items saved yet')
      .setFooter({ text: 'Cortex | Recent' });
    await message.reply({ embeds: [embed] });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(BLUE)
    .setTitle(category ? `Recent items in "${category}"` : 'Recent items')
    .setFooter({ text: 'Cortex | Recent' });

  for (const item of recentItems) {
    const title = item.title ?? item.url;
    const date = item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown date';
    embed.addFields({
      name: truncate(title, 256),
      value: `[View](${item.url}) | ${item.source_type} | ${date}`,
    });
  }

  await message.reply({ embeds: [embed] });
}

async function handleCategories(message: Message): Promise<void> {
  let cats;
  try {
    cats = await listCategories();
  } catch (err) {
    const msg = err instanceof ApiError ? err.message : 'Failed to fetch categories';
    await replyError(message, msg);
    return;
  }

  if (cats.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(YELLOW)
      .setDescription('No categories found.')
      .setFooter({ text: 'Cortex | Categories' });
    await message.reply({ embeds: [embed] });
    return;
  }

  const lines = cats.map((c) => `**${c.name}** (\`${c.slug}\`) — ${c.itemCount} item(s)`);

  const embed = new EmbedBuilder()
    .setColor(BLUE)
    .setTitle('Categories')
    .setDescription(truncate(lines.join('\n'), 2048))
    .setFooter({ text: 'Cortex | Categories' });

  await message.reply({ embeds: [embed] });
}

async function handleMap(message: Message, args: string): Promise<void> {
  const categorySlug = args.trim();
  if (!categorySlug) {
    await replyError(message, 'Usage: `!map <category-slug>`');
    return;
  }

  // Permission check — requires MANAGE_CHANNELS in a guild
  if (!message.guild) {
    await replyError(message, 'This command can only be used in a server channel.');
    return;
  }

  const member = message.member;
  if (!member || !member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    await replyError(message, 'You need the **Manage Channels** permission to use this command.');
    return;
  }

  const channelId = message.channelId;
  const channelName = resolveChannelName(message.channel);

  try {
    await mapChannel(channelId, channelName, categorySlug);
  } catch (err) {
    const msg = err instanceof ApiError ? err.message : 'Failed to map channel';
    await replyError(message, msg);
    return;
  }

  // Invalidate local cache so the new mapping takes effect immediately
  invalidateMappingsCache();

  const embed = new EmbedBuilder()
    .setColor(GREEN)
    .setTitle('Channel mapped')
    .setDescription(`This channel is now mapped to category \`${categorySlug}\`. New URLs shared here will be tagged automatically.`)
    .setFooter({ text: 'Cortex | Channel mapping' });

  await message.reply({ embeds: [embed] });
}

// ---- Main dispatcher ----

/**
 * Handle a prefix command message (starts with `!`).
 * Returns true if the message was handled as a command, false otherwise.
 */
export async function handleCommand(message: Message): Promise<boolean> {
  const content = message.content.trim();
  if (!content.startsWith('!')) return false;

  // Parse command name and arguments
  const withoutPrefix = content.slice(1);
  const spaceIdx = withoutPrefix.indexOf(' ');
  const commandName = spaceIdx === -1
    ? withoutPrefix.toLowerCase()
    : withoutPrefix.slice(0, spaceIdx).toLowerCase();
  const args = spaceIdx === -1 ? '' : withoutPrefix.slice(spaceIdx + 1);

  const knownCommands = new Set(['search', 'ask', 'recent', 'categories', 'map']);
  if (!knownCommands.has(commandName)) return false;

  // Apply rate limiting
  if (!rateLimiter.isAllowed(message.author.id)) {
    const remaining = rateLimiter.getRemainingRequests(message.author.id);
    await replyError(
      message,
      `You're sending commands too fast. Please wait a moment. (${remaining} requests remaining in this window)`
    );
    return true;
  }

  switch (commandName) {
    case 'search':
      await handleSearch(message, args);
      break;
    case 'ask':
      await handleAsk(message, args);
      break;
    case 'recent':
      await handleRecent(message, args);
      break;
    case 'categories':
      await handleCategories(message);
      break;
    case 'map':
      await handleMap(message, args);
      break;
  }

  return true;
}

// ---- Slash command dispatcher ----

/**
 * Handle a slash command interaction.
 * Dispatches to the same underlying logic as the prefix commands.
 */
export async function handleSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!rateLimiter.isAllowed(interaction.user.id)) {
    const remaining = rateLimiter.getRemainingRequests(interaction.user.id);
    await interaction.reply({
      content: `Rate limit exceeded (${remaining} requests remaining). Please wait before sending more commands.`,
      ephemeral: true,
    }).catch(() => {});
    return;
  }

  switch (interaction.commandName) {
    case 'search': {
      const query = interaction.options.getString('query');
      if (!query) {
        await interaction.reply({ content: 'A search query is required.', ephemeral: true });
        return;
      }
      const category = interaction.options.getString('category') ?? undefined;
      await interaction.deferReply();

      let data;
      try {
        data = await searchKnowledge(query, category, 5);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Search failed';
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(RED).setDescription(msg).setFooter({ text: 'Cortex' })],
        });
        return;
      }

      if (data.results.length === 0) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(YELLOW)
              .setTitle('No results found')
              .setDescription(`No items matched **${truncate(query, 200)}**`)
              .setFooter({ text: 'Cortex | Search' }),
          ],
        });
        return;
      }

      const searchEmbed = new EmbedBuilder()
        .setColor(BLUE)
        .setTitle(`Search: ${truncate(query, 100)}`)
        .setFooter({ text: `Cortex | ${data.results.length} result(s)` });

      for (const result of data.results) {
        const title = result.title ?? result.url;
        const summary = result.summary ? truncate(result.summary, 150) : 'No summary';
        const score = (result.similarity * 100).toFixed(0);
        searchEmbed.addFields({
          name: truncate(title, 256),
          value: `${summary}\n[View](${result.url}) | Score: ${score}%`,
        });
      }

      await interaction.editReply({ embeds: [searchEmbed] });
      break;
    }

    case 'ask': {
      const question = interaction.options.getString('question');
      if (!question) {
        await interaction.reply({ content: 'A question is required.', ephemeral: true });
        return;
      }
      const askCategory = interaction.options.getString('category') ?? undefined;
      await interaction.deferReply();

      let askData;
      try {
        askData = await askKnowledge(question, askCategory);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Ask failed';
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(RED).setDescription(msg).setFooter({ text: 'Cortex' })],
        });
        return;
      }

      const askEmbed = new EmbedBuilder()
        .setColor(GREEN)
        .setTitle('Answer')
        .setDescription(truncate(askData.answer, 2048))
        .setFooter({ text: 'Cortex | RAG' });

      if (askData.sources.length > 0) {
        const sourceList = askData.sources
          .slice(0, 3)
          .map((s) => `• [${truncate(s.title ?? s.url, 80)}](${s.url})`)
          .join('\n');
        askEmbed.addFields({ name: 'Sources', value: sourceList });
      }

      await interaction.editReply({ embeds: [askEmbed] });
      break;
    }

    case 'recent': {
      const recentCategory = interaction.options.getString('category') ?? undefined;
      await interaction.deferReply();

      let recentItems;
      try {
        recentItems = await getRecentItems(recentCategory, 5);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Failed to fetch recent items';
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(RED).setDescription(msg).setFooter({ text: 'Cortex' })],
        });
        return;
      }

      if (recentItems.length === 0) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(YELLOW)
              .setDescription(
                recentCategory
                  ? `No items found in category **${recentCategory}**`
                  : 'No items saved yet'
              )
              .setFooter({ text: 'Cortex | Recent' }),
          ],
        });
        return;
      }

      const recentEmbed = new EmbedBuilder()
        .setColor(BLUE)
        .setTitle(recentCategory ? `Recent items in "${recentCategory}"` : 'Recent items')
        .setFooter({ text: 'Cortex | Recent' });

      for (const item of recentItems) {
        const title = item.title ?? item.url;
        const date = item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown date';
        recentEmbed.addFields({
          name: truncate(title, 256),
          value: `[View](${item.url}) | ${item.source_type} | ${date}`,
        });
      }

      await interaction.editReply({ embeds: [recentEmbed] });
      break;
    }

    case 'categories': {
      await interaction.deferReply();

      let cats;
      try {
        cats = await listCategories();
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Failed to fetch categories';
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(RED).setDescription(msg).setFooter({ text: 'Cortex' })],
        });
        return;
      }

      if (cats.length === 0) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(YELLOW)
              .setDescription('No categories found.')
              .setFooter({ text: 'Cortex | Categories' }),
          ],
        });
        return;
      }

      const lines = cats.map((c) => `**${c.name}** (\`${c.slug}\`) — ${c.itemCount} item(s)`);

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(BLUE)
            .setTitle('Categories')
            .setDescription(truncate(lines.join('\n'), 2048))
            .setFooter({ text: 'Cortex | Categories' }),
        ],
      });
      break;
    }

    case 'map': {
      const categorySlug = interaction.options.getString('category');
      if (!categorySlug) {
        await interaction.reply({ content: 'A category slug is required.', ephemeral: true });
        return;
      }

      if (!interaction.guild) {
        await interaction.reply({
          content: 'This command can only be used in a server channel.',
          ephemeral: true,
        });
        return;
      }

      await interaction.deferReply();

      const channelId = interaction.channelId;
      const channel = interaction.channel;
      const channelName =
        channel && 'name' in channel && typeof channel.name === 'string'
          ? channel.name
          : channelId;

      try {
        await mapChannel(channelId, channelName, categorySlug);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Failed to map channel';
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(RED).setDescription(msg).setFooter({ text: 'Cortex' })],
        });
        return;
      }

      invalidateMappingsCache();

      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(GREEN)
            .setTitle('Channel mapped')
            .setDescription(
              `This channel is now mapped to category \`${categorySlug}\`. New URLs shared here will be tagged automatically.`
            )
            .setFooter({ text: 'Cortex | Channel mapping' }),
        ],
      });
      break;
    }
  }
}
