/* eslint-disable @typescript-eslint/no-unused-vars */
import { config, collection, fields } from '@keystatic/core';
import { block, mark } from '@keystatic/core/content-components';

// Use local mode during build (no GitHub credentials needed).
// At runtime, GitHub mode activates when the env vars are present.
const hasGitHubConfig = typeof process !== 'undefined' &&
  process.env?.KEYSTATIC_GITHUB_CLIENT_ID &&
  process.env?.KEYSTATIC_GITHUB_CLIENT_SECRET;

export default config({
  storage: hasGitHubConfig
    ? {
        kind: 'github',
        repo: 'richmosko/hi-my-name-is-rich',
        branchPrefix: 'keystatic/',
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
        image: fields.text({
          label: 'Hero Image Path',
          description: 'Path to image (e.g., /images/stock/my-photo.jpg). Leave empty for default.',
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
        authorId: fields.text({
          label: 'Author(s)',
          description: 'Single author: "rich" or multiple: ["rich","claude"]. Options: rich, claude, keith',
          defaultValue: 'rich',
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
          components: {
            YouTube: block({
              label: 'YouTube Embed',
              schema: {
                id: fields.text({ label: 'Video ID' }),
                title: fields.text({ label: 'Title (optional)' }),
              },
            }),
            Gallery: block({
              label: 'Image Gallery',
              schema: {
                path: fields.text({ label: 'Album Path (e.g., /images/albums/my-trip)' }),
                aspectRatio: fields.text({ label: 'Aspect Ratio', defaultValue: '4/3' }),
              },
            }),
            Video: block({
              label: 'Video Player',
              schema: {
                src: fields.text({ label: 'Video Source Path' }),
                caption: fields.text({ label: 'Caption (optional)' }),
              },
            }),
            big: mark({ label: 'Big Text', icon: null as never, schema: {}, tag: 'big' }),
            u: mark({ label: 'Underline', icon: null as never, schema: {}, tag: 'u' }),
            mark: mark({ label: 'Highlight', icon: null as never, schema: {}, tag: 'mark' }),
            small: mark({ label: 'Small Text', icon: null as never, schema: {}, tag: 'small' }),
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
        image: fields.text({
          label: 'Hero Image Path',
          description: 'Path to image (e.g., /images/stock/my-project.jpg)',
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
