import type { ExtractedContent } from '@/types/extractors';
import { countWords } from './utils';

const TIMEOUT_MS = 15_000;
const USER_AGENT = 'CortexBot/1.0 (personal knowledge manager)';
const MAX_COMMENTS = 20;

// ---------------------------------------------------------------------------
// Reddit API response types (minimal)
// ---------------------------------------------------------------------------

interface RedditPost {
  title: string;
  author: string;
  subreddit: string;
  score: number;
  selftext: string;
  url: string;
  is_self: boolean;
  over_18: boolean;
  created_utc: number;
}

interface RedditComment {
  author: string;
  body: string;
  score: number;
  kind?: string;
}

interface RedditListingChild<T> {
  kind: string;
  data: T;
}

interface RedditListing<T> {
  kind: string;
  data: {
    children: RedditListingChild<T>[];
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build the Reddit JSON API URL from a reddit.com post URL.
 * Handles URLs with or without trailing slashes.
 */
function buildJsonUrl(url: string): string {
  // Strip existing query params and trailing slash, then append .json
  const base = url.split('?')[0].replace(/\/$/, '');
  return `${base}.json?limit=${MAX_COMMENTS}`;
}

/**
 * Collect top comments from a Reddit listing, recursively skipping
 * "more" objects and comment trees. Returns at most MAX_COMMENTS entries.
 */
function collectComments(
  children: RedditListingChild<RedditComment>[],
  limit: number,
): RedditComment[] {
  const results: RedditComment[] = [];

  for (const child of children) {
    if (results.length >= limit) break;
    // Skip "more" objects and deleted/auto-mod comments
    if (child.kind !== 't1') continue;
    const c = child.data;
    if (!c.body || c.body === '[deleted]' || c.body === '[removed]') continue;
    results.push(c);
  }

  return results;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function formatAsMarkdown(post: RedditPost, comments: RedditComment[]): string {
  const lines: string[] = [];

  lines.push(`# ${post.title}`);
  lines.push('');
  lines.push(`**Posted by** u/${post.author} in r/${post.subreddit} | Score: ${post.score}`);
  lines.push('');

  if (post.over_18) {
    lines.push('> **Warning: This post is marked NSFW.**');
    lines.push('');
  }

  if (post.is_self) {
    if (post.selftext && post.selftext !== '[deleted]' && post.selftext !== '[removed]') {
      lines.push(post.selftext);
    }
  } else {
    lines.push(`[Link post: ${post.url}]`);
  }

  if (comments.length > 0) {
    lines.push('');
    lines.push('---');
    lines.push('## Top Comments');

    for (const comment of comments) {
      lines.push('');
      lines.push(`**u/${comment.author}** (score: ${comment.score})`);
      lines.push(comment.body);
      lines.push('');
      lines.push('---');
    }
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Extract a Reddit post and its top comments from a reddit.com URL.
 *
 * Uses Reddit's public JSON API (no authentication required for public posts).
 * Returns ExtractedContent with the formatted post and top comments as markdown.
 */
export async function extractReddit(url: string): Promise<ExtractedContent> {
  const parsed = new URL(url);
  if (!parsed.hostname.includes('reddit.com')) {
    throw new Error(`Not a Reddit URL: ${url}`);
  }

  const jsonUrl = buildJsonUrl(url);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(jsonUrl, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Reddit API request timed out after ${TIMEOUT_MS / 1000}s`);
    }
    throw err;
  }
  clearTimeout(timer);

  if (response.status === 404) {
    throw new Error(`Reddit post not found (404): ${url}`);
  }
  if (!response.ok) {
    throw new Error(`Reddit API returned HTTP ${response.status} for ${url}`);
  }

  // Reddit returns a two-element array: [postListing, commentListing]
  const json = (await response.json()) as [
    RedditListing<RedditPost>,
    RedditListing<RedditComment>,
  ];

  const postChildren = json[0]?.data?.children;
  if (!postChildren || postChildren.length === 0) {
    throw new Error('Reddit API returned no post data');
  }

  const post = postChildren[0].data;

  // Detect deleted/removed state
  const isDeleted = post.author === '[deleted]' || post.selftext === '[deleted]';
  const isRemoved = post.selftext === '[removed]';

  const commentChildren = json[1]?.data?.children ?? [];
  const comments = collectComments(
    commentChildren as RedditListingChild<RedditComment>[],
    MAX_COMMENTS,
  );

  const content = formatAsMarkdown(post, comments);
  const wordCount = countWords(content);

  let warning: string | null = null;
  if (isDeleted) {
    warning = 'Post or post body has been deleted';
  } else if (isRemoved) {
    warning = 'Post body has been removed by moderators';
  } else if (post.over_18) {
    warning = 'Post is marked NSFW';
  }

  const partial = isDeleted || isRemoved;

  return {
    title: post.title,
    author: post.author === '[deleted]' ? null : post.author,
    published_at: new Date(post.created_utc * 1000),
    content,
    word_count: wordCount,
    language: null,
    partial,
    warning,
  };
}
