#!/usr/bin/env node
// Usage: npm run new-project -- "My Project Name"

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECTS_DIR = join(__dirname, '..', 'src', 'content', 'projects');

const name = process.argv[2];
if (!name) {
  console.error('Usage: npm run new-project -- "My Project Name"');
  process.exit(1);
}

const slug = name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const filePath = join(PROJECTS_DIR, `${slug}.mdx`);

if (existsSync(filePath)) {
  console.error(`Project already exists: ${filePath}`);
  process.exit(1);
}

if (!existsSync(PROJECTS_DIR)) {
  mkdirSync(PROJECTS_DIR, { recursive: true });
}

const today = new Date().toISOString().split('T')[0];

const template = `---
name: "${name}"
description: ""
excerpt: ""
image: ""
imageAspectRatio: "16/9"
url: "#"
status: active
startDate: ${today}
tasks:
  - title: "First task"
    completed: false
---

Write your project description here.
`;

writeFileSync(filePath, template, 'utf-8');
console.log(`Created: ${filePath}`);
console.log(`ID: ${slug}`);
console.log(`URL: /project/${slug}`);
