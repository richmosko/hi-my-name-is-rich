import type { Category } from '../types';

export interface CategoryConfig {
  label: string;
  description: string;
  colors: string;
  badgeColors: string;
}

export const categoryConfig: Record<Category, CategoryConfig> = {
  travel: {
    label: 'Travel',
    description: 'Stories and photos from places near and far.',
    colors: 'bg-emerald-500/10 border-emerald-500/20',
    badgeColors: 'bg-emerald-500/10 text-emerald-700',
  },
  design: {
    label: 'Design',
    description: 'Thoughts on visual design, systems, and craft.',
    colors: 'bg-purple-500/10 border-purple-500/20',
    badgeColors: 'bg-purple-500/10 text-purple-700',
  },
  goals: {
    label: 'Goals',
    description: 'Reflections on personal growth and ambition.',
    colors: 'bg-amber-500/10 border-amber-500/20',
    badgeColors: 'bg-amber-500/10 text-amber-700',
  },
  projects: {
    label: 'Projects',
    description: "What I'm working on in my free time.",
    colors: 'bg-sky-500/10 border-sky-500/20',
    badgeColors: 'bg-sky-500/10 text-sky-700',
  },
  musings: {
    label: 'Musings',
    description: 'Thoughts on life and the human condition.',
    colors: 'bg-rose-500/10 border-rose-500/20',
    badgeColors: 'bg-rose-500/10 text-rose-700',
  },
  'cool-shit': {
    label: 'Cool Shit',
    description: "Just cool shit I've seen lately.",
    colors: 'bg-orange-500/10 border-orange-500/20',
    badgeColors: 'bg-orange-500/10 text-orange-700',
  },
  food: {
    label: 'Food',
    description: 'Tinkering with tastes.',
    colors: 'bg-lime-500/10 border-lime-500/20',
    badgeColors: 'bg-lime-500/10 text-lime-700',
  },
};

/** Helper to get badge color classes for a category */
export const categoryColors: Record<Category, string> = Object.fromEntries(
  Object.entries(categoryConfig).map(([key, val]) => [key, val.badgeColors])
) as Record<Category, string>;
