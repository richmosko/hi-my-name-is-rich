#!/usr/bin/env node
// Validates frontmatter fields across all post and project MDX files

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.resolve(__dirname, '../src/content/posts');
const projectsDir = path.resolve(__dirname, '../src/content/projects');

const VALID_CATEGORIES = [
  'travel', 'design', 'finance', 'projects', 'musings', 'cool-shit', 'food',
];

let warnings = 0;
let errors = 0;

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  return match[1];
}

function parseYamlList(raw, key) {
  // Match "key:\n  - val1\n  - val2" or "key: val" (single value on same line)
  const listPattern = new RegExp(`^${key}:\\s*\\n((?:\\s+-\\s+.+\\n?)*)`, 'm');
  const listMatch = raw.match(listPattern);
  if (listMatch) {
    return listMatch[1]
      .split('\n')
      .map((l) => l.replace(/^\s+-\s+/, '').trim())
      .filter(Boolean);
  }

  // Single value on same line: "key: value"
  const inlinePattern = new RegExp(`^${key}:\\s+(.+)$`, 'm');
  const inlineMatch = raw.match(inlinePattern);
  if (inlineMatch) {
    const val = inlineMatch[1].trim().replace(/^["']|["']$/g, '');
    return val ? [val] : [];
  }

  return [];
}

function validatePosts() {
  if (!fs.existsSync(postsDir)) return;
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.mdx'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(postsDir, file), 'utf-8');
    const fm = parseFrontmatter(content);
    if (!fm) {
      console.log(`  ⚠️  ${file}: no frontmatter found`);
      warnings++;
      continue;
    }

    // Validate categories
    const categories = parseYamlList(fm, 'categories');
    if (categories.length === 0) {
      console.log(`  ⚠️  ${file}: no categories defined`);
      warnings++;
    }
    for (const cat of categories) {
      if (!VALID_CATEGORIES.includes(cat)) {
        console.log(`  ❌ ${file}: unknown category "${cat}" (valid: ${VALID_CATEGORIES.join(', ')})`);
        errors++;
      }
    }

    // Check if categories is a bare string instead of a YAML list (common typo)
    // e.g. "categories: musings" instead of "categories:\n  - musings"
    // Must not start with a dash (which would be inline YAML array) and must be a word
    const inlineMatch = fm.match(/^categories:\s+([a-zA-Z].*)$/m);
    if (inlineMatch) {
      console.log(`  ⚠️  ${file}: categories should be a YAML list, not inline "${inlineMatch[1].trim()}"`);
      warnings++;
    }

    // Validate required fields
    const requiredFields = ['title', 'excerpt', 'date', 'authorId'];
    for (const field of requiredFields) {
      const fieldPattern = new RegExp(`^${field}:`, 'm');
      if (!fieldPattern.test(fm)) {
        console.log(`  ⚠️  ${file}: missing required field "${field}"`);
        warnings++;
      }
    }
  }
}

function validateProjects() {
  if (!fs.existsSync(projectsDir)) return;
  const files = fs.readdirSync(projectsDir).filter((f) => f.endsWith('.mdx'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(projectsDir, file), 'utf-8');
    const fm = parseFrontmatter(content);
    if (!fm) {
      console.log(`  ⚠️  ${file}: no frontmatter found`);
      warnings++;
      continue;
    }

    const requiredFields = ['name', 'description', 'status'];
    for (const field of requiredFields) {
      const fieldPattern = new RegExp(`^${field}:`, 'm');
      if (!fieldPattern.test(fm)) {
        console.log(`  ⚠️  ${file}: missing required field "${field}"`);
        warnings++;
      }
    }
  }
}

validatePosts();
validateProjects();

if (errors > 0) {
  console.log(`\n${errors} error(s), ${warnings} warning(s)`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`\n${warnings} warning(s), 0 errors`);
} else {
  console.log('All frontmatter valid');
}
