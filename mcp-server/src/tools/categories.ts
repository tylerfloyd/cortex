import { listCategories } from '../api-client.js';

export const listCategoriesSchema = {};

export async function handleListCategories() {
  const data = await listCategories();

  if (data.categories.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'No categories found in the knowledge base.',
        },
      ],
    };
  }

  const lines: string[] = [`# Categories (${data.categories.length} total)\n`];

  for (const cat of data.categories) {
    lines.push(`## ${cat.name}`);
    lines.push(`- **Slug:** ${cat.slug}`);
    lines.push(`- **Items:** ${cat.itemCount}`);
    if (cat.description) lines.push(`- **Description:** ${cat.description}`);
    if (cat.color) lines.push(`- **Color:** ${cat.color}`);
    if (cat.parentId) lines.push(`- **Parent ID:** ${cat.parentId}`);
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
