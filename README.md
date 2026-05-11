# Hi, My Name Is Rich

A personal blog built with **Astro 6**, TypeScript, and Tailwind CSS. Posts are authored as MDX files — standard markdown with the ability to embed React components directly in your writing. Static HTML pages with selective React islands for interactivity.

## Tech Stack

- **Astro 6** — static site generation with selective server-side rendering
- **React 19** (islands) — interactive components hydrate on demand via `client:*` directives
- **TypeScript 5.9** + **Tailwind CSS 4** with custom design token system
- **MDX** via `@astrojs/mdx` — content collections with Zod schema validation
- **Keystatic** CMS — integrated at `/keystatic` via `@keystatic/astro` (GitHub-backed editing)
- **View Transitions** — SPA-like smooth navigation between static pages
- **remark-gfm** for GitHub Flavored Markdown (tables, strikethrough, task lists)
- **remark-wiki-link** for Obsidian-compatible `[[wikilink]]` syntax
- **Montserrat** font (300–700, normal + italic) via Google Fonts
- **Sitemap** auto-generated via `@astrojs/sitemap`
- **SEO** — meta tags, Open Graph, Twitter cards, canonical URLs on every page

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Hero section with profile intro, Featured Posts (latest + 2 featured), and ambient Constellation Graph preview |
| `/about` | About | Author bio, interests, and category card grid with lightbox on hero image |
| `/contributors` | Contributors | Author cards with avatars (lightbox), bios, and social links from `authors.ts` |
| `/posts` | All Posts | Hero image, tag filter, search-filtered post list at 640px centered width |
| `/travel` | Travel | Posts filtered by category with category description |
| `/design` | Design | Posts filtered by category with category description |
| `/finance` | Finance | Posts filtered by category with category description |
| `/projects` | Projects | Project cards with expand/collapse, hero image, centered 640px layout |
| `/project/:id` | Project Detail | Full project page with hero image, MDX content, tasks, and progress |
| `/musings` | Musings | Posts filtered by category |
| `/cool-shit` | Cool Shit | Posts filtered by category |
| `/food` | Food | Posts filtered by category |
| `/post/:slug` | Post Detail | Full post content with hero image, metadata, tags, MDX body, and Previous/Next navigation |
| `/changelog` | Changelog | Auto-generated list of recently completed tasks from Linear, grouped by month/day |
| `/admin` | Admin | Comment activity dashboard (Remark42), moderation links, Cloudflare analytics link |
| `/constellation` | Constellation | Interactive star map showing how all posts relate through links, tags, and categories |

## Constellation Graph

An interactive force-directed graph visualizing relationships between posts — inspired by Obsidian's graph view.

- **Obsidian-style physics**: continuous force simulation with repulsion, link attraction, centering gravity, and ambient drift
- **Draggable nodes**: grab any star and move it — connected nodes react in real-time
- **Wikilink edges**: strong springs (short ideal distance) create tight clusters of directly linked posts
- **Tag edges**: weaker springs colored by tag — posts sharing tags loosely group together
- **Category colors**: each post is colored by its primary category (emerald=Travel, purple=Design, etc.)
- **Tag-colored edges**: each shared tag gets a distinct color via golden-angle hue spacing for visual distinction
- **Theme-aware**: background, edges, labels, and UI panels adapt to light/dark mode
- **Pan & zoom**: scroll to zoom, drag empty space to pan
- **Hover highlights**: hovering a star highlights its connections and dims unrelated nodes
- **Click to navigate**: click any star to visit that post
- **Touch support**: drag nodes, pinch to zoom on mobile
- **Toggles**: show/hide wikilink and tag edges independently
- **TopBar controls**: on the constellation page, a gear icon replaces the sparkle link — opens a dropdown with visibility toggles, zoom slider, force settings (links, tags, repulsion, gravity, drift), category legend, and Reset All
- **Home page preview**: ambient non-interactive preview on the home page with shared settings via the gear icon
- **Smooth reset**: Reset All animates the camera back to center and default zoom
- **Sparkle icon**: constellation link icon in TopBar (all pages) and sidebar

Graph data is derived at build time from MDX content via `src/lib/graphData.ts` — no manual rebuild needed.

## Layout

- **Max width**: 1440px with 95px horizontal padding (matching Figma spec)
- **TopBar**: Sticky header with glass morphism effect, home icon, site title, breadcrumb navigation, and fixed-position icons (constellation sparkle/gear, theme toggle, search)
- **Sidebar** (left): Slide-out mobile navigation (264px wide) with hamburger trigger, backdrop overlay, Escape key to close, and auto-close on route change. Includes nav links, category sub-links (indented), and active project links
- **Search Panel** (right): Slide-in search panel with full-text search, live results dropdown, and "View all results" link
- **Footer**: Profile avatar, name, and social links (Instagram, GitHub, LinkedIn) with auto-updating copyright year
- **Content width**: Posts and projects use centered 640px max-width for readability, with hero images at 1250px
- **Profile image**: Responsive scaling at 40% of viewport width, capped at 414px

## Search, Category & Tag Filtering

- **Search icon** in the top-right corner opens a slide-in panel from the right
- **Full-text search** across post titles, excerpts, tags, and full post content via a build-time search index
- **Word-boundary matching** to avoid substring false positives (e.g., "cuba" won't match "scuba")
- **Category filter**: collapsible "Filter by Category" section on the All Posts page with color-coded category pills matching each category's theme color
- **Tag filter**: collapsible "Filter by Tag" section with tag pills
- **OR logic**: both category and tag filters use OR — selecting multiple shows posts matching *any* of the selected items
- **Sort by**: dropdown to sort posts by date (newest/oldest) or title (A–Z/Z–A)
- **Inline controls**: sort, category filter, and tag filter sit in a single row at 1250px width
- **Clickable tags** in post cards toggle that tag as a filter
- **URL search params** (`?q=...&tag=...&cat=...`) for shareable/composable search, category, and filter state
- **Category scoping**: on category-specific pages (e.g., `/travel`), the category filter is hidden since the page is already scoped; search and tags still work within that category
- Search results page shows "Search Results:" header with clear button and post count
- Search index is derived at build time from MDX content (no manual rebuild needed) via `import.meta.glob` with `?raw` in `src/lib/posts.ts`

## Post Navigation

- **Previous/Next links** appear at the bottom of every post, navigating by date order (oldest to newest)
- **Tiebreaker**: posts with the same date are sorted alphabetically by slug for deterministic ordering
- Links are styled as `← Previous Post` and `Next Post →` with a top border separator

## Design System

Custom color tokens defined as CSS custom properties in `src/index.css` using Tailwind v4's `@theme`:

| Token | Hex | Usage |
|-------|-----|-------|
| `surface` | `#ffffff` | Main background |
| `surface-secondary` | `#f5f5f5` | Cards, code backgrounds |
| `surface-sidebar` | `#fafafa` | Sidebar background |
| `content` | `#444444` | Primary text |
| `content-secondary` | `#555555` | Body text |
| `content-muted` | `#999999` | Dates, hints, placeholders |
| `accent` | `#4a6cf7` | Links, highlights, active states |
| `accent-hover` | `#3451d1` | Hover state for accent |
| `edge` | `#e5e5e5` | Borders and dividers |

## Categories

Seven categories, each with a unique Tailwind color scheme used for badges and About page cards:

| Category | Color | Description |
|----------|-------|-------------|
| Travel | Emerald | Stories and photos from places near and far |
| Design | Purple | Thoughts on visual design, systems, and craft |
| Finance | Amber | Thoughts on money, investing, and financial independence |
| Projects | Sky | What I'm working on in my free time |
| Musings | Rose | Thoughts on life and the human condition |
| Cool Shit | Orange | Just cool shit I've seen lately |
| Food | Lime | Tinkering with tastes |

## Projects System

Projects are tracked via MDX files in `src/content/projects/`. Each file defines a project with tasks, status, and an optional rich description.

### Project Frontmatter

```yaml
---
name: "My Project"
description: "One-line summary"
excerpt: "Longer summary shown on the projects list page"
image: "/images/stock/my-project-hero.jpg"
imageAspectRatio: "16/9"
url: "https://github.com/user/project"
status: active          # or 'completed'
startDate: 2026-03-01
completedDate: 2026-06-15  # only for completed projects
linearProjectId: "7da7e253-..."    # optional — links to Linear for live task data
groupOrder:             # optional — custom display order for task label groups
  - Design
  - Foundation
  - Launch
tasks:
  - title: "First task"
    completed: true
    group: "Phase 1"    # optional — groups tasks under headings
  - title: "Second task"
    completed: false
    group: "Phase 1"
  - title: "Third task"
    completed: false
    group: "Phase 2"
---

Optional rich MDX body content here — supports markdown, React components, galleries, etc.
```

### How It Works

- **Individual project pages** at `/project/:id` with full MDX content, hero image, and task list
- **Projects list** (`/projects`) shows cards with expand/collapse for excerpt and tasks
- **Completion %** is derived from Linear live data when `linearProjectId` is set, otherwise from MDX `completed` fields
- **Task groups** are optional — add `group:` to organize tasks under headings with per-group sub-counts
- **Linear integration** — when `linearProjectId` is set, project pages fetch live task data from Linear, grouped by label with collapsible sections and colored progress bars
- **Custom group order** — define `groupOrder` array in frontmatter to control display order (e.g., construction phases for a house build)
- **Changelog** — `/changelog` page auto-generates a list of recently completed tasks from Linear, grouped by month and day
- **Sidebar** shows active projects linking to individual project pages
- **Hero images** display at 1250px width on project detail pages
- **External URL** shown as "Visit Project" link when set (hidden if `"#"`)
- **MDX body** renders on the detail page (supports all MDX components)

## Linear Task Manager Integration

Live task data from [Linear](https://linear.app/) powers project tracking on the blog.

- **Live progress** — project completion percentages and task counts fetched from Linear API via Astro server route proxy (avoids CORS)
- **Recursive sub-projects** — tasks from nested sub-projects are aggregated automatically
- **Label-based grouping** — tasks grouped by Linear labels with colored progress bars and collapsible sections
- **Custom group order** — `groupOrder` in MDX frontmatter controls display sequence (e.g., construction phases)
- **Issue badges** — tasks labeled `bug` (red), `enhancement` (blue), or `question` (purple) show as badges on project cards; excluded from progress calculations
- **Four view modes** on project detail pages:
  - **Labels** — tasks grouped by label with collapsible sections and per-group progress (640px)
  - **Pending** — flat list of unfinished tasks only, with label pills (640px)
  - **Kanban** — bucket columns from Linear's Kanban view (1250px)
  - **Gantt** — timeline chart placeholder for tasks with dates (1250px)
- **Changelog** — `/changelog` page auto-generates a list of recently completed tasks, grouped by month and day
- **Fallback** — when `linearProjectId` is not set or Linear is unavailable, shows "N/A" (no stale MDX fallback)
- Linear is a hosted service — set `LINEAR_API_KEY` as a runtime env var in Coolify

## Dark Mode

- **Toggle** via sun/moon icon in the TopBar header
- **Persists** via `localStorage` — survives page reloads and sessions
- **System preference** — respects `prefers-color-scheme: dark` on first visit
- **CSS custom properties** — all design tokens have dark variants defined in `src/index.css`
- **Remark42 sync** — comment widget switches between light/dark theme automatically
- **Constellation** — graph background, edges, and labels adapt to theme

## Admin Dashboard

The `/admin` page (not linked in navigation — access via URL) provides:

- **Comment activity** from Remark42 via bridge iframe (same-origin authenticated)
- **Tabs**: Recent Comments (last 50), Posts by comment count, Blocked Users, Moderate
- **Moderate tab** — quick links to posts with comments for inline moderation
- **Cloudflare dashboard link** for traffic analytics
- **Refresh button** to reload data

## Mobile Responsive

- **Breadcrumbs hidden** on screens < 640px to prevent icon overlap
- **Sort/filter controls** stack vertically on mobile
- **Sidebar** and search panel scrollable on small screens (`overflow-y-auto`)
- **Constellation** uses `touch-action: none` to prevent page scroll during pan/pinch
- **Constellation auto-fit** — graph scales to viewport with aspect-ratio-aware zoom
- **Featured posts** stack vertically on mobile

## Comments (Remark42)

Posts include a comments section powered by [Remark42](https://remark42.com/), a self-hosted comment engine.

- **Self-hosted** — no third-party tracking, you own all comment data
- **Auth** via GitHub, Google, or anonymous (configurable)
- **Moderation** — admin panel, comment approval, spam scoring, user/IP blocking, word filters
- **Env-driven** — set `VITE_REMARK42_HOST` to enable; without it, a dev placeholder is shown
- **Per-post threads** — each post's slug is used as the unique page ID
- See [`REMARK42-SETUP.md`](./docs/REMARK42-SETUP.md) for full deployment instructions

## Project Structure

```
src/
  components/
    Layout.tsx          # Main layout (1440px max, 95px padding, Outlet)
    TopBar.tsx          # Sticky header with breadcrumbs + glass morphism
  layouts/
    Layout.astro        # Base HTML layout (SEO meta, fonts, theme, View Transitions)
    MainLayout.astro    # App layout (TopBar, Sidebar, SearchPanel, Footer, slot)
  pages/
    index.astro         # Home page (hero, featured posts, latest posts)
    about.astro         # About Rich page
    contributors.astro  # Author cards with avatar lightbox, bios, social links
    constellation.astro # Full-screen interactive constellation graph
    admin.astro         # Admin dashboard with comment activity
    changelog.astro     # Auto-generated changelog from Linear
    posts/index.astro   # All posts with sort, category filter, tag filter
    post/[slug].astro   # Individual post with MDX content, prev/next nav, comments
    project/[id].astro  # Individual project with MDX content, Linear tasks
    projects/index.astro # Project list with Linear progress
    travel.astro, design.astro, ... # Category-filtered post pages
    keystatic/[...params].astro     # Keystatic CMS admin UI
    api/linear/graphql.ts           # Linear GraphQL API proxy (SSR route)
    api/keystatic/[...params].ts    # Keystatic OAuth API handler
  components/
    TopBar.tsx          # Sticky header with breadcrumbs (React island)
    Sidebar.tsx         # Slide-out nav with project links (React island)
    SearchOverlay.tsx   # Right slide-in search panel (React island)
    Footer.astro        # Avatar + social links (static Astro)
    PostCard.tsx        # Post thumbnail card (server-rendered React)
    PostsListIsland.tsx # Posts list with sort/filter (React island)
    ConstellationGraph.tsx # Force-directed graph with built-in controls (React island)
    ConstellationDropdown.tsx # Graph settings dropdown (inside graph island)
    Gallery.tsx         # Image carousel with build-time manifest loading
    Video.tsx           # Video player with poster/seek-frame support
    LightboxImage.tsx   # Clickable image with lightbox overlay
    Lightbox.tsx        # Full-screen image viewer
    YouTube.tsx         # YouTube embed component
    Comments.tsx        # Remark42 comment widget (React island)
    MdxComponents.tsx   # MDX element overrides (headings, code, links, etc.)
    HydrateMdx.astro    # Client-side hydration for Gallery/Video in MDX
    AdminDashboard.tsx  # Comment activity feed (React island)
    ProjectProgress.tsx # Live Linear progress bar (React island)
    ProjectDetailIsland.tsx # Task views: Labels/Pending/Kanban/Gantt (React island)
    ProjectProgressBar.tsx  # Compact progress bar for project header
    KeystaticWrapper.tsx    # .tsx wrapper for Keystatic page (Astro 6 compat)
    CategoryFilter.tsx  # Collapsible category pill filter
    TagFilter.tsx       # Collapsible tag pill filter
    ConstellationIcon.tsx # Sparkle/stars SVG icon
  content/
    posts/              # Blog posts as .mdx files
      .obsidian/        # Obsidian vault config for editing posts
    projects/           # Project definitions as .mdx files
  content.config.ts     # Astro content collection schemas (Zod validation)
  data/
    authors.json        # Author data (managed via Keystatic Authors singleton)
    authors.ts          # TypeScript wrapper — imports authors.json
    categories.ts       # Category definitions, labels, colors, hero images
    site-settings.json  # Global settings (managed via Keystatic Site Settings singleton)
  hooks/
    useTheme.tsx        # Dark/light theme (useSyncExternalStore, cross-island)
    useLinear.ts       # Linear API integration — recursive project/task fetching
  lib/
    dateUtils.ts        # Local timezone date parsing
    posts.ts            # Data access layer — loads posts + derives search index
    projects.ts         # Data access layer — loads projects via import.meta.glob
    graphData.ts        # Constellation graph nodes + edges, derived from MDX
    readTime.ts         # Calculate read time from MDX body word count
    forceLayout.ts      # Force-directed graph physics engine
  types/
    index.ts            # BlogPost, Author, Category, Project, ProjectTask interfaces
  index.css             # Tailwind @theme tokens + custom utilities
public/
  images/
    stock/              # Stock/default hero images
    albums/             # Photo albums (subdirectory per album with manifest.json)
    profiles/           # Author profile images
scripts/
  new-post.mjs          # Scaffold a new blog post
  new-project.mjs       # Scaffold a new project
  generate-gallery-manifest.mjs  # Generate manifest.json for galleries
  precommit.mjs         # Run all pre-commit tasks
  validate-frontmatter.mjs # Check for unknown categories and YAML issues
  list-featured.mjs     # List all posts marked as featured
  help.mjs              # Show available commands
```

## Getting Started

```bash
npm install --legacy-peer-deps
npm run dev     # starts Astro dev server at http://localhost:4321
npm run help    # see all available commands
```

## Creating Content

### New Blog Post

```bash
npm run new-post -- "My Post Title"
```

Creates `src/content/posts/my-post-title.mdx` with frontmatter pre-filled. Edit in any text editor or open `src/content/posts/` as an Obsidian vault (config is included with MDX plugin support).

#### Post Frontmatter

```yaml
---
title: "My Post Title"
excerpt: "A brief description"
date: "2026-03-11"
categories:
  - travel
featured: true
image: "/images/stock/my-hero-image.jpg"
imageAspectRatio: "16/9"
authorId: "rich"                           # or ["rich", "claude"] for multiple authors
tags:
  - Spain
  - Road-Trip
---
```

Posts are sorted by date (newest first), with slug as alphabetical tiebreaker. The `slug` and `id` are derived from the filename. If `image` is empty (`""`), a default stock image is used as the thumbnail. The `imageAspectRatio` defaults to `16/9`. The `authorId` field supports a single string or an array of author IDs for co-authored posts.

#### Date Formats

All dates are parsed as **local time** (not UTC) to avoid off-by-one day display bugs:

| Format | Example | Notes |
|--------|---------|-------|
| Date only | `2026-03-01` | Local midnight |
| T-separated | `2026-03-01T06:10:00` | Local time |
| Space-separated | `2026-03-01 06:10:00` | Also supported |
| UTC | `2026-03-01T06:10:00Z` | Converted to viewer's timezone |

#### Featured Posts

Posts with `featured: true` appear in the Featured section on the home page. Layout: the latest post is shown large (6/4 aspect, 2/3 width) on the left, with up to 2 featured posts stacked (16/9 aspect, 1/3 width) on the right. List all featured posts:

```bash
npm run list-featured
```

#### Linking Between Posts and Projects

```mdx
[[other-post-slug|Display Text]]           # Wikilink to a post (works in Obsidian too)
[[other-post-slug.mdx|Display Text]]       # With .mdx extension (also works)
[[project-slug|Display Text]]              # Wikilink to a project (auto-detected)
[Display Text](/posts/other-post-slug)      # Standard markdown link to a post
[Display Text](/project/project-slug)       # Standard markdown link to a project
```

Wiki-links automatically resolve to `/project/` for project slugs and `/posts/` for everything else.

### New Project

```bash
npm run new-project -- "My Project Name"
```

Creates `src/content/projects/my-project-name.mdx` with all frontmatter fields.

## MDX Components

Posts are MDX, so you can use React components directly in your writing. The following are available in all posts without any imports:

### YouTube Embed

```mdx
<YouTube id="dQw4w9WgXcQ" />
<YouTube id="dQw4w9WgXcQ" title="Rick Astley - Never Gonna Give You Up" />
```

Responsive 16:9 iframe using YouTube's privacy-enhanced mode (`youtube-nocookie.com`).

### Image Gallery

```mdx
<Gallery path="/images/albums/my-trip" />
<Gallery path="/images/albums/my-trip" aspectRatio="4/3" />
```

Horizontal scroll carousel loaded from a `manifest.json` in the specified directory:

- **Scroll-snap** for clean stops between images
- **Arrow buttons** on desktop, **swipe** on mobile
- **Dot indicators** showing current position
- **Lightbox** — click any image for full-screen view with keyboard nav, touch swipe, and captions
- **Custom aspect ratio** via `aspectRatio` prop (default: `4/3`)
- **Video support** — `.mp4` files in the manifest play inline with controls
- Gallery width extends to 950px for a wider viewing experience

#### Setting Up a Gallery

1. Create a directory under `public/images/albums/` (e.g., `public/images/albums/RTW-London/`)
2. Add images (`.jpg`, `.jpeg`, `.png`, `.webp`) and videos (`.mp4`)
3. Generate the manifest: `npm run generate-galleries`
4. Optionally edit the generated `manifest.json` to add alt text and captions
5. Use `<Gallery path="/images/albums/RTW-London" />` in any post

### Video

```mdx
<Video src="/images/albums/RTW-Caribbean/Buena_Vista.mp4" caption="Buena Vista Social Club" />
```

HTML5 video player with controls, optional caption, and automatic first-frame poster via `#t=1` seek.

### Image Lightbox

All inline images in posts automatically support lightbox — click any image to view it full-screen. Hero images on post detail and about pages also support lightbox.

### Inline HTML/JSX

Standard HTML tags work as JSX in MDX:

```mdx
<big>larger text</big>
<small>fine print</small>
<mark>highlighted</mark>
<u>underlined</u>
<span style={{ color: 'red', fontSize: '1.5rem' }}>custom styled</span>
```

### Markdown Features

All standard markdown plus GFM extensions:

- **Bold**, *italic*, ~~strikethrough~~
- Headings (h1–h6, each with custom styling)
- Ordered and unordered lists with nested indentation
- Task lists with checkboxes
- Blockquotes (including nested)
- Fenced code blocks with dark theme styling
- Inline code
- Tables with column alignment (`:---`, `:---:`, `---:`)
- Horizontal rules
- Links (external auto-open in new tab)
- Footnotes

## Scripts

Run `npm run help` to see all commands, or reference the table below:

| Command | Description |
|---------|-------------|
| `npm run help` | Show all available commands |
| `npm run dev` | Start Astro dev server on port 4321 |
| `npm run build` | Astro production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run new-post -- "Title"` | Scaffold a new `.mdx` post |
| `npm run new-project -- "Name"` | Scaffold a new `.mdx` project |
| `npm run generate-galleries` | Generate `manifest.json` for all image/video directories |
| `npm run precommit` | Validate frontmatter, regenerate galleries, lint |

## CI/CD & Deployment

**CI**: GitHub Actions runs on pushes to `main` and on pull requests:
- ESLint
- Astro production build

**CD**: Coolify on a Hetzner ARM64 VPS auto-deploys on push to `main`:
- **Blog**: Multi-stage Docker build (Node build → Node standalone server on port 4321), served via Traefik with auto SSL
- **Keystatic CMS**: Built into the blog at `/keystatic` (no separate deployment)
- **Remark42 comments**: Custom Docker image (stock Remark42 + CSS overrides), built directly by Coolify
- **Cloudflare CDN**: Static assets cached at edge, `www` → apex redirect

See deployment guides:
- [`COOLIFY-DEPLOYMENT.md`](./docs/COOLIFY-DEPLOYMENT.md) — Frontend deployment
- [`REMARK42-SETUP.md`](./docs/REMARK42-SETUP.md) — Comment system
- [`HETZNER-SERVER-SETUP.md`](./docs/HETZNER-SERVER-SETUP.md) — Server provisioning
- [`CLOUDFLARE-CDN-SETUP.md`](./docs/CLOUDFLARE-CDN-SETUP.md) — CDN setup
- Linear project tracking is configured via `linearProjectId` in MDX frontmatter and `LINEAR_API_KEY` runtime env var

## Architecture Notes

- **Astro + React islands**: Pages are `.astro` files that render static HTML. Interactive components (search, constellation, comments, filters) are React islands with `client:load`, `client:visible`, or `client:idle` directives — zero JS shipped for non-interactive pages.
- **Content collections**: Astro's Content Layer API with Zod schemas validates all MDX frontmatter at build time. `getCollection('posts')` and `getCollection('projects')` provide type-safe data access.
- **MDX component overrides**: Markdown element styling (headings, code blocks, lists, etc.) is centralized in `MdxComponents.tsx`. Custom components (`Gallery`, `Video`, `YouTube`) are auto-imported into MDX files via `astro-auto-import`.
- **Gallery hydration**: Galleries load manifest data at build time via `import.meta.glob` for server rendering. The `HydrateMdx.astro` script re-mounts Gallery/Video/LightboxImage components client-side for interactivity.
- **Content as code**: Posts and projects live as `.mdx` files. Keystatic CMS at `/keystatic` provides a visual editor that commits to GitHub. The Obsidian vault config lets you edit locally with wikilink support.
- **Full-text search**: Search index is derived at build time from raw MDX content via `import.meta.glob` with `?raw`. The `PostsListIsland` React island handles search, sort, and filtering with URL param support (`?q=...&tag=...`).
- **Linear integration**: Astro server route (`/api/linear/graphql.ts`) proxies GraphQL queries to Linear's API with the API key server-side. `useLinearProject` hook fetches project issues and maps them to the display components.
- **Dark mode**: `useTheme` hook uses `useSyncExternalStore` — works across separate React islands without a provider. Theme persists via `localStorage` and re-applies after View Transitions via `astro:after-swap`.
- **View Transitions**: Astro's `ClientRouter` provides SPA-like smooth navigation between static pages. Theme detection script runs on every swap to prevent flash.
- **SEO**: Every page has `<title>`, `<meta description>`, Open Graph, and Twitter card tags set in `Layout.astro`. Sitemap auto-generated by `@astrojs/sitemap`.
- **Pre-commit workflow**: `npm run precommit` validates frontmatter, regenerates gallery manifests, and lints. Read times, search index, and graph data are all derived at build time from MDX content — no script needed.
