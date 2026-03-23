const URL_REGEX = /https?:\/\/[^\s<>"\\]+/g;

// Extract all HTTP/HTTPS URLs from a Discord message content string
export function extractUrls(content: string): string[] {
  const matches = content.match(URL_REGEX) ?? [];
  return matches.map(url => url.replace(/[.,;:!?)>\]]+$/, ''));
}

// Extract non-URL text (for user_notes)
export function extractNotes(content: string): string {
  return content.replace(URL_REGEX, '').replace(/\s+/g, ' ').trim();
}
