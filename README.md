# Hi, My Name Is Rich

A personal blog and portfolio site built with React, TypeScript, Vite, and Tailwind CSS. Posts are authored as MDX files — standard markdown with the ability to embed React components directly in your writing.

## Tech Stack

- **React 19** + **TypeScript 5.9** + **Vite 7**
- **Tailwind CSS 4** with a custom design token system
- **MDX** via `@mdx-js/rollup` — `.mdx` files compiled at build time
- **React Router 7** for client-side routing
- **remark-gfm** for GitHub Flavored Markdown (tables, strikethrough, task lists)
- **Montserrat** font (300–700, normal + italic) via Google Fonts

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Hero section with profile intro + latest 4 posts grid |
| `/about` | About | Author bio, interests, and category card grid |
| `/posts` | All Posts | Featured post hero + mini-card list of all posts |
| `/travel` | Travel | Posts filtered by category |
| `/design` | Design | Posts filtered by category |
| `/goals` | Goals | Posts filtered by category |
| `/projects` | Projects | Posts filtered by category |
| `/musings` | Musings | Posts filtered by category |
| `/cool-shit` | Cool Shit | Posts filtered by category |
| `/food` | Food | Posts filtered by category |
| `/post/:slug` | Post Detail | Full post content with hero image, metadata, and MDX body |

## Layout

- **Max width**: 1440px with 95px horizontal padding (matching Figma spec)
- **TopBar**: Sticky header with glass morphism effect, home icon, site title, and breadcrumb navigation
- **Sidebar**: Slide-out mobile navigation (264px wide) with hamburger trigger, backdrop overlay, Escape key to close, and auto-close on route change. Includes nav links for all pages/categories plus a projects section with status indicators
- **Footer**: Profile avatar, name, and social links (Instagram, GitHub, LinkedIn) with auto-updating copyright year
- **Post content**: Centered at 640px max-width for readability
- **Profile image**: Responsive scaling at 40% of viewport width, capped at 414px

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
| Goals | Amber | Reflections on personal growth and ambition |
| Projects | Sky | What I'm working on in my free time |
| Musings | Rose | Thoughts on life and the human condition |
| Cool Shit | Orange | Just cool shit I've seen lately |
| Food | Lime | Tinkering with tastes |

## Project Structure

```
src/
  components/
    Layout.tsx          # Main layout (1440px max, 95px padding, Outlet)
    TopBar.tsx          # Sticky header with breadcrumbs + glass morphism
    Sidebar.tsx         # Slide-out nav with projects section
    Footer.tsx          # Avatar + social links
    PostCard.tsx        # Post thumbnail card (6:4 aspect, hover effects)
    MdxComponents.tsx   # MDX overrides + custom component registration
    YouTube.tsx         # YouTube embed component
    Gallery.tsx         # Image carousel component
    Lightbox.tsx        # Full-screen image viewer
  content/
    posts/              # Blog posts as .mdx files
      .obsidian/        # Obsidian vault config for editing posts
  data/
    authors.ts          # Author profiles (id, name, avatar)
    categories.ts       # Category definitions, labels, colors
    projects.ts         # Sidebar project entries with status
  lib/
    posts.ts            # Data access layer — loads all .mdx via import.meta.glob
  pages/
    Home.tsx            # Hero + latest 4 posts
    About.tsx           # Bio, interests, category cards
    PostsList.tsx       # Featured post + filtered post list
    PostDetail.tsx      # Full post view with MDX rendering
  types/
    index.ts            # BlogPost, Author, Category, Project interfaces
  index.css             # Tailwind @theme tokens + custom utilities
  mdx.d.ts              # TypeScript declarations for .mdx imports
public/
  images/
    stock/              # Stock/default hero images (not tied to specific posts)
    galleries/          # Image galleries (subdirectory per gallery)
scripts/
  new-post.mjs          # Scaffold a new blog post
  generate-gallery-manifest.mjs  # Generate manifest.json for galleries
```

## Getting Started

```bash
npm install
npm run dev
```

## Creating a New Post

```bash
npm run new-post -- "My Post Title"
```

Creates `src/content/posts/my-post-title.mdx` with frontmatter pre-filled. Edit in any text editor or open `src/content/posts/` as an Obsidian vault (config is included with MDX plugin support).

### Frontmatter Format

```yaml
---
title: "My Post Title"
excerpt: "A brief description"
date: "2026-03-11"
readTime: "5 min read"
categories:
  - travel
  - design
featured: true
image: "/images/stock/my-hero-image.jpg"
authorId: "rich"
---
```

Posts are sorted by date (newest first). The `slug` and `id` are derived from the filename. If no `image` is specified, a default hero image is used.

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
<Gallery path="/images/galleries/my-trip" />
```

Horizontal scroll carousel loaded from a `manifest.json` in the specified directory:

- **Scroll-snap** for clean stops between images
- **Arrow buttons** on desktop, **swipe** on mobile
- **Dot indicators** showing current position
- **Lightbox** — click any image for full-screen view with keyboard nav (← → Escape), touch swipe, image counter, and captions

#### Setting Up a Gallery

1. Create a directory under `public/images/` (e.g., `public/images/galleries/amalfi-trip/`)
2. Add images (`.jpg`, `.jpeg`, `.png`, `.webp`)
3. Generate the manifest:

```bash
npm run generate-galleries
```

4. Optionally edit the generated `manifest.json` to add alt text and captions:

```json
{
  "images": [
    { "src": "01.jpg", "alt": "Sunset over Positano", "caption": "Day 1" },
    { "src": "02.jpg", "alt": "Blue grotto interior" }
  ]
}
```

5. Use `<Gallery path="/images/galleries/amalfi-trip" />` in any post.

The generator preserves existing `alt` and `caption` values when re-run after adding new images.

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
- Horizontal rules
- Links (external auto-open in new tab)
- Footnotes

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 5173 |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run new-post -- "Title"` | Scaffold a new `.mdx` post |
| `npm run generate-galleries` | Generate `manifest.json` for all image directories under `public/images/` |
| `npm run generate-galleries -- path/to/dir` | Generate manifests starting from a specific directory |

## Architecture Notes

- **Data access layer**: `src/lib/posts.ts` is the single seam for all post loading. It uses `import.meta.glob` to eagerly import `.mdx` files at build time. To migrate to a headless CMS (e.g., TinaCMS, Strapi) later, only this file needs to change — all consumers import from `lib/posts`.
- **MDX component overrides**: All markdown element styling (headings, code blocks, lists, blockquotes, etc.) is centralized in `src/components/MdxComponents.tsx`. Custom components like `YouTube` and `Gallery` are also registered there — no imports needed in post files.
- **Content as code**: Posts live in the repo as `.mdx` files. Creating, editing, and publishing is just a git commit. The Obsidian vault config in `src/content/posts/.obsidian/` lets you use Obsidian as a WYSIWYG editor with live preview.
- **Gallery manifests**: Since Vite can't list directory contents at runtime, each gallery uses a `manifest.json` that maps filenames to metadata. The `generate-galleries` script automates creation and preserves hand-edited alt text and captions.
