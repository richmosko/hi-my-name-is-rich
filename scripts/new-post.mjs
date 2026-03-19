#!/usr/bin/env node
// Usage: npm run new-post -- "My Post Title"

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = join(__dirname, '..', 'src', 'content', 'posts');

const title = process.argv[2];
if (!title) {
  console.error('Usage: npm run new-post -- "My Post Title"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const filePath = join(POSTS_DIR, `${slug}.mdx`);

if (existsSync(filePath)) {
  console.error(`Post already exists: ${filePath}`);
  process.exit(1);
}

// Ensure posts directory exists
if (!existsSync(POSTS_DIR)) {
  mkdirSync(POSTS_DIR, { recursive: true });
}

const today = new Date().toISOString().split('T')[0];

const template = `---
title: "${title}"
excerpt: ""
date: "${today}"
readTime: "1 min read"
categories:
  - musings
featured: false
image: "/images/stock/northern-lights-snowy-mountains.jpg"
imageAspectRatio: "16/9"
authorId: "rich"
tags: []
---

Write your post here.
`;

writeFileSync(filePath, template, 'utf-8');
console.log(`Created: ${filePath}`);
console.log(`Slug: ${slug}`);
