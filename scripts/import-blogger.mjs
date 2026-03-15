#!/usr/bin/env node
/**
 * Import posts from moskoliu.blogspot.com into MDX files.
 * Uses the Blogger JSON feed API to fetch all posts,
 * converts HTML content to Markdown, and maps old Picasa
 * image URLs to local images in /images/albums/moskoliu-rtw/.
 */

import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';

const BLOG_FEED_URL = 'https://moskoliu.blogspot.com/feeds/posts/default?alt=json';
const OUTPUT_DIR = path.resolve('src/content/posts');
const LOCAL_IMAGES_DIR = path.resolve('public/images/albums/moskoliu-rtw');

// Build a lookup of local image filenames (lowercased for fuzzy matching)
const localImages = fs.readdirSync(LOCAL_IMAGES_DIR);
const localImagesLower = localImages.map(f => f.toLowerCase());

// Setup turndown (HTML to Markdown converter)
const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

// Custom rule: convert img tags to markdown with local paths
turndown.addRule('images', {
  filter: 'img',
  replacement: (content, node) => {
    const src = node.getAttribute('src') || '';
    const alt = node.getAttribute('alt') || '';
    const localPath = mapImageToLocal(src);
    return `\n\n![${alt}](${localPath})\n\n`;
  }
});

// Custom rule: strip links that wrap images (Picasa/Blogger lightbox links)
turndown.addRule('imageLinks', {
  filter: (node) => {
    return node.nodeName === 'A' && node.querySelector('img');
  },
  replacement: (content, node) => {
    // Just return the inner content (which will be the img processed above)
    return content;
  }
});

/**
 * Try to map a Picasa/Blogger image URL to a local file.
 * Strategy:
 * 1. Extract the filename from the URL
 * 2. Try exact match in local images
 * 3. Try fuzzy match (strip size suffixes, brackets, etc.)
 * 4. Fall back to original URL if no match
 */
function mapImageToLocal(url) {
  if (!url) return url;

  // Extract filename from URL
  let filename;
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    filename = decodeURIComponent(pathParts[pathParts.length - 1]);
  } catch {
    // Not a valid URL, might already be a path
    filename = url.split('/').pop();
  }

  if (!filename) return url;

  // 1. Exact match
  if (localImages.includes(filename)) {
    return `/images/albums/moskoliu-rtw/${filename}`;
  }

  // 2. Case-insensitive match
  const lowerFilename = filename.toLowerCase();
  const ciIdx = localImagesLower.indexOf(lowerFilename);
  if (ciIdx !== -1) {
    return `/images/albums/moskoliu-rtw/${localImages[ciIdx]}`;
  }

  // 3. Fuzzy match - extract the core image name (e.g., IMG_0543)
  // and try to find it in local images
  const coreMatch = filename.match(/(IMG_\d+|DSC_\d+)/i);
  if (coreMatch) {
    const core = coreMatch[1].toUpperCase();
    const match = localImages.find(f => f.toUpperCase().includes(core));
    if (match) {
      return `/images/albums/moskoliu-rtw/${match}`;
    }
  }

  // 4. Try matching without brackets and size suffixes
  const stripped = filename.replace(/\[\d+\]/g, '').replace(/\(\d+\)/g, '').replace(/\d+\.jpg$/i, '.jpg');
  const strippedLower = stripped.toLowerCase();
  const fuzzyIdx = localImagesLower.findIndex(f => {
    const fStripped = f.replace(/\[\d+\]/g, '').replace(/\(\d+\)/g, '').replace(/\d+\.jpg$/i, '.jpg');
    return fStripped === strippedLower;
  });
  if (fuzzyIdx !== -1) {
    return `/images/albums/moskoliu-rtw/${localImages[fuzzyIdx]}`;
  }

  // No match found - keep original URL but log it
  console.warn(`  ⚠ No local match for: ${filename} (from ${url})`);
  return url;
}

/**
 * Fetch all posts from the Blogger JSON feed API
 */
async function fetchAllPosts() {
  const posts = [];
  let startIndex = 1;
  const batchSize = 25;

  while (true) {
    const url = `${BLOG_FEED_URL}&start-index=${startIndex}&max-results=${batchSize}`;
    console.log(`Fetching posts ${startIndex}-${startIndex + batchSize - 1}...`);

    const res = await fetch(url);
    const data = await res.json();

    if (!data.feed.entry || data.feed.entry.length === 0) break;

    for (const entry of data.feed.entry) {
      const title = entry.title.$t;
      const published = entry.published.$t; // ISO 8601
      const content = entry.content.$t; // HTML

      // Get the blog post URL (alternate link)
      const altLink = entry.link?.find(l => l.rel === 'alternate');
      const postUrl = altLink?.href || '';

      // Extract slug from URL
      const urlMatch = postUrl.match(/\/(\d{4})\/(\d{2})\/(.+)\.html$/);
      const slug = urlMatch ? urlMatch[3] : title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      posts.push({
        title,
        published,
        content,
        postUrl,
        slug,
      });
    }

    startIndex += batchSize;
    const totalResults = parseInt(data.feed.openSearch$totalResults.$t);
    if (startIndex > totalResults) break;
  }

  return posts;
}

/**
 * Convert a blog post to MDX format
 */
function postToMdx(post) {
  const date = post.published.split('T')[0]; // YYYY-MM-DD

  // Parse HTML content
  const dom = new JSDOM(post.content);
  const doc = dom.window.document;

  // Find the first image for the post's featured image
  const firstImg = doc.querySelector('img');
  let featuredImage = '';
  if (firstImg) {
    featuredImage = mapImageToLocal(firstImg.getAttribute('src') || '');
  }

  // Convert HTML to Markdown
  let markdown = turndown.turndown(post.content);

  // Clean up excessive whitespace
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

  // Extract a short excerpt from the first paragraph of text
  const textContent = doc.body?.textContent?.trim() || '';
  const excerpt = textContent.substring(0, 160).replace(/\s+/g, ' ').trim();
  const safeExcerpt = excerpt.replace(/"/g, '\\"');

  // Estimate read time (~200 words per minute)
  const wordCount = textContent.split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  // Safe title for frontmatter
  const safeTitle = post.title.replace(/"/g, '\\"');

  const frontmatter = `---
title: "${safeTitle}"
excerpt: "${safeExcerpt}"
date: "${date}"
readTime: "${readTime} min read"
categories:
  - travel
featured: false
image: "${featuredImage}"
authorId: "rich"
---`;

  return `${frontmatter}\n\n${markdown}\n`;
}

/**
 * Generate a unique filename for the post
 */
function postFilename(post) {
  // Prefix with date for ordering, use slug for readability
  const date = post.published.split('T')[0];
  return `rtw-${date}-${post.slug}.mdx`;
}

// Main
async function main() {
  console.log('🌍 Importing blog posts from moskoliu.blogspot.com...\n');

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Fetch all posts
  const posts = await fetchAllPosts();
  console.log(`\n📝 Found ${posts.length} posts. Converting to MDX...\n`);

  let created = 0;
  let imageWarnings = 0;

  for (const post of posts) {
    const filename = postFilename(post);
    const filepath = path.join(OUTPUT_DIR, filename);
    const mdx = postToMdx(post);

    fs.writeFileSync(filepath, mdx, 'utf-8');
    console.log(`✅ ${filename} — "${post.title}"`);
    created++;
  }

  console.log(`\n🎉 Done! Created ${created} MDX files in ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
