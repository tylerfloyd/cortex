export function buildSummarizePrompt(rawContent: string): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    {
      role: 'system',
      content: 'You are a knowledge extraction assistant. Extract key information from the provided content.',
    },
    {
      role: 'user',
      content: `Analyze the following content and return a JSON object with exactly these fields:
{
  "summary": "2-3 paragraph summary of the key points",
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "suggested_title": "a clear, concise title if the original is missing or poor",
  "content_type": "one of: tutorial | opinion | news | research | reference | discussion",
  "difficulty_level": "one of: beginner | intermediate | advanced",
  "estimated_read_time_minutes": <number>
}

Content:
${rawContent}`,
    },
  ];
}

export function buildCategorizePrompt(
  summary: string,
  categories: Array<{ name: string; slug: string }>,
  popularTags: string[],
): Array<{ role: 'system' | 'user'; content: string }> {
  const categoriesList = categories.map((c) => `${c.slug}: ${c.name}`).join('\n');
  const tagsList = popularTags.join(', ');

  return [
    {
      role: 'system',
      content: 'You are a content categorizer for a personal knowledge base.',
    },
    {
      role: 'user',
      content: `Based on the summary below, assign a category and generate relevant tags.
Return a JSON object with exactly these fields:
{
  "category": "<existing-slug> OR 'suggest:<New Category Name>'",
  "tags": ["tag1", "tag2", ...],
  "confidence": <0.0-1.0>
}

Use existing categories and tags when they fit. Only suggest new ones when truly needed.

Existing categories: ${categoriesList}
Popular existing tags: ${tagsList}

Summary:
${summary}`,
    },
  ];
}
