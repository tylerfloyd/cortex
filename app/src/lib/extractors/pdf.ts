import fs from 'node:fs';
import path from 'node:path';
import os from 'os';
import type { ExtractedContent } from '@/types/extractors';
import { countWords } from './utils';

// pdf-parse has no @types package — use require to avoid TS errors
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');

const DOWNLOAD_TIMEOUT_MS = 30_000;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const SCANNED_PDF_WORD_THRESHOLD = 20;
const TEMP_DIR = path.join(os.tmpdir(), 'cortex-pdfs');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalize extracted PDF text: collapse excessive blank lines and trim
 * runs of whitespace within lines.
 */
function cleanText(raw: string): string {
  return raw
    .replace(/[ \t]+/g, ' ')          // collapse horizontal whitespace
    .replace(/\r\n/g, '\n')           // normalize CRLF
    .replace(/\r/g, '\n')             // normalize legacy CR
    .replace(/\n{3,}/g, '\n\n')       // collapse 3+ blank lines to 2
    .trim();
}

/**
 * Ensure the temp directory exists, creating it if necessary.
 */
function ensureTempDir(): void {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

/**
 * Download a PDF from `url` to a temp file and return the file path and buffer.
 * Keeps the file on disk for potential future OCR use.
 * Throws if the file exceeds MAX_FILE_SIZE_BYTES or the request times out.
 */
async function downloadPdf(url: string): Promise<{ filePath: string; buffer: Buffer }> {
  ensureTempDir();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`PDF download timed out after ${DOWNLOAD_TIMEOUT_MS / 1000}s`);
    }
    throw err;
  }
  clearTimeout(timer);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching PDF: ${url}`);
  }

  // Check Content-Length before streaming when available
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_FILE_SIZE_BYTES) {
    throw new Error('PDF file size exceeds 50MB limit');
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new Error('PDF file size exceeds 50MB limit');
  }

  // Write to a unique temp file (kept for future OCR use)
  const filename = `pdf-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;
  const filePath = path.join(TEMP_DIR, filename);
  fs.writeFileSync(filePath, buffer);

  return { filePath, buffer };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Download and extract text from a PDF at the given URL.
 *
 * - Files >50 MB throw immediately.
 * - Password-protected PDFs throw with a descriptive message.
 * - Image-based (scanned) PDFs return a partial result with a warning.
 * - Temp files are always cleaned up, even on error.
 */
export async function extractPdf(url: string): Promise<ExtractedContent> {
  const { filePath, buffer } = await downloadPdf(url);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any;
    try {
      data = await pdfParse(buffer);
    } catch (parseErr) {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      // pdf-parse throws when it encounters an encrypted/password-protected PDF
      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypt')) {
        throw new Error('PDF is password-protected');
      }
      throw parseErr;
    }

    const rawText: string = data.text ?? '';
    const content = cleanText(rawText);
    const wordCount = countWords(content);

    // Heuristic: scanned / image-based PDFs have almost no extractable text
    const isScanned = wordCount < SCANNED_PDF_WORD_THRESHOLD;

    // Extract metadata when available
    const title: string | null = data.info?.Title?.trim() || null;
    const author: string | null = data.info?.Author?.trim() || null;

    return {
      title,
      author,
      published_at: null,
      content,
      word_count: wordCount,
      language: null,
      partial: isScanned,
      warning: isScanned
        ? 'PDF may be image-based (scanned). OCR not supported.'
        : null,
    };
  } finally {
    // Always clean up the temp file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupErr) {
      console.warn('[pdf-extractor] Failed to clean up temp file:', filePath, cleanupErr);
    }
  }
}
