import type { BlogPost, Category } from '../types';

// MDX module shape: each .mdx file exports frontmatter + a default React component
interface MdxModule {
  default: React.ComponentType;
  frontmatter: {
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
    categories: Category[];
    featured?: boolean;
    image?: string;
    authorId: string;
  };
}

// Build-time glob import: all .mdx files as compiled modules
const postModules = import.meta.glob<MdxModule>('../content/posts/*.mdx', {
  eager: true,
});

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
    readTime: frontmatter.readTime,
    categories: frontmatter.categories,
    featured: frontmatter.featured ?? false,
    image: frontmatter.image || undefined,
    authorId: frontmatter.authorId,
    content: Content,
  };
}

// Parse all posts once, sorted newest-first
const allPosts: BlogPost[] = Object.entries(postModules)
  .map(([path, mod]) => parsePost(path, mod))
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
