import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import type { ExtractedContent } from '@/types/extractors';
import { countWords } from './utils';
import { readApiKeys } from '@/lib/config';

const JINA_BASE_URL = 'https://r.jina.ai/';
const TIMEOUT_MS = 15_000;

// Heuristic: responses with fewer words than this threshold are flagged as
// potentially paywalled or otherwise incomplete. The value is intentionally
// conservative — a real article will almost never be this short. Note that
// this heuristic cannot distinguish between a genuine paywall and a very
// short legitimate article (e.g. a news brief), so it should be treated as
// a soft warning rather than a definitive signal. Override via the
// EXTRACTION_PAYWALL_THRESHOLD environment variable if needed.
const PAYWALL_WORD_THRESHOLD = parseInt(process.env.EXTRACTION_PAYWALL_THRESHOLD ?? '50', 10);

// ---------------------------------------------------------------------------
// SSRF protection
// ---------------------------------------------------------------------------

function isBlockedUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    const lower = hostname.toLowerCase();

    // Block localhost variants
    if (lower === 'localhost' || lower === '0.0.0.0') return true;

    // Block IPv4 loopback
    if (/^127\.\d+\.\d+\.\d+$/.test(lower)) return true;

    // Block AWS metadata and link-local
    if (/^169\.254\./.test(lower)) return true;

    // Block RFC-1918 private ranges
    if (/^10\./.test(lower)) return true;
    if (/^192\.168\./.test(lower)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(lower)) return true;

    // Block IPv6 loopback and private
    if (lower === '::1' || lower === '[::1]') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;

    return false;
  } catch {
    return true; // Block unparseable URLs
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse the title from Jina markdown: the first `# Heading` line.
 * Returns null if no heading is found.
 *
 * Note: this only matches ATX-style H1 headings (`# Title`). Setext-style
 * headings (`Title\n===`) are not recognised. Jina Reader consistently
 * emits ATX-style markdown, so this is sufficient in practice.
 */
function parseTitleFromMarkdown(markdown: string): string | null {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

// ---------------------------------------------------------------------------
// Primary: Jina Reader API
// ---------------------------------------------------------------------------

async function extractViaJina(url: string): Promise<ExtractedContent> {
  const jinaUrl = `${JINA_BASE_URL}${url}`;

  // Prefer config.json key over env var
  let apiKey: string | null | undefined;
  try {
    const keys = await readApiKeys();
    apiKey = keys.jina ?? process.env.JINA_API_KEY;
  } catch {
    apiKey = process.env.JINA_API_KEY;
  }

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
      throw new Error(`Request timed out after ${TIMEOUT_MS / 1000}s`);
    }
    throw err;
  }
  clearTimeout(timer);

  if (response.status === 404) {
    throw new Error(`Article not found (404): ${url}`);
  }
  if (!response.ok) {
    throw new Error(`Jina Reader returned HTTP ${response.status} for ${url}`);
  }

  const markdown = await response.text();

  if (!markdown || markdown.trim().length === 0) {
    throw new Error('No content could be extracted');
  }

  const title = parseTitleFromMarkdown(markdown);
  const wordCount = countWords(markdown);

  // Heuristic: very short responses often indicate a paywall or login wall
  const partial = wordCount < PAYWALL_WORD_THRESHOLD;
  const warning = partial ? 'Content may be paywalled' : null;

  return {
    title,
    author: null,
    published_at: null,
    content: markdown,
    word_count: wordCount,
    language: null,
    partial,
    warning,
  };
}

// ---------------------------------------------------------------------------
// Fallback: @mozilla/readability + jsdom
// ---------------------------------------------------------------------------

async function extractViaReadability(url: string): Promise<ExtractedContent> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CortexBot/1.0; +https://github.com/cortex)',
      },
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${TIMEOUT_MS / 1000}s`);
    }
    throw err;
  }
  clearTimeout(timer);

  if (response.status === 404) {
    throw new Error(`Article not found (404): ${url}`);
  }
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article || !article.textContent || article.textContent.trim().length === 0) {
    throw new Error('No content could be extracted');
  }

  const content = article.textContent.trim();
  const wordCount = countWords(content);
  const partial = wordCount < PAYWALL_WORD_THRESHOLD;
  const warning = partial ? 'Content may be paywalled' : null;

  return {
    title: article.title ?? null,
    author: article.byline ?? null,
    published_at: null,
    content,
    word_count: wordCount,
    language: article.lang ?? null,
    partial,
    warning,
  };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Extract article content from a URL.
 *
 * Tries Jina Reader API first; falls back to local Readability extraction
 * if Jina is unavailable or fails.
 */
export async function extractArticle(url: string): Promise<ExtractedContent> {
  if (isBlockedUrl(url)) {
    throw new Error(`URL is blocked for security reasons: ${url}`);
  }

  try {
    return await extractViaJina(url);
  } catch (jinaErr) {
    console.warn(
      '[article-extractor] Jina failed, falling back to Readability:',
      jinaErr instanceof Error ? jinaErr.message : jinaErr,
    );
  }

  return extractViaReadability(url);
}
