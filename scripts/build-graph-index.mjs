#!/usr/bin/env node
/**
 * Build a graph index of post relationships.
 *
 * Extracts:
 *  - Wikilinks from MDX content ([[slug]] or [[slug|text]])
 *  - Shared tags between posts
 *  - Category groupings
 *
 * Outputs: src/lib/graph-index.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(__dirname, '..', 'src', 'content', 'posts');
const OUTPUT = path.join(__dirname, '..', 'src', 'lib', 'graph-index.json');

// Read all MDX files
const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));

const nodes = [];
const edges = [];
const edgeSet = new Set(); // prevent duplicates

function addEdge(source, target, type, meta = {}) {
  const key = [source, target].sort().join('::') + '::' + type;
  if (edgeSet.has(key)) return;
  edgeSet.add(key);
  edges.push({ source, target, type, ...meta });
}

// Parse frontmatter from raw MDX text
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  let currentKey = null;
  let currentArray = null;

  for (const line of match[1].split('\n')) {
    // Array item
    const arrayItem = line.match(/^\s+-\s+(.+)/);
    if (arrayItem && currentKey) {
      if (!currentArray) currentArray = [];
      currentArray.push(arrayItem[1].replace(/^["']|["']$/g, '').trim());
      fm[currentKey] = currentArray;
      continue;
    }

    // Key-value pair
    const kv = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (kv) {
      // Save previous array
      currentKey = kv[1];
      currentArray = null;
      let val = kv[2].trim().replace(/^["']|["']$/g, '').trim();
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      fm[currentKey] = val || '';
    }
  }
  return fm;
}

// Extract wikilinks from MDX content (after frontmatter)
function extractWikilinks(content) {
  const body = content.replace(/^---\n[\s\S]*?\n---/, '');
  const links = [];
  const re = /\[\[([^\]|]+?)(?:\|[^\]]+?)?\]\]/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    let slug = m[1].trim();
    // Strip .mdx extension if present
    slug = slug.replace(/\.mdx$/, '');
    // Normalize: lowercase, replace spaces with hyphens
    slug = slug.toLowerCase().replace(/\s+/g, '-');
    links.push(slug);
  }
  return [...new Set(links)];
}

// Build nodes
const postsBySlug = {};
for (const file of files) {
  const slug = file.replace(/\.mdx$/, '');
  const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
  const fm = parseFrontmatter(content);
  const wikilinks = extractWikilinks(content);

  const categories = Array.isArray(fm.categories)
    ? fm.categories
    : fm.categories
      ? [fm.categories]
      : [];

  const tags = Array.isArray(fm.tags) ? fm.tags : fm.tags ? [fm.tags] : [];

  const node = {
    id: slug,
    title: fm.title || slug,
    category: categories[0] || 'musings',
    categories,
    tags,
    date: fm.date || '',
    featured: fm.featured === true,
    image: fm.image || '',
    wikilinks,
  };

  nodes.push(node);
  postsBySlug[slug] = node;
}

// Build edges
for (const node of nodes) {
  // 1. Wikilink edges
  for (const target of node.wikilinks) {
    if (postsBySlug[target]) {
      addEdge(node.id, target, 'wikilink');
    }
  }

  // 2. Shared tag edges
  for (const other of nodes) {
    if (other.id <= node.id) continue; // avoid duplicates
    const sharedTags = node.tags.filter((t) => other.tags.includes(t));
    if (sharedTags.length > 0) {
      addEdge(node.id, other.id, 'tag', { shared: sharedTags });
    }
  }
}

// Strip wikilinks from node output (not needed in the frontend)
const outputNodes = nodes.map(({ wikilinks, ...rest }) => rest);

const graph = { nodes: outputNodes, edges };

fs.writeFileSync(OUTPUT, JSON.stringify(graph), 'utf-8');
console.log(
  `Graph index built: ${nodes.length} nodes, ${edges.length} edges → ${OUTPUT}`
);
