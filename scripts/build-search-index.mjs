#!/usr/bin/env node
// Usage: npm run build-search-index
// Generates a JSON search index from all MDX post content

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(__dirname, '..', 'src', 'content', 'posts');
const OUTPUT = join(__dirname, '..', 'src', 'lib', 'search-index.json');

function extractText(content) {
  // Strip frontmatter
  const body = content.replace(/^---[\s\S]*?---/, '');
  // Strip import statements
  const noImports = body.replace(/^import\s+.*$/gm, '');
  // Strip JSX/HTML tags
  const noTags = noImports.replace(/<[^>]+>/g, ' ');
  // Strip markdown syntax
  const noMd = noTags.replace(/[#*_`\[\]()!|]/g, '');
  // Strip URLs
  const noUrls = noMd.replace(/https?:\/\/\S+/g, '');
  // Collapse whitespace
  return noUrls.replace(/\s+/g, ' ').trim().toLowerCase();
}

const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));
const index = {};

for (const file of files) {
  const slug = file.replace(/\.mdx$/, '');
  const content = readFileSync(join(POSTS_DIR, file), 'utf-8');
  index[slug] = extractText(content);
}

writeFileSync(OUTPUT, JSON.stringify(index), 'utf-8');
console.log(`Search index built: ${Object.keys(index).length} posts → ${OUTPUT}`);
