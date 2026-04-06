# CLAUDE.md — Project Context for Claude Code

## Project Overview

Personal blog at **himynameisrich.com** built with **Astro 6** and **React islands**. Content is managed via Keystatic CMS and stored as MDX/YAML in the repo.

## Tech Stack

- **Astro 6** — static site generation with `@astrojs/node` adapter (standalone mode)
- **React 19** — interactive islands hydrated via `client:load`, `client:visible`, `client:idle`, `client:only="react"`
- **Tailwind CSS v4** — via `@tailwindcss/vite` plugin (not PostCSS)
- **Keystatic** — Git-based CMS at `/keystatic`, integrated via `@keystatic/astro`
- **MDX** — blog posts with custom components (Gallery, Video, LightboxImage)
- **Content Collections** — Zod-validated schemas in `src/content.config.ts`
- **View Transitions** — Astro `ClientRouter` with theme re-application on `astro:after-swap`
- **Remark42** — self-hosted comments (custom Docker image with CSS overrides)
- **Linear** — project/issue tracking via GraphQL API, proxied via Astro server route

## Project Structure

```
src/pages/*.astro          — File-based routes (replaces React Router)
src/layouts/*.astro        — Layout wrappers (Layout.astro, MainLayout.astro)
src/components/*.tsx       — React islands (interactive components)
src/components/*.astro     — Astro components (static, server-rendered)
src/content/posts/         — MDX blog posts
src/content/projects/      — MDX project pages
src/pages/api/             — Server-side API routes (SSR, prerender = false)
src/lib/                   — Shared utilities, force layout, search/graph indices
public/images/             — Static images with generated manifest.json files
scripts/                   — Build scripts (new-post, search-index, galleries, etc.)
docs/                      — Deployment and setup documentation
```

## Common Commands

```bash
npm run dev                # Astro dev server on http://localhost:4321
npm run build              # Production build
npm run preview            # Preview production build locally
npm run lint               # ESLint
npm run help               # Show all available commands
npm run new-post -- "Title"    # Create new blog post
npm run new-project -- "Name"  # Create new project
npm run precommit          # Run all pre-commit tasks
```

## Deployment

- **Coolify** on Hetzner ARM64 (CAX11) — Node.js standalone on port 4321
- **Dockerfile** — multi-stage build (node:22-alpine), outputs `dist/server/entry.mjs`
- **Cloudflare** CDN with edge caching
- Push to `main` triggers auto-deploy via Coolify

## Architecture Patterns

### Islands Model
Each React component rendered in an `.astro` page is an independent island with its own JS bundle. They do NOT share runtime state.

- **Do NOT use nanostores or shared stores across islands** — each island gets its own copy, creating duplicate state. Keep related interactive controls inside the same island component.
- Use `useSyncExternalStore` for theme detection (reads `<html class="dark">`) — works across separate islands without a provider.

### Content Collections
- Schemas in `src/content.config.ts` use `loader: glob()` pattern
- Custom `yamlString` and `yamlDate` helpers handle YAML edge cases (null values, Date objects)
- **YAML bare dates** (e.g., `date: 2024-01-15`) are parsed as Date at UTC midnight. Always convert to `YYYY-MM-DD` string format in the schema to avoid timezone off-by-one errors.

### MDX Rendering
- Server-rendered via `<Content components={...}>` in Astro pages
- Interactive components (Gallery, Video, LightboxImage) need client-side hydration
- `HydrateMdx.astro` script re-mounts these components client-side via `createRoot`
- Gallery uses **build-time manifest loading** via `import.meta.glob('/public/images/**/manifest.json', { eager: true })` — no runtime fetch needed

### Constellation Graph
- Force-directed graph in `ConstellationGraph.tsx` with physics in `src/lib/forceLayout.ts`
- Uses a **square simulation frame** (`Math.min(viewport width, height)`) with circular boundary to maintain a round shape on all viewport aspect ratios
- Camera offset (not node shifting) centers the graph in the viewport
- All controls (gear icon, dropdown) are INSIDE the graph island — not in TopBar
- On constellation page: `client:load`, `autoFit`, `interactive`
- On home page: `client:visible`, non-interactive mini version

### Keystatic CMS
- Config in `keystatic.config.tsx` at project root
- Uses `import.meta.env?.PROD` for GitHub mode detection (not `process.env`)
- `KeystaticWrapper.tsx` re-exports Keystatic page component — **required** because Astro 6's React renderer doesn't match `.js` file extensions in production
- Custom API route at `src/pages/api/keystatic/[...params].ts` rewrites request URLs using `X-Forwarded-Host` header to fix OAuth redirects behind Traefik/Docker

### Linear Integration
- Project tracking uses Linear's GraphQL API via `src/hooks/useLinear.ts`
- API proxy at `src/pages/api/linear/graphql.ts` keeps `LINEAR_API_KEY` server-side
- MDX frontmatter uses `linearProjectId: "uuid"` (string, not number)
- `useLinearProject()` returns `ProjectStats` (same shape as old Vikunja interface)
- `useLinearKanban()` groups issues by Linear workflow states into kanban buckets
- Labels map `color` (with `#`) → `hex_color` (without `#`) for component compatibility
- `project.progress` (0.0–1.0) from Linear is used for completion percentage

### API Routes (SSR)
- Linear proxy: `src/pages/api/linear/graphql.ts` — forwards GraphQL queries with API key
- Keystatic API: `src/pages/api/keystatic/[...params].ts`
- All SSR routes use `export const prerender = false`

## Environment Variables

- Astro uses **`PUBLIC_*`** prefix for client-side env vars (not `VITE_*`)
- Dockerfile maps both `VITE_*` and `PUBLIC_*` from Coolify build args for compatibility
- Key vars: `PUBLIC_REMARK42_HOST`, `PUBLIC_REMARK42_SITE_ID`, `LINEAR_API_KEY` (server-side only), `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`

## Code Style

- Astro config: `syntaxHighlight: false` — using custom theme-aware `bg-surface-secondary` styles on `<pre>` blocks instead of Shiki (which injects hard-coded inline styles)
- Theme colors use CSS custom properties: `text-content`, `text-content-secondary`, `bg-surface`, `bg-surface-secondary`
- ESLint with TypeScript — run `npm run lint` before committing
