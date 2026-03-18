#!/usr/bin/env node
// Usage: npm run update-read-times
// Calculates and updates readTime in frontmatter for all .mdx posts

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(__dirname, '..', 'src', 'content', 'posts');
const WORDS_PER_MINUTE = 225;

function calculateReadTime(content) {
  // Strip frontmatter
  const body = content.replace(/^---[\s\S]*?---/, '');
  // Strip MDX/JSX tags, markdown syntax, and import statements
  const text = body
    .replace(/^import\s+.*$/gm, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[#*_`\[\]()!|]/g, '')
    .replace(/https?:\/\/\S+/g, '');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));
let updated = 0;

for (const file of files) {
  const filePath = join(POSTS_DIR, file);
  const content = readFileSync(filePath, 'utf-8');
  const readTime = calculateReadTime(content);

  let newContent;
  if (/^readTime:.*$/m.test(content)) {
    // Update existing readTime
    newContent = content.replace(/^readTime:.*$/m, `readTime: "${readTime}"`);
  } else {
    // Insert readTime after date line
    newContent = content.replace(/^(date:.*$)/m, `$1\nreadTime: "${readTime}"`);
  }

  if (newContent !== content) {
    writeFileSync(filePath, newContent, 'utf-8');
    updated++;
  }
}

console.log(`Updated readTime for ${updated}/${files.length} posts.`);
