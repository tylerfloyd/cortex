import { z } from 'zod';
import { getItemById, findItemByUrl, Item } from '../api-client.js';

export const getItemSchema = {
  id: z.string().uuid().optional().describe('Item UUID'),
  url: z.string().url().optional().describe('Original URL of the item — at least one of id or url must be provided'),
};

function formatItem(item: Item): string {
  const lines: string[] = [];

  lines.push(`# ${item.title ?? item.url}`);
  lines.push('');
  lines.push(`- **ID:** ${item.id}`);
  lines.push(`- **URL:** ${item.url}`);
  lines.push(`- **Source Type:** ${item.sourceType}`);
  if (item.author) lines.push(`- **Author:** ${item.author}`);
  if (item.publishedAt) lines.push(`- **Published:** ${item.publishedAt}`);
  lines.push(`- **Status:** ${item.processingStatus}`);
  if (item.category) {
    lines.push(`- **Category:** ${item.category.name ?? item.category.slug ?? '(unknown)'}`);
  }
  if (item.tags && item.tags.length > 0) {
    lines.push(`- **Tags:** ${item.tags.map((t) => t.name).join(', ')}`);
  }
  if (item.isFavorite) lines.push('- **Favorite:** Yes');
  lines.push(`- **Added:** ${item.createdAt}`);
  lines.push('');

  if (item.summary) {
    lines.push('## Summary');
    lines.push(item.summary);
    lines.push('');
  }

  if (item.keyInsights && item.keyInsights.length > 0) {
    lines.push('## Key Insights');
    for (const insight of item.keyInsights) {
      lines.push(`- ${insight}`);
    }
    lines.push('');
  }

  if (item.userNotes) {
    lines.push('## Notes');
    lines.push(item.userNotes);
    lines.push('');
  }

  return lines.join('\n');
}

export async function handleGetItem(args: { id?: string; url?: string }) {
  if (!args.id && !args.url) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'Error: At least one of "id" or "url" must be provided.',
        },
      ],
      isError: true,
    };
  }

  let item: Item | null = null;

  if (args.id) {
    try {
      item = await getItemById(args.id);
    } catch (err) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error fetching item by ID: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }
    if (!item) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Item not found: ${args.id}`,
          },
        ],
      };
    }
  } else if (args.url) {
    try {
      item = await findItemByUrl(args.url);
    } catch (err) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error searching for item by URL: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
        isError: true,
      };
    }

    if (!item) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `No item found with URL: ${args.url}`,
          },
        ],
      };
    }
  }

  if (!item) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'Item not found.',
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: formatItem(item),
      },
    ],
  };
}
