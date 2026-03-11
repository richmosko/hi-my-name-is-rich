#!/usr/bin/env node
// Usage: npm run generate-galleries [-- path/to/dir]
// Recursively scans the given directory (default: public/images/) for
// any subdirectory containing images and generates a manifest.json in
// each one. Preserves existing alt/caption values when regenerating.

import { readdirSync, writeFileSync, existsSync, readFileSync, statSync } from 'fs';
import { join, extname, dirname, resolve, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DEFAULT_DIR = join(PROJECT_ROOT, 'public', 'images');
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// Resolve target directory from argument or default
const arg = process.argv[2];
const targetDir = arg ? resolve(PROJECT_ROOT, arg) : DEFAULT_DIR;

if (!existsSync(targetDir)) {
  console.error(`Directory not found: ${targetDir}`);
  process.exit(1);
}

if (!statSync(targetDir).isDirectory()) {
  console.error(`Not a directory: ${targetDir}`);
  process.exit(1);
}

const relRoot = relative(PROJECT_ROOT, targetDir);
console.log(`Scanning ${relRoot}/ (recursive)`);

let generated = 0;

function processDirectory(dirPath) {
  const entries = readdirSync(dirPath);

  // Find image files in this directory
  const imageFiles = entries
    .filter((f) => {
      const fullPath = join(dirPath, f);
      return statSync(fullPath).isFile() && IMAGE_EXTS.has(extname(f).toLowerCase());
    })
    .sort();

  // Generate manifest if this directory has images
  if (imageFiles.length > 0) {
    const manifestPath = join(dirPath, 'manifest.json');
    const relPath = relative(PROJECT_ROOT, dirPath);

    // Read existing manifest to preserve alt/caption
    const existing = new Map();
    if (existsSync(manifestPath)) {
      try {
        const data = JSON.parse(readFileSync(manifestPath, 'utf-8'));
        for (const img of data.images || []) {
          existing.set(img.src, img);
        }
      } catch {
        // Ignore malformed manifests
      }
    }

    const images = imageFiles.map((f) => {
      const prev = existing.get(f);
      return {
        src: f,
        alt: prev?.alt || '',
        ...(prev?.caption ? { caption: prev.caption } : {}),
      };
    });

    const manifest = JSON.stringify({ images }, null, 2) + '\n';
    writeFileSync(manifestPath, manifest, 'utf-8');
    console.log(`  ${relPath}/manifest.json — ${imageFiles.length} images`);
    generated++;
  }

  // Recurse into subdirectories
  const subdirs = entries.filter((f) => {
    const fullPath = join(dirPath, f);
    return statSync(fullPath).isDirectory();
  });

  for (const subdir of subdirs) {
    processDirectory(join(dirPath, subdir));
  }
}

processDirectory(targetDir);

if (generated === 0) {
  console.log('  No directories with images found.');
} else {
  console.log(`Done! ${generated} manifest${generated === 1 ? '' : 's'} generated.`);
}
