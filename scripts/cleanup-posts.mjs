#!/usr/bin/env node
/**
 * Clean up imported blog posts:
 * 1. Remove dead Picasa album links and surrounding "check out pictures" text
 * 2. Remove dead Technorati tag links
 * 3. Remove "Click Here for map" links to dead Google Maps short URLs
 * 4. For remaining blogger.googleusercontent.com image URLs, try to download them
 */

import fs from 'fs';
import path from 'path';

const POSTS_DIR = path.resolve('src/content/posts');
const IMAGES_DIR = path.resolve('public/images/albums/moskoliu-rtw');

const files = fs.readdirSync(POSTS_DIR).filter(f => f.startsWith('rtw-') && f.endsWith('.mdx'));

let totalCleaned = 0;
let totalDownloaded = 0;
let totalFailedDownloads = 0;

for (const file of files) {
  const filepath = path.join(POSTS_DIR, file);
  let content = fs.readFileSync(filepath, 'utf-8');
  const original = content;

  // Remove lines with picasaweb links and surrounding context
  // Pattern: "Check out the pictures here:" followed by picasaweb link
  content = content.replace(/\n*(?:Check out (?:the|our|some|more)? ?pictures?.*\n*)?(?:\[?http:\/\/picasaweb\.google\.com[^\n]*\n*)+/gi, '\n');
  content = content.replace(/\n*(?:Here (?:are|is) (?:the|a) (?:link|album).*\n*)?(?:\[?http:\/\/picasaweb\.google\.com[^\n]*\n*)+/gi, '\n');

  // Remove markdown links to picasaweb
  content = content.replace(/\[([^\]]*)\]\(http:\/\/picasaweb\.google\.com[^)]*\)/g, '');

  // Remove remaining bare picasaweb URLs
  content = content.replace(/http:\/\/picasaweb\.google\.com[^\s\n)]+/g, '');

  // Remove Technorati tag lines
  // Pattern: "Tags: [tag1](technorati...), [tag2](technorati...)"
  content = content.replace(/\n*Tags:\s*(\[.*?\]\(http:\/\/technorati\.com[^)]*\),?\s*)+\n*/g, '\n');

  // Remove "Click Here for map" links (old Google Maps links)
  content = content.replace(/\n*(?:Here (?:where|is where).*(?:map|Map).*:?\n*)?(?:\[Click Here for map[^\]]*\]\([^)]*\)\n*)/gi, '\n');

  // Clean up excessive whitespace at end of file
  content = content.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';

  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`✅ Cleaned: ${file}`);
    totalCleaned++;
  }
}

// Now handle remaining blogger.googleusercontent.com images
console.log('\n--- Checking for remaining external images ---\n');

for (const file of files) {
  const filepath = path.join(POSTS_DIR, file);
  let content = fs.readFileSync(filepath, 'utf-8');

  const bloggerUrls = content.match(/https?:\/\/blogger\.googleusercontent\.com[^)\s]+/g);
  if (!bloggerUrls) continue;

  for (const url of [...new Set(bloggerUrls)]) {
    // Try to download the image
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        // Generate a filename from the post slug
        const slug = file.replace('.mdx', '').replace('rtw-', '');
        const idx = bloggerUrls.indexOf(url);
        const imgFilename = `${slug}-img${idx + 1}.jpg`;
        const imgPath = path.join(IMAGES_DIR, imgFilename);
        fs.writeFileSync(imgPath, buffer);

        const localPath = `/images/albums/moskoliu-rtw/${imgFilename}`;
        content = content.replaceAll(url, localPath);
        console.log(`📥 Downloaded: ${imgFilename}`);
        totalDownloaded++;
      } else {
        console.warn(`⚠ Failed to download (${res.status}): ${url}`);
        totalFailedDownloads++;
      }
    } catch (err) {
      console.warn(`⚠ Error downloading: ${url} - ${err.message}`);
      totalFailedDownloads++;
    }
  }

  fs.writeFileSync(filepath, content, 'utf-8');
}

console.log(`\n🎉 Done! Cleaned ${totalCleaned} files, downloaded ${totalDownloaded} images, ${totalFailedDownloads} failed downloads.`);
