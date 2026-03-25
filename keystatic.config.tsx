/* eslint-disable react-refresh/only-export-components */
import { config, collection, fields } from '@keystatic/core';

// Detect environment — works in both Vite (import.meta.env) and Node (process.env)
const isProduction = typeof import.meta !== 'undefined' && import.meta.env?.PROD;

export default config({
  storage: isProduction
    ? {
        kind: 'github',
        repo: 'richmosko/hi-my-name-is-rich',
      }
    : { kind: 'local' },

  collections: {
    posts: collection({
      label: 'Blog Posts',
      slugField: 'title',
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      schema: {
        title: fields.slug({ name: { label: 'Title' } }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true }),
        date: fields.datetime({ label: 'Publish Date' }),
        readTime: fields.text({
          label: 'Read Time',
          description: 'Auto-calculated by precommit script. Leave empty.',
        }),
        categories: fields.multiselect({
          label: 'Categories',
          options: [
            { label: 'Travel', value: 'travel' },
            { label: 'Design', value: 'design' },
            { label: 'Finance', value: 'finance' },
            { label: 'Projects', value: 'projects' },
            { label: 'Musings', value: 'musings' },
            { label: 'Cool Shit', value: 'cool-shit' },
            { label: 'Food', value: 'food' },
          ],
        }),
        featured: fields.checkbox({ label: 'Featured', defaultValue: false }),
        image: fields.image({
          label: 'Hero Image',
          directory: 'public/images/stock',
          publicPath: '/images/stock/',
          description: 'Leave empty for default stock image',
        }),
        imageAspectRatio: fields.select({
          label: 'Image Aspect Ratio',
          options: [
            { label: '16:9 (default)', value: '16/9' },
            { label: '4:3', value: '4/3' },
            { label: '1:1', value: '1/1' },
            { label: '21:9 (ultrawide)', value: '21/9' },
          ],
          defaultValue: '16/9',
        }),
        authorId: fields.multiselect({
          label: 'Authors',
          options: [
            { label: 'Rich Mosko', value: 'rich' },
            { label: 'Claude', value: 'claude' },
            { label: 'Keith', value: 'keith' },
          ],
          defaultValue: ['rich'],
        }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value || 'New tag',
        }),
        content: fields.mdx({
          label: 'Content',
          options: {
            image: {
              directory: 'public/images/stock',
              publicPath: '/images/stock/',
            },
          },
        }),
      },
    }),

    projects: collection({
      label: 'Projects',
      slugField: 'name',
      path: 'src/content/projects/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      schema: {
        name: fields.slug({ name: { label: 'Project Name' } }),
        description: fields.text({ label: 'Description' }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true }),
        image: fields.image({
          label: 'Hero Image',
          directory: 'public/images/stock',
          publicPath: '/images/stock/',
        }),
        imageAspectRatio: fields.select({
          label: 'Image Aspect Ratio',
          options: [
            { label: '16:9', value: '16/9' },
            { label: '21:9', value: '21/9' },
          ],
          defaultValue: '16/9',
        }),
        url: fields.url({ label: 'Project URL' }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Completed', value: 'completed' },
          ],
          defaultValue: 'active',
        }),
        startDate: fields.date({ label: 'Start Date' }),
        completedDate: fields.date({ label: 'Completed Date' }),
        vikunjaProjectId: fields.integer({
          label: 'Vikunja Project ID',
          description: 'Links to Vikunja task tracker for live task stats',
        }),
        content: fields.mdx({ label: 'Content' }),
      },
    }),
  },
});
