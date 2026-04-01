import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import tailwindcss from '@tailwindcss/vite';
import remarkGfm from 'remark-gfm';
import remarkWikiLink from 'remark-wiki-link';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Build a set of project slugs at config time so wiki-links can resolve to /project/
const projectDir = path.resolve(__dirname, 'src/content/projects');
const projectSlugs = new Set(
  fs.existsSync(projectDir)
    ? fs.readdirSync(projectDir)
        .filter((f) => f.endsWith('.mdx'))
        .map((f) => f.replace(/\.mdx$/, ''))
    : []
);

export default defineConfig({
  site: 'https://himynameisrich.com',

  // Default static output — pages are pre-rendered at build time.
  // Individual pages can opt into SSR with `export const prerender = false`.
  // The Node adapter is required for Keystatic admin routes.
  output: 'static',
  adapter: node({ mode: 'standalone' }),

  integrations: [
    react(),
    mdx(),
    sitemap(),
    keystatic(),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
    remarkPlugins: [
      remarkGfm,
      [
        remarkWikiLink,
        {
          aliasDivider: '|',
          pageResolver: (name) => [
            name
              .trim()
              .replace(/\.mdx?$/, '')
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, ''),
          ],
          hrefTemplate: (slug) =>
            projectSlugs.has(slug) ? `/project/${slug}` : `/post/${slug}`,
          wikiLinkClassName: 'internal',
        },
      ],
    ],
  },
});
