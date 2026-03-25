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

## Production Deployment (GitHub Mode)

### Architecture

The production editor runs as a **separate Next.js application** at `edit.himynameisrich.com`:

```
edit.himynameisrich.com (Coolify Application)
├── Next.js server (port 4444)
├── Keystatic admin UI at /keystatic
├── API routes handle GitHub OAuth + content CRUD
└── Commits changes to richmosko/hi-my-name-is-rich repo
         ↓
    Coolify auto-deploys himynameisrich.com
```

### Step 1: DNS Setup

Add an A record in Cloudflare:

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| A | `edit` | your server IP | DNS only (gray) |

### Step 2: Deploy to Coolify

1. In Coolify, go to **Projects > your project > Add Resource**
2. Select **Private Repository (GitHub App)**
3. Select the `richmosko/hi-my-name-is-rich` repository
4. Configure:
   - **Build Pack**: Docker
   - **Dockerfile Location**: `keystatic-admin/Dockerfile`
   - **Base Directory**: `keystatic-admin`
   - **Port**: `4444`
   - **Domain**: `edit.himynameisrich.com`

### Step 3: Create GitHub App for Keystatic

1. Deploy the app first (it will show an error page — that's OK)
2. Visit `https://edit.himynameisrich.com/keystatic`
3. Keystatic will show a setup wizard — click **"Create GitHub App"**
4. Enter:
   - **Deployment URL**: `https://edit.himynameisrich.com`
   - **Organization**: (leave empty for personal account)
5. Follow GitHub's app creation flow
6. Grant the app access to the `hi-my-name-is-rich` repo

### Step 4: Configure Environment Variables

After creating the GitHub App, Keystatic provides credentials. Add them in Coolify as **build + runtime variables**:

| Variable | Source |
|----------|--------|
| `KEYSTATIC_GITHUB_CLIENT_ID` | GitHub App credentials |
| `KEYSTATIC_GITHUB_CLIENT_SECRET` | GitHub App credentials |
| `KEYSTATIC_SECRET` | Generate with `openssl rand -base64 32` |
| `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | The slug of your GitHub App (shown in the URL) |

### Step 5: Redeploy

Redeploy the Coolify application so it picks up the environment variables.

### Step 6: Test

1. Visit `https://edit.himynameisrich.com`
2. You'll be redirected to GitHub OAuth login
3. After authenticating, you should see the Keystatic admin with all your posts
4. Try editing a post and saving — it should commit to GitHub
5. Check that Coolify auto-deploys the blog

### Draft / Branch Workflow

The config uses `branchPrefix: 'keystatic/'`, which enables:

1. **Create a draft** — save to a new branch (e.g., `keystatic/my-new-post`)
2. **Edit the draft** — keep editing, each save is a commit on that branch
3. **Preview** — pull the branch locally and `npm run dev` to preview
4. **Publish** — Keystatic creates a PR → you merge to `main` → Coolify deploys

### Security

- Only GitHub users with **write access** to the repo can edit content
- OAuth tokens are scoped to the specific GitHub App
- The `KEYSTATIC_SECRET` encrypts session cookies
- No anonymous access — authentication is required

## Current Status

**Phase 1 — Research** ✅
- Confirmed Keystatic supports all field types
- Identified SPA integration challenge
- Designed hybrid architecture

**Phase 2 — Local Dev** ✅
- Installed `@keystatic/core`
- Created `keystatic.config.tsx` with post + project schemas
- Keystatic API server (`keystatic-server.mjs`) for local mode
- Vite proxy for seamless dev experience
- Admin UI at `localhost:5173/keystatic` working

**Phase 3 — Production Deployment** 🔄
- Created `keystatic-admin/` Next.js app for GitHub mode
- Dockerfile for Coolify deployment
- DNS setup for `edit.himynameisrich.com`
- GitHub App creation and OAuth configuration

**Phase 4 — Polish** (Pending)
- Test full edit → commit → deploy workflow
- Test draft/branch workflow
- Verify all field types work in GitHub mode
- Image handling refinements

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CMS | Keystatic | Git-backed, no DB, rich editor, self-hosted, React-native |
| Dev mode | Local + Node HTTP server | SPA can't serve API routes; generic handler wraps cleanly |
| Prod mode | GitHub mode via Next.js | OAuth + API routes need server; Next.js is Keystatic's primary target |
| Admin hosting | Separate Coolify app (`edit.himynameisrich.com`) | Keeps blog SPA untouched; clean separation of concerns |
| Content format | MDX | Already using MDX; Keystatic has native MDX field support |
| Draft support | Branch-based (`keystatic/` prefix) | Keeps `main` clean; PR workflow for publishing |
| Image handling | Text field (path entry) | `fields.image()` upload hangs on large files; manual path is reliable |
| Auth | GitHub OAuth via GitHub App | Only repo collaborators can edit; no anonymous access |

## References

- [Keystatic Docs — Collections](https://keystatic.com/docs/collections)
- [Keystatic Docs — MDX Field](https://keystatic.com/docs/fields/mdx)
- [Keystatic Docs — GitHub Mode](https://keystatic.com/docs/github-mode)
- [Keystatic Docs — Local Mode](https://keystatic.com/docs/local-mode)
- [Keystatic Docs — Content Components](https://keystatic.com/docs/content-components)
- [Keystatic + Static Sites Discussion](https://github.com/Thinkmill/keystatic/discussions/826)
- [Keystatic GitHub](https://github.com/Thinkmill/keystatic)
