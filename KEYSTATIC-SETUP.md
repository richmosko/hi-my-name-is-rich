# Keystatic CMS Integration

Chronicle of integrating [Keystatic](https://keystatic.com/) into the blog for browser-based content editing with live preview, frontmatter management, and image uploads.

## Why Keystatic

- **Git-backed** — every edit is a GitHub commit, full version history
- **No database** — reads/writes MDX files directly
- **Rich editor** — WYSIWYG for markdown, typed fields for frontmatter (date pickers, dropdowns, tag arrays, image uploads)
- **Custom components** — can register Gallery, YouTube, Video as insertable blocks
- **Two modes**: local (dev, reads filesystem) and GitHub (production, commits via GitHub API)
- **Draft support** — branch-based drafts before merging to main
- **Self-hosted** — no external SaaS dependency

## Architecture Challenge

Keystatic is designed for meta-frameworks (Next.js, Astro, Remix) that have server-side API routes. Our blog is a **pure client-side Vite React SPA** with no server.

Keystatic needs server-side routes to:
- **Local mode**: Read/write `.mdx` files on disk during development
- **GitHub mode**: Authenticate via GitHub OAuth and commit changes

### Solution: Hybrid Approach

```
Development (local mode):
─────────────────────────
Vite dev server (port 5173)     ←  serves the blog SPA
Keystatic API server (port 3333) ←  serves /keystatic admin UI + API routes
Both read/write src/content/posts/*.mdx on disk

Production (GitHub mode):
─────────────────────────
nginx serves static blog          ←  no Keystatic routes needed for the blog
Keystatic admin (separate route)  ←  uses GitHub API to commit changes
                                     Coolify auto-deploys on push
```

## Step-by-Step Setup

### Step 1: Install Keystatic

```bash
npm install @keystatic/core @keystatic/react
```

**Packages:**
- `@keystatic/core` — config API, field definitions, storage adapters
- `@keystatic/react` — React components for the admin UI

### Step 2: Create Keystatic Config

Create `keystatic.config.tsx` in the project root. This defines the content schema — collections for posts and projects with typed fields matching our existing frontmatter.

```typescript
// keystatic.config.tsx
import { config, collection, fields } from '@keystatic/core';

const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

export default config({
  storage: isProduction
    ? {
        kind: 'github',
        repo: { owner: 'richmosko', name: 'hi-my-name-is-rich' },
      }
    : { kind: 'local' },

  collections: {
    posts: collection({
      label: 'Blog Posts',
      slugField: 'title',
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true }),
        date: fields.datetime({ label: 'Publish Date' }),
        readTime: fields.text({ label: 'Read Time', description: 'Auto-calculated by precommit script' }),
        categories: fields.multiselect({
          label: 'Categories',
          options: [
            { label: 'Travel', value: 'travel' },
            { label: 'Design', value: 'design' },
            { label: 'Finance', value: 'finance' },
            { label: 'Projects', value: 'projects' },
            { label: 'Musings', value: 'musings' },
            { label: 'Cool Shit', value: 'cool-shit' },
            { label: 'Food', value: 'food' },
          ],
        }),
        featured: fields.checkbox({ label: 'Featured', defaultValue: false }),
        image: fields.image({
          label: 'Hero Image',
          directory: 'public/images/stock',
          publicPath: '/images/stock/',
          description: 'Leave empty for default stock image',
        }),
        imageAspectRatio: fields.select({
          label: 'Image Aspect Ratio',
          options: [
            { label: '16:9 (default)', value: '16/9' },
            { label: '4:3', value: '4/3' },
            { label: '1:1', value: '1/1' },
            { label: '21:9 (ultrawide)', value: '21/9' },
          ],
          defaultValue: '16/9',
        }),
        authorId: fields.multiselect({
          label: 'Authors',
          options: [
            { label: 'Rich Mosko', value: 'rich' },
            { label: 'Claude', value: 'claude' },
            { label: 'Keith', value: 'keith' },
          ],
          defaultValue: ['rich'],
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value || 'New tag',
        }),
        content: fields.mdx({
          label: 'Content',
          options: {
            image: {
              directory: 'public/images/stock',
              publicPath: '/images/stock/',
            },
          },
          components: {
            YouTube: {
              label: 'YouTube Embed',
              schema: {
                id: fields.text({ label: 'Video ID' }),
                title: fields.text({ label: 'Title (optional)' }),
              },
              preview: () => null,
            },
            Gallery: {
              label: 'Image Gallery',
              schema: {
                path: fields.text({ label: 'Album Path (e.g., /images/albums/my-trip)' }),
                aspectRatio: fields.text({ label: 'Aspect Ratio', defaultValue: '4/3' }),
              },
              preview: () => null,
            },
            Video: {
              label: 'Video Player',
              schema: {
                src: fields.text({ label: 'Video Source Path' }),
                caption: fields.text({ label: 'Caption (optional)' }),
              },
              preview: () => null,
            },
          },
        }),
      },
    }),

    projects: collection({
      label: 'Projects',
      slugField: 'name',
      path: 'src/content/projects/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      schema: {
        name: fields.slug({ name: { label: 'Project Name' } }),
        description: fields.text({ label: 'Description' }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true }),
        image: fields.image({
          label: 'Hero Image',
          directory: 'public/images/stock',
          publicPath: '/images/stock/',
        }),
        imageAspectRatio: fields.select({
          label: 'Image Aspect Ratio',
          options: [
            { label: '16:9', value: '16/9' },
            { label: '21:9', value: '21/9' },
          ],
          defaultValue: '16/9',
        }),
        url: fields.url({ label: 'Project URL' }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Completed', value: 'completed' },
          ],
          defaultValue: 'active',
        }),
        startDate: fields.date({ label: 'Start Date' }),
        completedDate: fields.date({ label: 'Completed Date' }),
        vikunjaProjectId: fields.integer({
          label: 'Vikunja Project ID',
          description: 'Links to Vikunja task tracker',
        }),
        content: fields.mdx({ label: 'Content' }),
      },
    }),
  },
});
```

### Step 3: Create Keystatic API Server (Local Mode)

Since our app is a pure SPA, we need a small Node server to handle Keystatic's API routes during development.

Create `keystatic-server.mjs` in the project root:

```javascript
// keystatic-server.mjs
// Lightweight Express server for Keystatic local mode
// Run alongside Vite dev server during development

import express from 'express';
import { createHandler } from '@keystatic/core/api';
import config from './keystatic.config.mjs';

const app = express();
const handler = createHandler({ config });

app.use('/api/keystatic', handler);

// Serve the Keystatic admin SPA
app.get('/keystatic*', (req, res) => {
  res.sendFile('keystatic.html', { root: './node_modules/@keystatic/core/dist' });
});

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`Keystatic admin: http://localhost:${PORT}/keystatic`);
});
```

> **Note:** The exact server setup depends on which version of Keystatic is installed and how the API handler is exported. The approach above is conceptual — we may need to adjust based on the actual package structure.

### Step 4: Environment Variables

For GitHub mode (production), create a GitHub App:

1. Visit `/keystatic` on your deployed site
2. Keystatic walks you through creating a GitHub App
3. Save the generated credentials:

```env
KEYSTATIC_GITHUB_CLIENT_ID=...
KEYSTATIC_GITHUB_CLIENT_SECRET=...
KEYSTATIC_SECRET=...
PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=...
```

Add these to Coolify as environment variables on the blog frontend.

### Step 5: Integrate with the Blog

Two options for serving the admin UI in production:

**Option A: Separate Coolify Application**
Deploy a minimal Next.js or Astro app that only serves the Keystatic admin UI at `admin.himynameisrich.com`. This app has server routes for the GitHub API proxy. The blog stays as a pure SPA.

**Option B: Embed in Blog via Vite Plugin**
Create a Vite plugin that:
- In dev mode: proxies `/keystatic` and `/api/keystatic` to the Express server
- In production: serves a pre-built Keystatic SPA at `/keystatic`

### Step 6: GitHub Mode for Production

In production, Keystatic uses the GitHub API to:
1. Read content from the repo
2. Create branches for drafts
3. Commit changes (new posts, edits, image uploads)
4. Trigger Coolify auto-deploy when merged to main

This means no server-side filesystem access is needed in production — the admin UI is a client-side React app that talks directly to GitHub.

## Content Editing Workflow

### Creating a New Post

1. Visit `https://himynameisrich.com/keystatic` (or `admin.himynameisrich.com/keystatic`)
2. Click **Blog Posts > Create**
3. Fill in frontmatter fields:
   - Title (auto-generates slug)
   - Excerpt
   - Date (date picker)
   - Categories (multi-select dropdown)
   - Tags (dynamic array)
   - Featured (checkbox)
   - Hero Image (upload or select)
   - Authors (multi-select)
4. Write content in the WYSIWYG editor
5. Insert custom components (YouTube, Gallery, Video) via the toolbar
6. Click **Save** — commits to GitHub
7. Coolify auto-deploys within ~1 minute

### Editing Existing Posts

1. Visit `/keystatic`
2. Click **Blog Posts**
3. Browse or search for the post
4. Edit fields or content
5. Save → commit → auto-deploy

### Draft Workflow

1. Create a new post
2. Instead of saving to `main`, save to a branch (e.g., `keystatic/new-post-title`)
3. Preview the draft
4. When ready, merge the branch → auto-deploy

## Current Status

**Phase 1 — Research (Complete)**
- Confirmed Keystatic supports all our field types
- Identified the SPA integration challenge
- Designed the hybrid architecture (local server for dev, GitHub mode for prod)

**Phase 2 — Installation & Config (In Progress)**
- Install packages
- Create keystatic.config.tsx with post and project schemas
- Set up local dev server

**Phase 3 — Local Dev Integration (Pending)**
- Create Express server for Keystatic API routes
- Add Vite proxy for `/keystatic` routes
- Test creating/editing posts locally

**Phase 4 — Production Deployment (Pending)**
- Set up GitHub App for OAuth
- Configure GitHub mode in keystatic.config.tsx
- Deploy admin UI (Option A or B)
- Test full workflow: edit → commit → auto-deploy

**Phase 5 — Polish (Pending)**
- Add content components for YouTube, Gallery, Video
- Image upload to correct directories
- Validate frontmatter schema matches existing posts

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CMS | Keystatic | Git-backed, no DB, rich editor, self-hosted, React-native |
| Dev mode | Local + Express server | SPA can't serve API routes; Express is lightweight (~20 lines) |
| Prod mode | GitHub mode | No server needed; commits via GitHub API, auto-deploys via Coolify |
| Admin hosting | TBD (Option A vs B) | Option A is cleaner but requires a separate deploy; Option B is self-contained |
| Content format | MDX | Already using MDX; Keystatic has native MDX field support |

## References

- [Keystatic Docs — Collections](https://keystatic.com/docs/collections)
- [Keystatic Docs — MDX Field](https://keystatic.com/docs/fields/mdx)
- [Keystatic Docs — GitHub Mode](https://keystatic.com/docs/github-mode)
- [Keystatic Docs — Local Mode](https://keystatic.com/docs/local-mode)
- [Keystatic + Static Sites Discussion](https://github.com/Thinkmill/keystatic/discussions/826)
- [Keystatic GitHub](https://github.com/Thinkmill/keystatic)
