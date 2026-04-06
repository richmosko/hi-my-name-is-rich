import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Helper: YAML parses bare values (no quotes) as null for empty fields
// and as Date objects for date-like values. This handles all cases.
const yamlString = z.union([
  z.string(),
  z.null().transform(() => undefined),
]).optional();

const yamlDate = z.union([
  z.string(),
  // YAML parses bare dates (2026-03-24) as Date at UTC midnight.
  // Format WITHOUT timezone so parseLocalDate treats it as local time,
  // matching the original Vite behavior.
  z.date().transform((d) => {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }),
  z.null().transform(() => undefined),
]).optional();

const yamlStringArray = z.union([
  z.array(z.string()),
  z.string().transform((s) => [s]),
]);

const yamlAuthorId = z.union([
  z.string().transform((s) => [s]),
  z.array(z.string()),
]);

const posts = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    date: z.union([
      z.string(),
      // Keep bare dates as local (YYYY-MM-DD), preserve full timestamps as-is
      z.date().transform((d) => {
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, '0');
        const day = String(d.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }),
    ]),
    readTime: yamlString.default('1 min read'),
    categories: yamlStringArray,
    featured: z.boolean().default(false),
    image: yamlString,
    imageUpload: yamlString,
    imageAspectRatio: yamlString.default('16/9'),
    authorId: yamlAuthorId,
    tags: z.array(z.string()).default([]),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    excerpt: yamlString,
    image: yamlString,
    imageUpload: yamlString,
    imageAspectRatio: yamlString.default('16/9'),
    authorId: yamlAuthorId.optional(),
    url: yamlString,
    status: z.enum(['active', 'completed']),
    startDate: yamlDate,
    completedDate: yamlDate,
    linearProjectId: yamlString,
    groupOrder: z.array(z.string()).optional(),
    tasks: z.array(z.object({
      title: z.string(),
      completed: z.boolean().default(false),
      group: yamlString,
    })).default([]),
  }),
});

export const collections = { posts, projects };
