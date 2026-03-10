import fm from 'front-matter';
import type { BlogPost, Category } from '../types';

// Build-time glob import: all .md files as raw strings
const postFiles = import.meta.glob('../content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Shape of the YAML frontmatter
interface PostFrontmatter {
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  categories: Category[];
  featured?: boolean;
  image?: string;
  authorId: string;
}

function parsePost(filePath: string, raw: string): BlogPost {
  const { attributes, body } = fm<PostFrontmatter>(raw);

  // Derive slug from filename: '../content/posts/digital-declutter.md' → 'digital-declutter'
  const slug = filePath.split('/').pop()!.replace(/\.md$/, '');

  return {
    id: slug,
    slug,
    title: attributes.title,
    excerpt: attributes.excerpt,
    date: attributes.date,
    readTime: attributes.readTime,
    categories: attributes.categories,
    featured: attributes.featured ?? false,
    image: attributes.image || undefined,
    authorId: attributes.authorId,
    content: body.trim(),
  };
}

// Parse all posts once, sorted newest-first
const allPosts: BlogPost[] = Object.entries(postFiles)
  .map(([path, raw]) => parsePost(path, raw))
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

/** Get all posts, sorted newest-first */
export function getAllPosts(): BlogPost[] {
  return allPosts;
}

/** Get a single post by slug, or undefined */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return allPosts.find((p) => p.slug === slug);
}

// Backward-compatible named export
export const posts = allPosts;
