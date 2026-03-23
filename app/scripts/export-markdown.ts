/**
 * CLI script: export all completed markdown files to an arbitrary output directory.
 *
 * Usage:
 *   npm run export:markdown -- --output /path/to/folder
 *
 * This copies the entire KNOWLEDGE_DIR (including _index.json and all category
 * sub-folders) to the specified output path using fs.cpSync.
 */

import fs from 'fs';
import path from 'path';

// Parse --output flag from process.argv
function parseOutputFlag(): string | null {
  const args = process.argv.slice(2);
  const idx = args.indexOf('--output');
  if (idx !== -1 && args[idx + 1]) {
    return args[idx + 1];
  }
  return null;
}

async function main(): Promise<void> {
  const outputArg = parseOutputFlag();
  if (!outputArg) {
    console.error('Error: --output <directory> is required');
    console.error('Usage: npm run export:markdown -- --output /path/to/folder');
    process.exit(1);
  }

  const outputDir = path.resolve(outputArg);

  // Import KNOWLEDGE_DIR lazily so the module can be loaded with tsx without
  // requiring a running Next.js environment.
  const { KNOWLEDGE_DIR } = await import('../src/lib/export/config');

  // Check that KNOWLEDGE_DIR exists and has content
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.error(`KNOWLEDGE_DIR does not exist: ${KNOWLEDGE_DIR}`);
    console.error('Run the ingest pipeline or POST /api/export/rebuild first.');
    process.exit(1);
  }

  console.log(`Copying markdown knowledge base...`);
  console.log(`  Source : ${KNOWLEDGE_DIR}`);
  console.log(`  Dest   : ${outputDir}`);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.cpSync(KNOWLEDGE_DIR, outputDir, { recursive: true });

  // Count files written for summary
  function countFiles(dir: string): number {
    let count = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        count += countFiles(path.join(dir, entry.name));
      } else {
        count++;
      }
    }
    return count;
  }

  const total = countFiles(outputDir);
  console.log(`Done. ${total} file(s) exported to ${outputDir}`);
}

main().catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});
