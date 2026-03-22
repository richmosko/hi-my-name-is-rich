# Hi, My Name Is Rich

A personal blog built with React, TypeScript, Vite, and Tailwind CSS. Posts are authored as MDX files — standard markdown with the ability to embed React components directly in your writing.

## Tech Stack

- **React 19** + **TypeScript 5.9** + **Vite 7**
- **Tailwind CSS 4** with a custom design token system
- **MDX** via `@mdx-js/rollup` — `.mdx` files compiled at build time
- **React Router 7** for client-side routing
- **remark-gfm** for GitHub Flavored Markdown (tables, strikethrough, task lists)
- **remark-wiki-link** for Obsidian-compatible `[[wikilink]]` syntax
- **Montserrat** font (300–700, normal + italic) via Google Fonts

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Hero section with profile intro, Featured Posts (3-across), and Latest Posts grid |
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

Rebuild graph data after adding/editing posts: `npm run build-graph-index`

## Layout

- **Max width**: 1440px with 95px horizontal padding (matching Figma spec)
- **TopBar**: Sticky header with glass morphism effect, home icon, site title, and breadcrumb navigation
- **Sidebar** (left): Slide-out mobile navigation (264px wide) with hamburger trigger, backdrop overlay, Escape key to close, and auto-close on route change. Includes nav links, category sub-links (indented), and active projects with completion percentages and mini progress bars
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
- **Side-by-side filters**: category and tag filters sit inline next to each other with stable minimum widths
- **Clickable tags** in post cards toggle that tag as a filter
- **URL search params** (`?q=...&tag=...&cat=...`) for shareable/composable search, category, and filter state
- **Category scoping**: on category-specific pages (e.g., `/travel`), the category filter is hidden since the page is already scoped; search and tags still work within that category
- Search results page shows "Search Results:" header with clear button and post count
- Rebuild the search index after adding/editing posts: `npm run build-search-index`

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
- **Completion %** is derived automatically from `completed` tasks vs total tasks
- **Task groups** are optional — add `group:` to organize tasks under headings with per-group sub-counts
- **Sidebar** shows only active projects with mini progress bars, linking to individual project pages
- **Hero images** display at 1250px width on project detail pages
- **External URL** shown as "Visit Project" link when set (hidden if `"#"`)
- **MDX body** renders on the detail page (supports all MDX components)

## Comments (Remark42)

Posts include a comments section powered by [Remark42](https://remark42.com/), a self-hosted comment engine.

- **Self-hosted** — no third-party tracking, you own all comment data
- **Auth** via GitHub, Google, or anonymous (configurable)
- **Moderation** — admin panel, comment approval, spam scoring, user/IP blocking, word filters
- **Env-driven** — set `VITE_REMARK42_HOST` to enable; without it, a dev placeholder is shown
- **Per-post threads** — each post's slug is used as the unique page ID
- See [`REMARK42-SETUP.md`](./REMARK42-SETUP.md) for full deployment instructions

## Project Structure

```
src/
  components/
    Layout.tsx          # Main layout (1440px max, 95px padding, Outlet)
    TopBar.tsx          # Sticky header with breadcrumbs + glass morphism
    Sidebar.tsx         # Slide-out nav with projects progress section
    SearchOverlay.tsx   # Right slide-in search panel with live results
    CategoryFilter.tsx  # Collapsible category pill filter with theme colors
    TagFilter.tsx       # Collapsible tag pill filter
    Footer.tsx          # Avatar + social links
    PostCard.tsx        # Post thumbnail card (6:4 aspect, hover effects)
    MdxComponents.tsx   # MDX overrides + custom component registration
    LightboxImage.tsx   # Clickable image with lightbox overlay
    YouTube.tsx         # YouTube embed component
    Gallery.tsx         # Image carousel with aspectRatio and fullWidth props
    Video.tsx           # Video player with poster/seek-frame support
    Lightbox.tsx        # Full-screen image viewer
    Comments.tsx        # Remark42 comment widget (env-driven)
    ScrollToTop.tsx     # Resets scroll position on route change
  content/
    posts/              # Blog posts as .mdx files
      .obsidian/        # Obsidian vault config for editing posts
    projects/           # Project definitions as .mdx files
  data/
    authors.ts          # Author profiles (id, name, avatar, bio, socials)
    categories.ts       # Category definitions, labels, colors, descriptions
  lib/
    dateUtils.ts        # Local timezone date parsing to avoid UTC off-by-one bugs
    posts.ts            # Data access layer — loads all post .mdx via import.meta.glob
    projects.ts         # Data access layer — loads all project .mdx via import.meta.glob
    search-index.json   # Full-text search index (generated by build-search-index script)
    graph-index.json    # Post relationship graph data (generated by build-graph-index script)
    forceLayout.ts      # Force-directed graph layout engine (zero dependencies)
  pages/
    Home.tsx            # Hero + Featured Posts (3-across) + Latest Posts
    About.tsx           # Bio, interests, category cards with lightbox
    Contributors.tsx    # Author cards with avatar lightbox, bios, social links
    Constellation.tsx   # Interactive star constellation graph of post relationships
    PostsList.tsx       # Category + tag filters, search-filtered post list (640px centered)
    PostDetail.tsx      # Full post view with hero image, lightbox, MDX rendering, prev/next nav
    ProjectsPage.tsx    # Project cards with expand/collapse (640px centered, 1250px hero)
    ProjectDetail.tsx   # Individual project page with MDX content and tasks
  types/
    index.ts            # BlogPost, Author, Category, Project, ProjectTask interfaces
  index.css             # Tailwind @theme tokens + custom utilities
  mdx.d.ts              # TypeScript declarations for .mdx imports
public/
  images/
    stock/              # Stock/default hero images
    albums/             # Photo albums (subdirectory per album with manifest.json)
    profiles/           # Author profile images
scripts/
  new-post.mjs          # Scaffold a new blog post
  new-project.mjs       # Scaffold a new project
  update-read-times.mjs # Recalculate readTime for all posts
  build-search-index.mjs # Build full-text search index
  build-graph-index.mjs  # Build constellation graph data from post relationships
  generate-gallery-manifest.mjs  # Generate manifest.json for galleries
  precommit.mjs         # Run all pre-commit tasks
  validate-frontmatter.mjs # Check for unknown categories and YAML issues
  list-featured.mjs     # List all posts marked as featured
  help.mjs              # Show available commands
```

## Getting Started

```bash
npm install
npm run dev
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
readTime: "5 min read"
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

Posts with `featured: true` appear in the Featured section on the home page (top 3 by date). List all featured posts:

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
| `npm run dev` | Start dev server on port 5173 |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run new-post -- "Title"` | Scaffold a new `.mdx` post |
| `npm run new-project -- "Name"` | Scaffold a new `.mdx` project |
| `npm run update-read-times` | Recalculate readTime for all posts based on word count |
| `npm run build-search-index` | Rebuild full-text search index from all post content |
| `npm run build-graph-index` | Rebuild constellation graph data from post relationships |
| `npm run generate-galleries` | Generate `manifest.json` for all image/video directories |
| `npm run precommit` | Run all pre-commit tasks (read times, search index, galleries, graph, lint) |

## CI/CD & Deployment

**CI**: GitHub Actions runs on pushes to `main` and on pull requests:
- ESLint
- TypeScript type-check + Vite production build

**CD**: Coolify on a Hetzner ARM64 VPS auto-deploys on push to `main`:
- **Blog frontend**: Multi-stage Docker build (Node → nginx), served via Traefik with auto SSL
- **Remark42 comments**: Custom Docker image (stock Remark42 + CSS overrides), built directly by Coolify
- **Cloudflare CDN**: Static assets cached at edge, `www` → apex redirect

See deployment guides:
- [`COOLIFY-DEPLOYMENT.md`](./COOLIFY-DEPLOYMENT.md) — Frontend deployment
- [`REMARK42-SETUP.md`](./REMARK42-SETUP.md) — Comment system
- [`HETZNER-SERVER-SETUP.md`](./HETZNER-SERVER-SETUP.md) — Server provisioning
- [`CLOUDFLARE-CDN-SETUP.md`](./CLOUDFLARE-CDN-SETUP.md) — CDN setup

## Architecture Notes

- **Data access layers**: `src/lib/posts.ts` and `src/lib/projects.ts` are the single seams for all content loading. They use `import.meta.glob` to eagerly import `.mdx` files at build time. To migrate to a headless CMS later, only these files need to change — all consumers import from `lib/`.
- **MDX component overrides**: All markdown element styling (headings, code blocks, lists, blockquotes, etc.) is centralized in `src/components/MdxComponents.tsx`. Custom components like `YouTube`, `Gallery`, and `Video` are also registered there — no imports needed in post files.
- **Content as code**: Posts and projects live in the repo as `.mdx` files. Creating, editing, and publishing is just a git commit. The Obsidian vault config in `src/content/posts/.obsidian/` lets you use Obsidian as a WYSIWYG editor with live preview. Wikilinks work in both Obsidian and the blog (with or without `.mdx` extension).
- **Full-text search**: A build-time script extracts plain text from all MDX posts into `search-index.json`. The search function uses word-boundary regex matching on the index to avoid substring false positives, plus substring matching on titles/excerpts/tags.
- **Gallery manifests**: Since Vite can't list directory contents at runtime, each gallery uses a `manifest.json` that maps filenames to metadata. The `generate-galleries` script automates creation and preserves hand-edited alt text and captions.
- **Project tracking**: Projects use the same MDX + frontmatter pattern as posts. Completion percentages are derived at render time from task data. Tasks optionally support grouping for hierarchical organization. Individual project detail pages mirror the post detail pattern.
- **Pre-commit workflow**: `npm run precommit` ensures read times, search index, gallery manifests, and lint are all up to date before committing.
