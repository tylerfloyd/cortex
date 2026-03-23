export interface ExtractedContent {
  title: string | null;
  author: string | null;
  published_at: Date | null;
  content: string;        // cleaned markdown or text
  word_count: number;
  language: string | null;
  partial: boolean;       // true if extraction was incomplete (paywall, etc.)
  warning: string | null; // human-readable warning if partial
}
