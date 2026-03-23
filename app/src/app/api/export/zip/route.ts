import { NextRequest, NextResponse } from 'next/server';
import AdmZip from 'adm-zip';
import fs from 'fs/promises';
import path from 'path';
import { validateApiKey } from '@/lib/auth/api-key';
import { KNOWLEDGE_DIR } from '@/lib/export/config';

async function collectMarkdownFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    let stat;
    try {
      stat = await fs.stat(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      const sub = await collectMarkdownFiles(full);
      results.push(...sub);
    } else if (entry.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

export async function GET(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  const files = await collectMarkdownFiles(KNOWLEDGE_DIR);

  const zip = new AdmZip();

  for (const filePath of files) {
    const relative = path.relative(KNOWLEDGE_DIR, filePath);
    let content: Buffer;
    try {
      content = await fs.readFile(filePath);
    } catch {
      continue;
    }
    zip.addFile(relative, content);
  }

  const zipBuffer = zip.toBuffer();

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="cortex-knowledge.zip"',
      'Content-Length': String(zipBuffer.length),
    },
  });
}
