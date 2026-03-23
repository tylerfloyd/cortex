import { chatCompletion, getModel } from './openrouter';
import { buildCategorizePrompt } from './prompts';

export interface CategorizeResult {
  categorySlug: string;           // existing slug or 'uncategorized'
  isSuggested: boolean;           // true if AI suggested a new category
  suggestedCategoryName: string | null;  // the name if isSuggested
  tags: string[];                 // array of tag names/slugs
  confidence: number;
}

const CATEGORIZE_DEFAULTS: CategorizeResult = {
  categorySlug: 'uncategorized',
  isSuggested: false,
  suggestedCategoryName: null,
  tags: [],
  confidence: 0,
};

export async function categorizeContent(
  summary: string,
  existingCategories: Array<{ name: string; slug: string }>,
  popularTags: string[],
): Promise<CategorizeResult> {
  const messages = buildCategorizePrompt(summary, existingCategories, popularTags);

  let responseText: string;
  try {
    const model = await getModel('categorize');
    responseText = await chatCompletion(model, messages, { jsonMode: true });
  } catch (err) {
    console.error('[categorize] chatCompletion failed:', err);
    return { ...CATEGORIZE_DEFAULTS };
  }

  try {
    const parsed = JSON.parse(responseText) as {
      category?: string;
      tags?: string[];
      confidence?: number;
    };

    const rawCategory = parsed.category ?? '';
    let categorySlug = 'uncategorized';
    let isSuggested = false;
    let suggestedCategoryName: string | null = null;

    if (rawCategory.startsWith('suggest:')) {
      isSuggested = true;
      suggestedCategoryName = rawCategory.slice('suggest:'.length).trim();
      categorySlug = 'uncategorized';
    } else if (rawCategory) {
      categorySlug = rawCategory;
    }

    const tags = (Array.isArray(parsed.tags) ? parsed.tags as string[] : []).slice(0, 15);

    return {
      categorySlug,
      isSuggested,
      suggestedCategoryName,
      tags,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    };
  } catch (err) {
    console.error('[categorize] Failed to parse JSON response:', err, '\nRaw:', responseText);
    return { ...CATEGORIZE_DEFAULTS };
  }
}
