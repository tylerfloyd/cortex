import type { ExtractedContent } from '@/types/extractors';
import { countWords } from './utils';

const JINA_BASE_URL = 'https://r.jina.ai/';
const OEMBED_URL = 'https://publish.twitter.com/oembed';
const TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Strip HTML tags from a string, collapsing whitespace.
 * Used to extract plain text from oEmbed HTML snippets.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Primary: Jina Reader API
// ---------------------------------------------------------------------------

async function extractViaJina(url: string): Promise<{ content: string; author: string | null }> {
  const jinaUrl = `${JINA_BASE_URL}${url}`;
  const apiKey = process.env.JINA_API_KEY;

  const headers: Record<string, string> = {
    Accept: 'text/markdown',
    'X-Return-Format': 'markdown',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(jinaUrl, { headers, signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Jina request timed out after ${TIMEOUT_MS / 1000}s`);
    }
    throw err;
  }
  clearTimeout(timer);

  if (!response.ok) {
    throw new Error(`Jina Reader returned HTTP ${response.status}`);
  }

  const markdown = await response.text();

  if (!markdown || markdown.trim().length === 0) {
    throw new Error('Jina returned empty content');
  }

  // Attempt to parse author from the first heading line (Jina often emits
  // "# @handle: tweet text" for Twitter content)
  let author: string | null = null;
  const headingMatch = markdown.match(/^#\s+@([\w]+)/m);
  if (headingMatch) {
    author = `@${headingMatch[1]}`;
  }

  return { content: markdown, author };
}

// ---------------------------------------------------------------------------
// Fallback: Twitter oEmbed API
// ---------------------------------------------------------------------------

interface OEmbedResponse {
  html: string;
  author_name: string;
  author_url: string;
}

async function extractViaOEmbed(url: string): Promise<{ content: string; author: string | null }> {
  const oembedUrl = `${OEMBED_URL}?url=${encodeURIComponent(url)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(oembedUrl, { signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`oEmbed request timed out after ${TIMEOUT_MS / 1000}s`);
    }
    throw err;
  }
  clearTimeout(timer);

  if (response.status === 404) {
    throw new Error('Tweet not found or has been deleted (oEmbed 404)');
  }
  if (response.status === 403) {
    throw new Error('Tweet is from a private account (oEmbed 403)');
  }
  if (!response.ok) {
    throw new Error(`oEmbed returned HTTP ${response.status}`);
  }

  const data = (await response.json()) as OEmbedResponse;
  const content = stripHtml(data.html);
  const author = data.author_name ?? null;

  if (!content || content.trim().length === 0) {
    throw new Error('oEmbed returned empty content');
  }

  return { content, author };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Extract tweet/thread content from a Twitter/X URL.
 *
 * Twitter extraction is inherently unreliable due to authentication walls and
 * rate limiting. This function NEVER throws — it always returns something,
 * marking the result as partial if no content could be retrieved.
 *
 * Extraction order:
 *   1. Jina Reader API (best quality, handles threads)
 *   2. Twitter oEmbed API (fallback, single tweet only)
 *   3. Return empty partial result
 */
export async function extractTwitter(url: string): Promise<ExtractedContent> {
  // --- Primary: Jina ---
  try {
    const { content, author } = await extractViaJina(url);
    return {
      title: null,
      author,
      published_at: null,
      content,
      word_count: countWords(content),
      language: null,
      partial: false,
      warning: null,
    };
  } catch (jinaErr) {
    console.warn(
      '[twitter-extractor] Jina failed, trying oEmbed:',
      jinaErr instanceof Error ? jinaErr.message : jinaErr,
    );
  }

  // --- Fallback: oEmbed ---
  try {
    const { content, author } = await extractViaOEmbed(url);
    return {
      title: null,
      author,
      published_at: null,
      content,
      word_count: countWords(content),
      language: null,
      partial: true,
      warning: 'Thread content may be incomplete (oEmbed fallback used)',
    };
  } catch (oembedErr) {
    const message = oembedErr instanceof Error ? oembedErr.message : String(oembedErr);
    console.warn('[twitter-extractor] oEmbed also failed:', message);

    // Detect specific failure reasons for a more informative warning
    let warning = 'Could not extract tweet content';
    if (message.includes('private') || message.includes('403')) {
      warning = 'Tweet is from a private account and could not be extracted';
    } else if (message.includes('deleted') || message.includes('404')) {
      warning = 'Tweet may have been deleted or is unavailable';
    } else if (message.includes('timed out')) {
      warning = 'Tweet extraction timed out';
    }

    return {
      title: null,
      author: null,
      published_at: null,
      content: '',
      word_count: 0,
      language: null,
      partial: true,
      warning,
    };
  }
}
