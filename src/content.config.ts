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
  z.date().transform((d) => d.toISOString()),
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
      z.date().transform((d) => d.toISOString()),
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
    vikunjaProjectId: z.number().optional().nullable(),
    groupOrder: z.array(z.string()).optional(),
    tasks: z.array(z.object({
      title: z.string(),
      completed: z.boolean().default(false),
      group: yamlString,
    })).default([]),
  }),
});

export const collections = { posts, projects };
