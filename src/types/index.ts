export type Category = 'posts' | 'travel' | 'design' | 'goals';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  categories: Category[];
  featured?: boolean;
  image?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url?: string;
  status: 'active' | 'completed' | 'archived';
}
