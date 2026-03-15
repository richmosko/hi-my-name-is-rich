export type Category = 'travel' | 'design' | 'finance' | 'projects' | 'musings' | 'cool-shit' | 'food';

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
  tags?: string[];
}

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  group?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url?: string;
  image?: string;
  status: 'active' | 'completed';
  startDate?: string;
  completedDate?: string;
  tasks: ProjectTask[];
  content?: React.ComponentType<{ components?: MDXComponents }>;
}

/** Derived completion percentage (0–100) */
export function getProjectCompletion(project: Project): number {
  if (project.tasks.length === 0) return 0;
  const done = project.tasks.filter((t) => t.completed).length;
  return Math.round((done / project.tasks.length) * 100);
}
