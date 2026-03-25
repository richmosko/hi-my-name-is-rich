# Astro Migration Plan

Comprehensive plan for migrating HiMyNameIsRich.com from React + Vite SPA to Astro 6. This migration addresses SEO (the #1 driver), simplifies the architecture, and enables native Keystatic integration.

## Why Migrate

| Current Problem | Astro Solution |
|----------------|---------------|
| **No SEO** — SPA renders empty HTML for crawlers | Static HTML per page, fully crawlable |
| **Keystatic needs a separate Next.js app** | Built-in `@keystatic/astro` integration — same project |
| **Two Docker deployments** (blog + keystatic-admin) | Single deployment handles everything |
| **6.5MB JS bundle** loaded on every page | Zero JS by default, selective hydration via islands |
| **CORS proxy hack** for Vikunja API | Server routes can proxy API calls directly |
| **No draft preview** for Keystatic edits | Possible with SSR routes |
| **Client-side routing** requires nginx `try_files` | File-based routing generates actual HTML files |
| **No sitemap, no meta tags** | `@astrojs/sitemap` + head management in layouts |

## Target Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Astro | 6.x |
| UI Components | React (islands) | 19.x |
| Styling | Tailwind CSS 4 | via `@tailwindcss/vite` |
| Content | MDX via `@astrojs/mdx` | Content Layer API |
| CMS | Keystatic | `@keystatic/astro` |
| Deployment | Coolify (Node adapter) | `@astrojs/node` standalone |
| Comments | Remark42 | Unchanged |
| Tasks | Vikunja | Server-side proxy |

## Architecture Overview

```
Current (React + Vite SPA):
┌─────────────────────────────────────────┐
│  Browser loads index.html (empty shell)  │
│  ↓ Downloads 1.2MB JS bundle            │
│  ↓ React renders everything client-side  │
│  ↓ Every route = same bundle             │
└─────────────────────────────────────────┘

After (Astro 6):
┌─────────────────────────────────────────┐
│  Browser loads /post/my-post.html       │
│  ↓ Full HTML with content (0 JS)         │
│  ↓ Only interactive islands hydrate      │
│  ↓ ~50KB JS for search + constellation   │
│  ↓ Keystatic admin at /keystatic (SSR)   │
└─────────────────────────────────────────┘
```

## Prerequisites

- **Node.js 22+** (Astro 6 requirement — already using 22)
- Familiarity with `.astro` file syntax (HTML-like with a frontmatter script block)
- All current features should be preserved

## Phase 1: Project Setup

### 1.1 Initialize Astro Project

```bash
# Create a new Astro project alongside the current one
npm create astro@latest hi-my-name-is-rich-astro -- --template minimal

# Or init in-place (risky but faster)
npx astro add react mdx tailwindcss node sitemap
```

### 1.2 Install Dependencies

```bash
npm install astro @astrojs/react @astrojs/mdx @astrojs/node @astrojs/sitemap
npm install @tailwindcss/vite
npm install @keystatic/core @keystatic/astro
npm install react react-dom
npm install remark-gfm remark-wiki-link remark-frontmatter
```

### 1.3 Configuration

**`astro.config.mjs`:**
```javascript
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import keystatic from '@keystatic/astro';
import remarkGfm from 'remark-gfm';
import remarkWikiLink from 'remark-wiki-link';

export default defineConfig({
  site: 'https://himynameisrich.com',
  output: 'static', // Default static, opt-in SSR per page
  adapter: node({ mode: 'standalone' }), // Needed for Keystatic admin
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
      [remarkWikiLink, {
        // Configure wiki-link resolution
        hrefTemplate: (permalink) => `/post/${permalink}`,
      }],
    ],
  },
});
```

### 1.4 Content Collections Schema

**`src/content.config.ts`:**
```typescript
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    date: z.string(),
    readTime: z.string().optional(),
    categories: z.array(z.string()),
    featured: z.boolean().default(false),
    image: z.string().optional(),
    imageUpload: z.string().optional(),
    imageAspectRatio: z.string().default('16/9'),
    authorId: z.union([z.string(), z.array(z.string())]),
    tags: z.array(z.string()).default([]),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    excerpt: z.string().optional(),
    image: z.string().optional(),
    imageUpload: z.string().optional(),
    imageAspectRatio: z.string().default('16/9'),
    authorId: z.union([z.string(), z.array(z.string())]).optional(),
    url: z.string().optional(),
    status: z.enum(['active', 'completed']),
    startDate: z.string().optional(),
    completedDate: z.string().optional(),
    vikunjaProjectId: z.number().optional(),
    groupOrder: z.array(z.string()).optional(),
    tasks: z.array(z.object({
      title: z.string(),
      completed: z.boolean().default(false),
      group: z.string().optional(),
    })).default([]),
  }),
});

export const collections = { posts, projects };
```

## Phase 2: File-Based Routing

### Route Mapping

| Current (React Router) | Astro (File-based) |
|------------------------|-------------------|
| `App.tsx` → `<Route path="/" element={<Home />} />` | `src/pages/index.astro` |
| `<Route path="about" element={<About />} />` | `src/pages/about.astro` |
| `<Route path="contributors" element={<Contributors />} />` | `src/pages/contributors.astro` |
| `<Route path="posts" element={<PostsList />} />` | `src/pages/posts/index.astro` |
| `<Route path="travel" element={<PostsList category="travel" />} />` | `src/pages/travel.astro` |
| `<Route path="design" ...>` | `src/pages/design.astro` |
| `<Route path="finance" ...>` | `src/pages/finance.astro` |
| `<Route path="musings" ...>` | `src/pages/musings.astro` |
| `<Route path="cool-shit" ...>` | `src/pages/cool-shit.astro` |
| `<Route path="food" ...>` | `src/pages/food.astro` |
| `<Route path="projects" element={<ProjectsPage />} />` | `src/pages/projects/index.astro` |
| `<Route path="project/:id" element={<ProjectDetail />} />` | `src/pages/project/[id].astro` |
| `<Route path="post/:slug" element={<PostDetail />} />` | `src/pages/post/[slug].astro` |
| `<Route path="constellation" element={<Constellation />} />` | `src/pages/constellation.astro` |
| `<Route path="admin" element={<Admin />} />` | `src/pages/admin.astro` |
| `<Route path="changelog" element={<Changelog />} />` | `src/pages/changelog.astro` |
| Keystatic (separate Next.js app) | `src/pages/keystatic/[...path].astro` (built-in) |

### Example Page Conversion

**Before (React):**
```tsx
// src/pages/PostDetail.tsx
export default function PostDetail() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);
  if (!post) return <div>Not found</div>;
  const Content = post.content;
  return <article><Content /></article>;
}
```

**After (Astro):**
```astro
---
// src/pages/post/[slug].astro
import { getCollection, render } from 'astro:content';
import Layout from '../../layouts/Layout.astro';
import LightboxImage from '../../components/LightboxImage';

export async function getStaticPaths() {
  const posts = await getCollection('posts');
  return posts.map(post => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---

<Layout title={post.data.title}>
  <article>
    <h1>{post.data.title}</h1>
    <Content components={{ img: LightboxImage }} />
  </article>
</Layout>
```

## Phase 3: Component Migration

### Component Classification

**Pure Astro (no client JS needed):**

| Component | Notes |
|-----------|-------|
| Layout.tsx → Layout.astro | Main layout wrapper |
| Footer.tsx → Footer.astro | Static footer |
| PostCard.tsx → PostCard.astro | Presentational card |
| YouTube.tsx → YouTube.astro | Static iframe embed |
| ScrollToTop.tsx | **Remove** — use Astro View Transitions instead |
| ConstellationIcon.tsx → ConstellationIcon.astro | SVG icon |

**React Islands (keep as .tsx, add `client:*` directives):**

| Component | Directive | Reason |
|-----------|----------|--------|
| ConstellationGraph.tsx | `client:visible` | Heavy canvas interaction |
| SearchOverlay.tsx | `client:idle` | Search needs JS |
| Sidebar.tsx | `client:load` | Mobile nav toggle |
| TopBar.tsx | `client:load` | Theme toggle, dropdown |
| Gallery.tsx | `client:visible` | Lightbox + scroll |
| LightboxImage.tsx | `client:visible` | Click to expand |
| Video.tsx | `client:visible` | Playback controls |
| Comments.tsx | `client:visible` | Remark42 embed |
| CategoryFilter.tsx | `client:load` | Filter interaction |
| TagFilter.tsx | `client:load` | Filter interaction |
| KanbanBoard.tsx | `client:visible` | Drag-drop |
| GanttChart.tsx | `client:visible` | Chart rendering |

### Using React Islands in Astro

```astro
---
// src/pages/constellation.astro
import Layout from '../layouts/Layout.astro';
import ConstellationGraph from '../components/ConstellationGraph';
---

<Layout title="Constellation">
  <!-- client:visible = hydrate when scrolled into view -->
  <ConstellationGraph
    client:visible
    autoFit
    interactive
    showWikilinks={true}
    showTags={true}
  />
</Layout>
```

## Phase 4: Data Layer Migration

### Posts

**Before (import.meta.glob):**
```typescript
const postModules = import.meta.glob('../content/posts/*.mdx', { eager: true });
const allPosts = Object.entries(postModules)
  .map(([path, mod]) => parsePost(path, mod))
  .sort((a, b) => new Date(b.date) - new Date(a.date));
```

**After (Content Collections):**
```typescript
import { getCollection } from 'astro:content';
const allPosts = (await getCollection('posts'))
  .sort((a, b) => new Date(b.data.date) - new Date(a.data.date));
```

### Search

The search index script (`scripts/build-search-index.mjs`) continues to work — it reads raw MDX files and outputs JSON. The search UI remains a React island.

Alternatively, Astro 6's Live Content Collections could enable server-side search without a pre-built index.

### Vikunja Integration

**Before (CORS proxy via nginx):**
```nginx
location /api/vikunja/ {
  proxy_pass https://tasks.himynameisrich.com/api/v1/;
}
```

**After (Astro server route):**
```typescript
// src/pages/api/vikunja/[...path].ts
export const prerender = false;

export async function GET({ params, request }) {
  const res = await fetch(
    `https://tasks.himynameisrich.com/api/v1/${params.path}`,
    { headers: { Authorization: `Bearer ${import.meta.env.VIKUNJA_TOKEN}` } }
  );
  return new Response(res.body, { headers: res.headers });
}
```

## Phase 5: Keystatic Integration

### Single-Project Setup

With `@keystatic/astro`, Keystatic lives inside the same Astro project:

```javascript
// astro.config.mjs
import keystatic from '@keystatic/astro';

export default defineConfig({
  integrations: [keystatic()],
  // ...
});
```

```typescript
// keystatic.config.tsx (root of project)
import { config, collection, singleton, fields } from '@keystatic/core';

export default config({
  storage: {
    kind: 'github',
    repo: 'richmosko/hi-my-name-is-rich',
    branchPrefix: 'keystatic/',
  },
  collections: {
    posts: collection({ /* same schema as current */ }),
    projects: collection({ /* same schema as current */ }),
  },
  singletons: {
    authors: singleton({ /* same schema as current */ }),
    siteSettings: singleton({ /* same schema as current */ }),
    categories: singleton({ /* same schema as current */ }),
  },
});
```

The Keystatic admin UI lives at `/keystatic` — no separate deployment needed.

### Draft Mode / Preview

With Keystatic's `branchPrefix: 'keystatic/'`, edits create branches. For preview:

1. Coolify can deploy branch previews at `pr-123.himynameisrich.com`
2. Or use Astro's SSR mode to render draft content from the branch

## Phase 6: SEO

### Meta Tags

```astro
---
// src/layouts/Layout.astro
import siteSettings from '../data/site-settings.json';
const { title, description, image } = Astro.props;
const fullTitle = title ? `${title} | ${siteSettings.siteTitle}` : siteSettings.siteTitle;
const metaDescription = description || siteSettings.metaDescription;
const ogImage = image || siteSettings.ogImage;
---

<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{fullTitle}</title>
    <meta name="description" content={metaDescription} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={metaDescription} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={Astro.url.href} />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="canonical" href={Astro.url.href} />
  </head>
  <body>
    <slot />
  </body>
</html>
```

### Sitemap

The `@astrojs/sitemap` integration auto-generates `sitemap-index.xml` from all static routes.

### Structured Data (JSON-LD)

```astro
<script type="application/ld+json" set:html={JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": post.data.title,
  "datePublished": post.data.date,
  "author": { "@type": "Person", "name": "Rich Mosko" },
  "image": post.data.image,
})} />
```

## Phase 7: View Transitions

Replace React Router's client-side navigation with Astro's View Transitions:

```astro
---
// src/layouts/Layout.astro
import { ClientRouter } from 'astro:transitions';
---

<html>
  <head>
    <ClientRouter />
  </head>
  <body>
    <!-- Constellation persists across page navigations -->
    <div transition:persist="constellation">
      <ConstellationGraph client:visible />
    </div>
    <slot />
  </body>
</html>
```

This gives SPA-like smooth page transitions without a JS router. The constellation canvas can persist across navigations with `transition:persist`.

## Phase 8: Deployment

### New Dockerfile

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_REMARK42_HOST
ARG VIKUNJA_TOKEN
ENV VITE_REMARK42_HOST=$VITE_REMARK42_HOST
ENV VIKUNJA_TOKEN=$VIKUNJA_TOKEN
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

# Runtime env vars for Keystatic GitHub OAuth
ENV KEYSTATIC_GITHUB_CLIENT_ID=${KEYSTATIC_GITHUB_CLIENT_ID}
ENV KEYSTATIC_GITHUB_CLIENT_SECRET=${KEYSTATIC_GITHUB_CLIENT_SECRET}
ENV KEYSTATIC_SECRET=${KEYSTATIC_SECRET}

EXPOSE 4321
ENV HOST=0.0.0.0
ENV PORT=4321
CMD ["node", "dist/server/entry.mjs"]
```

### Deployment Changes

| What | Before | After |
|------|--------|-------|
| Blog frontend | Vite SPA + nginx (port 80) | Astro Node.js server (port 4321) |
| Keystatic admin | Separate Next.js app (port 4444) | Built into Astro at `/keystatic` |
| Coolify apps | 2 (blog + keystatic) | 1 (unified) |
| Docker images | 2 builds | 1 build |
| Nginx config | Custom `nginx.conf` | Not needed (Astro serves directly) |
| CORS proxy | nginx `location /api/vikunja/` | Astro API route |

### Coolify Migration Steps

1. Keep the current blog running
2. Deploy the Astro version as a new Coolify Application
3. Test at a staging URL (e.g., `staging.himynameisrich.com`)
4. Switch the main domain to the Astro app
5. Decommission the old blog + keystatic-admin apps

## Migration Order (Recommended)

Work in a feature branch. Each phase can be tested independently.

### Week 1: Foundation
1. [ ] Init Astro project with all integrations
2. [ ] Create `content.config.ts` with Zod schemas
3. [ ] Verify all 79 MDX posts parse correctly with content collections
4. [ ] Create `Layout.astro` with head, meta tags, theme support
5. [ ] Port `index.css` (Tailwind tokens) unchanged

### Week 2: Pages
6. [ ] Create all static page routes (about, contributors, category pages)
7. [ ] Create `[slug].astro` for post detail with MDX rendering
8. [ ] Create `[id].astro` for project detail
9. [ ] Wire up prev/next post navigation
10. [ ] Add sitemap integration

### Week 3: Interactive Components
11. [ ] Port ConstellationGraph as React island
12. [ ] Port SearchOverlay as React island
13. [ ] Port Sidebar + TopBar as React islands
14. [ ] Port Gallery, Lightbox, Video as React islands
15. [ ] Port Comments (Remark42) as React island

### Week 4: Integrations
16. [ ] Set up Keystatic with `@keystatic/astro`
17. [ ] Create Vikunja API proxy routes
18. [ ] Port admin dashboard
19. [ ] Port changelog page
20. [ ] Add View Transitions

### Week 5: Deploy & Cutover
21. [ ] Create Dockerfile with Node adapter
22. [ ] Deploy to Coolify as staging
23. [ ] Test all pages, search, constellation, comments
24. [ ] Test Keystatic admin (create/edit post)
25. [ ] Switch main domain
26. [ ] Decommission old apps

## Files to Delete After Migration

These files are no longer needed with Astro:

- `src/main.tsx` — Astro handles the root
- `src/App.tsx` — replaced by file-based routing
- `src/components/ScrollToTop.tsx` — replaced by View Transitions
- `vite.config.ts` — replaced by `astro.config.mjs`
- `index.html` — Astro generates HTML
- `nginx.conf` — Astro serves directly
- `docker/nginx.conf` — same
- `keystatic-server.mjs` — replaced by `@keystatic/astro`
- `keystatic-admin/` — entire directory (merged into main project)
- `src/pages/KeystaticAdmin.tsx` — already deleted
- `postcss.config.js` — Tailwind v4 via Vite plugin

## Files That Stay Unchanged

- `src/content/posts/*.mdx` — all MDX content files
- `src/content/projects/*.mdx` — project files
- `src/data/*.json` — data files
- `src/components/ConstellationGraph.tsx` — React island (unchanged)
- `src/components/Gallery.tsx` — React island
- `src/components/Video.tsx` — React island
- `src/lib/forceLayout.ts` — physics engine
- `src/lib/dateUtils.ts` — utility
- `public/` — all static assets
- `scripts/` — all build scripts
- `remark42/` — comment system config
- `.github/workflows/ci.yml` — CI pipeline

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| MDX frontmatter incompatibility | Zod schema validates all 79 posts at build time; fix issues before deploying |
| Wiki-link resolution changes | Test all internal links; use same remark-wiki-link plugin |
| Constellation graph breaks | It's a React island — same code, just wrapped in `client:visible` |
| Search breaks | Same search-index.json, same React search component |
| Remark42 comments break | Same `Comments.tsx` island, same embed script |
| Dark mode flash | Astro supports inline `<script>` in `<head>` for theme detection (same pattern we use now) |
| Build time increases | Content collections are 5x faster for Markdown, 2x for MDX |
| Coolify deployment fails | Keep old app running until new one is verified |

## Expected Performance Improvement

| Metric | Current (SPA) | Expected (Astro) |
|--------|--------------|-----------------|
| First Contentful Paint | ~2.5s (waits for 1.2MB JS) | ~0.3s (HTML ready) |
| Largest Contentful Paint | ~3.5s | ~0.8s |
| Total Blocking Time | ~800ms | ~50ms |
| JS Bundle (non-interactive pages) | 1.2MB | 0 KB |
| JS Bundle (constellation page) | 1.2MB | ~200KB (just the island) |
| Lighthouse Performance | ~60-70 | ~95-100 |
| SEO (Google indexable) | No | Yes |
| Time to Interactive | ~4s | ~0.5s |

## References

- [Astro 6.0 Release](https://astro.build/blog/astro-6/)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Astro React Integration](https://docs.astro.build/en/guides/integrations-guide/react/)
- [Astro MDX Integration](https://docs.astro.build/en/guides/integrations-guide/mdx/)
- [Keystatic + Astro](https://keystatic.com/docs/installation-astro)
- [Astro View Transitions](https://docs.astro.build/en/guides/view-transitions/)
- [Astro Sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [Astro Node Adapter](https://docs.astro.build/en/guides/integrations-guide/node/)
