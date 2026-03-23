import { z } from 'zod';
import { askKnowledge } from '../api-client.js';

export const askKnowledgeSchema = {
  question: z.string().min(1).describe('The question to ask your knowledge base'),
  category: z.string().optional().describe('Optional category slug to filter the knowledge base search'),
};

export async function handleAskKnowledge(args: { question: string; category?: string }) {
  const data = await askKnowledge(args.question, args.category);

  const lines: string[] = [];

  lines.push('## Answer');
  lines.push('');
  lines.push(data.answer);
  lines.push('');

  if (data.sources && data.sources.length > 0) {
    lines.push('## Sources');
    lines.push('');
    for (const source of data.sources) {
      const relevancePct =
        source.relevance != null ? ` (${(source.relevance * 100).toFixed(1)}% relevant)` : '';
      lines.push(`- **${source.title}**${relevancePct}`);
      lines.push(`  ${source.url}`);
      lines.push(`  ID: ${source.id}`);
    }
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
