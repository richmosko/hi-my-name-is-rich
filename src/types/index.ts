export type Category = 'travel' | 'design' | 'goals' | 'projects' | 'musings' | 'cool-shit' | 'food';

export interface Author {
  id: string;
  name: string;
  avatar: string;
}

import type { MDXComponents } from 'mdx/types';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: React.ComponentType<{ components?: MDXComponents }>;
  date: string;
  readTime: string;
  categories: Category[];
  featured?: boolean;
  image?: string;
  authorId: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url?: string;
  status: 'active' | 'completed' | 'archived';
}
