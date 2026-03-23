import { YoutubeTranscript } from 'youtube-transcript';
import type { ExtractedContent } from '@/types/extractors';
import { countWords } from './utils';

const TRANSCRIPT_TIMEOUT_MS = 30_000;
const OEMBED_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the YouTube video ID from a variety of URL formats:
 *   https://www.youtube.com/watch?v=VIDEO_ID
 *   https://youtu.be/VIDEO_ID
 *   https://youtube.com/shorts/VIDEO_ID
 *
 * Throws if no video ID can be extracted.
 */
export function extractVideoId(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Could not extract YouTube video ID from URL');
  }

  const hostname = parsed.hostname.replace(/^www\./, '');

  // youtu.be/VIDEO_ID
  if (hostname === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0];
    if (id) return id;
  }

  // youtube.com/shorts/VIDEO_ID
  if (hostname === 'youtube.com') {
    const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/?]+)/);
    if (shortsMatch) return shortsMatch[1];

    // youtube.com/watch?v=VIDEO_ID
    const v = parsed.searchParams.get('v');
    if (v) return v;
  }

  throw new Error('Could not extract YouTube video ID from URL');
}

interface OEmbedResponse {
  title: string;
  author_name: string;
  thumbnail_url: string;
  provider_name: string;
}

async function fetchOEmbed(videoId: string): Promise<OEmbedResponse> {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OEMBED_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(oembedUrl, { signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`oEmbed request timed out after ${OEMBED_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  }
  clearTimeout(timer);

  if (!response.ok) {
    throw new Error(`oEmbed request failed with HTTP ${response.status}`);
  }
  return response.json() as Promise<OEmbedResponse>;
}

/**
 * Merge transcript segments into readable prose.
 * Segments are joined with spaces and whitespace is normalised.
 */
function cleanTranscript(segments: Array<{ text: string }>): string {
  return segments
    .map((s) => s.text.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Extract transcript and metadata from a YouTube video URL.
 *
 * Returns ExtractedContent with the video title, channel name, and full
 * transcript text. If captions are unavailable the result is marked partial
 * and content is set to an empty string.
 */
export async function extractYoutube(url: string): Promise<ExtractedContent> {
  const videoId = extractVideoId(url);

  // Fetch oEmbed metadata and transcript concurrently. The transcript fetch
  // is wrapped in a 30-second timeout as recommended by the task spec.
  const oembedPromise = fetchOEmbed(videoId);

  const transcriptPromise = Promise.race<Array<{ text: string }>>([
    YoutubeTranscript.fetchTranscript(videoId),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Transcript fetch timed out after ${TRANSCRIPT_TIMEOUT_MS / 1000}s`)),
        TRANSCRIPT_TIMEOUT_MS,
      ),
    ),
  ]);

  // Resolve oEmbed independently — we always want metadata even if the
  // transcript fails.
  const oEmbed = await oembedPromise;

  let content = '';
  let wordCount = 0;
  let partial = false;
  let warning: string | null = null;

  try {
    const segments = await transcriptPromise;
    content = cleanTranscript(segments);
    wordCount = countWords(content);
  } catch (err) {
    // Treat any transcript error as "no captions available" and return a
    // partial result rather than failing the whole extraction.
    console.warn(
      '[youtube-extractor] Transcript unavailable for',
      videoId,
      ':',
      err instanceof Error ? err.message : err,
    );
    partial = true;
    warning = 'No transcript available for this video';
  }

  return {
    title: oEmbed.title,
    author: oEmbed.author_name,
    published_at: null,
    content,
    word_count: wordCount,
    language: null,
    partial,
    warning,
  };
}
