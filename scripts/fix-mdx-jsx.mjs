#!/usr/bin/env node
/**
 * Fix MDX/JSX issues in imported blog posts.
 * MDX treats <word> as JSX components. We need to escape them.
 * Also fix other common MDX parse issues.
 */

import fs from 'fs';
import path from 'path';

const POSTS_DIR = path.resolve('src/content/posts');
const files = fs.readdirSync(POSTS_DIR).filter(f => f.startsWith('rtw-') && f.endsWith('.mdx'));

let totalFixed = 0;

for (const file of files) {
  const filepath = path.join(POSTS_DIR, file);
  let content = fs.readFileSync(filepath, 'utf-8');
  const original = content;

  // Split into frontmatter and body
  const fmMatch = content.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  if (!fmMatch) continue;

  const frontmatter = fmMatch[1];
  let body = fmMatch[2];

  // Escape angle brackets that look like informal tags (not markdown images/links)
  // Match <word> patterns that aren't part of markdown image syntax
  // Common ones: <gasp>, <sigh>, <grin>, <insert>, etc.
  body = body.replace(/<(\/?[a-zA-Z][a-zA-Z0-9_-]*)>/g, (match, tag) => {
    // Skip known HTML tags that MDX should handle
    const validTags = ['br', 'hr', 'em', 'strong', 'b', 'i', 'u', 'p', 'div', 'span',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'blockquote',
      'code', 'pre', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'sup', 'sub'];
    const tagName = tag.replace('/', '').toLowerCase();
    if (validTags.includes(tagName)) return match;
    // Escape it
    return `\\<${tag}\\>`;
  });

  // Also escape standalone < followed by letters that aren't valid HTML
  // e.g., "<3" should be fine, but "<Something" needs escaping if not a valid tag

  content = frontmatter + body;

  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`✅ Fixed JSX issues in: ${file}`);
    totalFixed++;
  }
}

console.log(`\n🎉 Fixed ${totalFixed} files.`);
