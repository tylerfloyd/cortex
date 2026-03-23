import { chatCompletion, getModel } from './openrouter';
import { buildSummarizePrompt } from './prompts';

const MAX_CONTENT_LENGTH = 100_000;

export interface SummarizeResult {
  summary: string;
  keyInsights: string[];
  suggestedTitle: string | null;
  contentType: string;
  difficultyLevel: string;
  estimatedReadTimeMinutes: number;
}

const SUMMARIZE_DEFAULTS: SummarizeResult = {
  summary: '',
  keyInsights: [],
  suggestedTitle: null,
  contentType: 'reference',
  difficultyLevel: 'intermediate',
  estimatedReadTimeMinutes: 5,
};

export async function summarizeContent(rawContent: string): Promise<SummarizeResult> {
  let content = rawContent;
  if (content.length > MAX_CONTENT_LENGTH) {
    content = content.slice(0, MAX_CONTENT_LENGTH);
    console.log(
      `[summarize] Content truncated from ${rawContent.length} to ${MAX_CONTENT_LENGTH} characters`,
    );
  }

  const messages = buildSummarizePrompt(content);

  let responseText: string;
  try {
    const model = await getModel('summarize');
    responseText = await chatCompletion(model, messages, { jsonMode: true });
  } catch (err) {
    console.error('[summarize] chatCompletion failed:', err);
    return { ...SUMMARIZE_DEFAULTS };
  }

  try {
    const parsed = JSON.parse(responseText) as {
      summary?: string;
      key_insights?: string[];
      suggested_title?: string | null;
      content_type?: string;
      difficulty_level?: string;
      estimated_read_time_minutes?: number;
    };

    return {
      summary: parsed.summary ?? SUMMARIZE_DEFAULTS.summary,
      keyInsights: Array.isArray(parsed.key_insights) ? parsed.key_insights : SUMMARIZE_DEFAULTS.keyInsights,
      suggestedTitle: parsed.suggested_title ?? null,
      contentType: parsed.content_type ?? SUMMARIZE_DEFAULTS.contentType,
      difficultyLevel: parsed.difficulty_level ?? SUMMARIZE_DEFAULTS.difficultyLevel,
      estimatedReadTimeMinutes:
        typeof parsed.estimated_read_time_minutes === 'number'
          ? parsed.estimated_read_time_minutes
          : SUMMARIZE_DEFAULTS.estimatedReadTimeMinutes,
    };
  } catch (err) {
    console.error('[summarize] Failed to parse JSON response:', err, '\nRaw:', responseText);
    return { ...SUMMARIZE_DEFAULTS };
  }
}
