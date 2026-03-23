import { z } from 'zod';
import { listRecentItems } from '../api-client.js';

export const listRecentSchema = {
  category: z
    .string()
    .optional()
    .describe('Filter by category slug'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(10)
    .describe('Number of items to return (1-50, default 10)'),
};

export async function handleListRecent(args: { category?: string; limit?: number }) {
  const data = await listRecentItems({
    category: args.category,
    limit: args.limit ?? 10,
  });

  if (data.items.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: args.category
            ? `No recent items found in category "${args.category}".`
            : 'No items found in the knowledge base.',
        },
      ],
    };
  }

  const lines: string[] = [
    `# Recent Items (showing ${data.items.length} of ${data.total})\n`,
  ];

  for (const item of data.items) {
    lines.push(`## ${item.title ?? item.url}`);
    lines.push(`- **ID:** ${item.id}`);
    lines.push(`- **URL:** ${item.url}`);
    lines.push(`- **Type:** ${item.sourceType}`);
    if (item.category) {
      lines.push(`- **Category:** ${item.category.name ?? item.category.slug ?? '(unknown)'}`);
    }
    lines.push(`- **Added:** ${item.createdAt}`);
    if (item.summary) {
      const preview = item.summary.length > 200
        ? item.summary.slice(0, 197) + '...'
        : item.summary;
      lines.push(`- **Summary:** ${preview}`);
    }
    lines.push('');
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: lines.join('\n'),
      },
    ],
  };
}
