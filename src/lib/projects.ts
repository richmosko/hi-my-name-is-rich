import type { Project, ProjectTask } from '../types';
import type { MDXComponents } from 'mdx/types';

// MDX module shape: each .mdx file exports frontmatter + a default React component
interface ProjectMdxModule {
  default: React.ComponentType<{ components?: MDXComponents }>;
  frontmatter: {
    name: string;
    description: string;
    excerpt?: string;
    url?: string;
    image?: string;
    imageAspectRatio?: string;
    status: 'active' | 'completed';
    startDate?: string;
    completedDate?: string;
    tasks?: Array<{ title: string; completed: boolean; group?: string }>;
  };
}

// Build-time glob import: all .mdx files as compiled modules
const projectModules = import.meta.glob<ProjectMdxModule>(
  '../content/projects/*.mdx',
  { eager: true },
);

function parseProject(filePath: string, mod: ProjectMdxModule): Project {
  const { frontmatter, default: Content } = mod;

  // Derive id from filename: '../content/projects/focus-timer.mdx' → 'focus-timer'
  const id = filePath.split('/').pop()!.replace(/\.mdx$/, '');

  // Auto-generate task IDs from index
  const tasks: ProjectTask[] = (frontmatter.tasks ?? []).map((t, i) => ({
    id: `${id}-${i + 1}`,
    title: t.title,
    completed: t.completed,
    group: t.group,
  }));

  return {
    id,
    name: frontmatter.name,
    description: frontmatter.description,
    excerpt: frontmatter.excerpt,
    url: frontmatter.url,
    image: frontmatter.image || undefined,
    imageAspectRatio: frontmatter.imageAspectRatio,
    status: frontmatter.status,
    startDate: frontmatter.startDate,
    completedDate: frontmatter.completedDate,
    tasks,
    content: Content,
  };
}

// Parse all projects once, sorted: active first (by startDate desc), then completed (by completedDate desc)
const allProjects: Project[] = Object.entries(projectModules)
  .map(([path, mod]) => parseProject(path, mod))
  .sort((a, b) => {
    // Active projects first
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
    // Within same status, sort by most recent date
    const dateA = a.completedDate || a.startDate || '';
    const dateB = b.completedDate || b.startDate || '';
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

/** Get all projects */
export function getAllProjects(): Project[] {
  return allProjects;
}

/** Get a single project by id (derived from filename) */
export function getProjectById(id: string): Project | undefined {
  return allProjects.find((p) => p.id === id);
}

// Convenient named export
export const projects = allProjects;
