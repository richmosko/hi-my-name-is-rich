import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkWikiLink from 'remark-wiki-link'

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
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, ''),
            ],
            // Map resolved slug to blog post route
            hrefTemplate: (slug: string) => `/post/${slug}`,
            // Style class for wikilinks (picked up by MdxComponents <a>)
            wikiLinkClassName: 'internal',
          },
        ],
      ],
    }),
    react(),
  ],
})
