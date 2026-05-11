import type { BlogPost, Category } from '../types';
import { parseLocalDate } from './dateUtils';

// MDX module shape: each .mdx file exports frontmatter + a default React component
interface MdxModule {
  default: React.ComponentType;
  frontmatter: {
    title: string;
    excerpt: string;
    date: string;
    readTime?: string;
    categories: Category[];
    featured?: boolean;
    image?: string;
    imageUpload?: string;
    imageAspectRatio?: string;
    authorId: string | string[];
    tags?: string[];
  };
}

// Build-time glob import: all .mdx files as compiled modules
const postModules = import.meta.glob<MdxModule>('../content/posts/*.mdx', {
  eager: true,
});

// Build-time glob import: same files as raw text, for the full-text search index
const rawModules = import.meta.glob<string>('../content/posts/*.mdx', {
  eager: true,
  query: '?raw',
  import: 'default',
});

/** Strip frontmatter, imports, JSX/HTML, markdown syntax, and URLs for search */
function extractSearchText(raw: string): string {
  return raw
    .replace(/^---[\s\S]*?---/, '')           // frontmatter
    .replace(/^import\s+.*$/gm, '')            // import statements
    .replace(/<[^>]+>/g, ' ')                  // JSX/HTML tags
    .replace(/[#*_`[\]()!|]/g, '')            // markdown syntax
    .replace(/https?:\/\/\S+/g, '')           // URLs
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Map of slug → cleaned full-text body, derived at build time */
const searchData: Record<string, string> = Object.fromEntries(
  Object.entries(rawModules).map(([path, raw]) => {
    const slug = path.split('/').pop()!.replace(/\.mdx$/, '');
    return [slug, extractSearchText(raw)];
  })
);

function parsePost(filePath: string, mod: MdxModule): BlogPost {
  const { frontmatter, default: Content } = mod;

  // Derive slug from filename: '../content/posts/digital-declutter.mdx' → 'digital-declutter'
  const slug = filePath.split('/').pop()!.replace(/\.mdx$/, '');

  return {
    id: slug,
    slug,
    title: frontmatter.title,
    excerpt: frontmatter.excerpt,
    date: frontmatter.date,
    readTime: frontmatter.readTime ?? '1 min read',
    categories: Array.isArray(frontmatter.categories)
      ? frontmatter.categories
      : frontmatter.categories
        ? [frontmatter.categories as unknown as Category]
        : [],
    featured: frontmatter.featured ?? false,
    image: frontmatter.image || frontmatter.imageUpload || undefined,
    imageAspectRatio: frontmatter.imageAspectRatio,
    authorId: frontmatter.authorId,
    tags: frontmatter.tags ?? [],
    content: Content,
  };
}

// Parse all posts once, sorted newest-first
const allPosts: BlogPost[] = Object.entries(postModules)
  .map(([path, mod]) => parsePost(path, mod))
  .sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());

/** Get all posts, sorted newest-first */
export function getAllPosts(): BlogPost[] {
  return allPosts;
}

/** Get a single post by slug, or undefined */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return allPosts.find((p) => p.slug === slug);
}

/** Search and filter posts by query string and/or tags */
export function searchPosts(
  source: BlogPost[],
  query: string,
  activeTags: string[]
): BlogPost[] {
  let results = source;

  if (query) {
    const q = query.toLowerCase();
    // Word-boundary regex for full-text body search to avoid substring false positives
    const wordPattern = new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q)) ||
        wordPattern.test(searchData[p.slug] ?? '')
    );
  }

  if (activeTags.length > 0) {
    results = results.filter((p) =>
      activeTags.some((tag) => p.tags?.includes(tag))
    );
  }

  return results;
}

// Backward-compatible named export
export const posts = allPosts;
