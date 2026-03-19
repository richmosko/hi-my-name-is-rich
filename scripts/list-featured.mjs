#!/usr/bin/env node
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const postsDir = join(process.cwd(), 'src/content/posts');
const files = readdirSync(postsDir).filter((f) => f.endsWith('.mdx'));

const featured = [];

for (const file of files) {
  const content = readFileSync(join(postsDir, file), 'utf-8');
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) continue;

  const fm = fmMatch[1];
  if (/^featured:\s*true$/m.test(fm)) {
    const title = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? file;
    const date = fm.match(/^date:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? '';
    featured.push({ file, title, date });
  }
}

featured.sort((a, b) => new Date(b.date) - new Date(a.date));

console.log(`\n  Featured posts (${featured.length}):\n`);
for (const { file, title, date } of featured) {
  console.log(`    ${date.slice(0, 10).padEnd(12)} ${title}`);
  console.log(`    ${''.padEnd(12)} ${file}\n`);
}

console.log(`  Note: Only the 3 most recent are shown on the home page.\n`);
