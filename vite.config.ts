import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkWikiLink from 'remark-wiki-link'
import fs from 'node:fs'
import path from 'node:path'

// Build a set of project slugs at config time so wiki-links can resolve to /project/
const projectDir = path.resolve(__dirname, 'src/content/projects')
const projectSlugs = new Set(
  fs.existsSync(projectDir)
    ? fs.readdirSync(projectDir)
        .filter((f: string) => f.endsWith('.mdx'))
        .map((f: string) => f.replace(/\.mdx$/, ''))
    : []
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    mdx({
      remarkPlugins: [
        remarkFrontmatter,
        remarkMdxFrontmatter,
        remarkGfm,
        [
          remarkWikiLink,
          {
            // Obsidian uses | for display text: [[slug|Display Text]]
            aliasDivider: '|',
            // Normalize wikilink target to a URL-friendly slug
            pageResolver: (name: string) => [
              name
                .trim()
                .replace(/\.mdx?$/, '') // strip .md/.mdx so Obsidian-style links work
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, ''),
            ],
            // Route to /project/ for project slugs, /post/ for everything else
            hrefTemplate: (slug: string) =>
              projectSlugs.has(slug) ? `/project/${slug}` : `/post/${slug}`,
            // Style class for wikilinks (picked up by MdxComponents <a>)
            wikiLinkClassName: 'internal',
          },
        ],
      ],
    }),
    react(),
  ],
})
