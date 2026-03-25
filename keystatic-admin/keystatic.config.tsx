/* eslint-disable @typescript-eslint/no-unused-vars */
import { config, collection, fields } from '@keystatic/core';
import { block, mark } from '@keystatic/core/content-components';

// Detect GitHub mode: use NEXT_PUBLIC_ var since it's available on both
// client and server in Next.js. Non-NEXT_PUBLIC_ vars (CLIENT_ID, SECRET)
// are only available server-side in the API route handler.
const hasGitHubConfig = !!process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG;

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
          description: 'Path to existing image (e.g., /images/stock/my-photo.jpg). Leave empty for default. Use "Upload New Image" below to add a new image.',
        }),
        imageUpload: fields.image({
          label: 'Upload New Image',
          directory: 'public/images/stock',
          publicPath: '/images/stock/',
          description: 'Upload a new image — it will be committed to the repo. After uploading, copy the path to "Hero Image Path" above.',
        }),
        imageAspectRatio: fields.text({
          label: 'Image Aspect Ratio',
          description: 'Common ratios: 16/9 (default), 4/3, 1/1, 21/9, 6/4',
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
          description: 'Path to existing image (e.g., /images/stock/my-project.jpg). Use "Upload" below to add new.',
        }),
        imageUpload: fields.image({
          label: 'Upload New Image',
          directory: 'public/images/stock',
          publicPath: '/images/stock/',
          description: 'Upload a new image — committed to repo. Copy path to "Hero Image Path" after.',
        }),
        imageAspectRatio: fields.text({
          label: 'Image Aspect Ratio',
          description: 'Common ratios: 16/9, 4/3, 1/1, 21/9',
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
        groupOrder: fields.array(fields.text({ label: 'Group' }), {
          label: 'Group Display Order',
          description: 'Order in which task groups are displayed on the project page',
          itemLabel: (props) => props.value || 'New group',
        }),
        tasks: fields.array(
          fields.object({
            title: fields.text({ label: 'Task Title' }),
            completed: fields.checkbox({ label: 'Completed', defaultValue: false }),
            group: fields.text({ label: 'Group' }),
          }),
          {
            label: 'Tasks (legacy — use Vikunja for live tracking)',
            itemLabel: (props) => `${props.fields.completed.value ? '✅' : '⬜'} ${props.fields.title.value || 'New task'}`,
          }
        ),
        content: fields.mdx({ label: 'Content' }),
      },
    }),
  },
});
