import { z } from 'zod';
import { searchKnowledge } from '../api-client.js';

export const searchKnowledgeSchema = {
  query: z.string().min(1).describe('The search query'),
  category: z.string().optional().describe('Filter by category slug'),
  source_type: z
    .enum(['article', 'youtube', 'reddit', 'twitter', 'pdf'])
    .optional()
    .describe('Filter by source type'),
  date_range: z
    .enum(['7d', '30d', '90d'])
    .optional()
    .describe('Limit results to items saved within this time range'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .default(10)
    .describe('Number of results to return (1-20, default 10)'),
};

export async function handleSearchKnowledge(args: {
  query: string;
  category?: string;
  source_type?: string;
  date_range?: string;
  limit?: number;
}) {
  const data = await searchKnowledge({
    query: args.query,
    category: args.category,
    source_type: args.source_type,
    date_range: args.date_range,
    limit: args.limit ?? 10,
  });

  if (data.results.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `No results found for query: "${args.query}"`,
        },
      ],
    };
  }

  const lines: string[] = [
    `Found ${data.results.length} result(s) for: "${args.query}"\n`,
  ];

  for (const r of data.results) {
    lines.push(`## ${r.title ?? r.url}`);
    lines.push(`- **ID:** ${r.id}`);
    lines.push(`- **URL:** ${r.url}`);
    if (r.category) lines.push(`- **Category:** ${r.category}`);
    lines.push(`- **Type:** ${r.source_type}`);
    if (r.similarity != null) {
      lines.push(`- **Relevance:** ${(r.similarity * 100).toFixed(1)}%`);
    }
    if (r.summary) lines.push(`- **Summary:** ${r.summary}`);
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
