
import { config, collection, singleton, fields } from '@keystatic/core';
import { block, mark } from '@keystatic/core/content-components';

// Author options for the multiselect field.
// Source: src/data/authors.json (managed via Keystatic Authors singleton).
// authors.ts imports this JSON automatically — no manual sync needed.
const authorOptions = [
  { label: 'Rich Mosko', value: 'rich' },
  { label: 'Claude', value: 'claude' },
  { label: 'Keith Holleman', value: 'keith' },
];

// Use GitHub mode in production, local mode in development.
// import.meta.env.PROD is reliably set by Vite/Astro at build time.
const hasGitHubConfig = import.meta.env?.PROD ?? false;

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
          directory: 'public/images/posts',
          publicPath: '/images/posts/',
          transformFilename: (originalFilename) => originalFilename,
          description: 'Upload a new image — committed to /images/posts/{slug}/. Leave "Hero Image Path" empty to use this automatically.',
        }),
        imageAspectRatio: fields.text({
          label: 'Image Aspect Ratio',
          description: 'Common ratios: 16/9 (default), 4/3, 1/1, 21/9, 6/4',
          defaultValue: '16/9',
        }),
        authorId: fields.multiselect({
          label: 'Author(s)',
          options: authorOptions,
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
          directory: 'public/images/projects',
          publicPath: '/images/projects/',
          transformFilename: (originalFilename) => originalFilename,
          description: 'Upload a new image — committed to /images/projects/{slug}/.',
        }),
        imageAspectRatio: fields.text({
          label: 'Image Aspect Ratio',
          description: 'Common ratios: 16/9, 4/3, 1/1, 21/9',
          defaultValue: '16/9',
        }),
        authorId: fields.multiselect({
          label: 'Author(s)',
          options: authorOptions,
          defaultValue: ['rich'],
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

  singletons: {
    authors: singleton({
      label: 'Authors',
      path: 'src/data/authors',
      format: 'json',
      schema: {
        authors: fields.array(
          fields.object({
            id: fields.text({ label: 'ID (slug)', description: 'Unique identifier, e.g., "rich", "claude"' }),
            name: fields.text({ label: 'Display Name' }),
            bio: fields.text({ label: 'Bio', multiline: true }),
            avatar: fields.text({ label: 'Avatar Path', description: 'e.g., /images/profiles/profile-rich.jpeg' }),
            socials: fields.array(
              fields.object({
                platform: fields.select({
                  label: 'Platform',
                  options: [
                    { label: 'GitHub', value: 'github' },
                    { label: 'Instagram', value: 'instagram' },
                    { label: 'LinkedIn', value: 'linkedin' },
                    { label: 'Twitter/X', value: 'twitter' },
                    { label: 'Website', value: 'website' },
                  ],
                  defaultValue: 'github',
                }),
                url: fields.url({ label: 'URL' }),
                label: fields.text({ label: 'Display Label' }),
              }),
              {
                label: 'Social Links',
                itemLabel: (props) => props.fields.label.value || props.fields.platform.value || 'New link',
              }
            ),
          }),
          {
            label: 'Authors',
            itemLabel: (props) => `${props.fields.name.value || 'New author'} (${props.fields.id.value || '?'})`,
          }
        ),
      },
    }),

    siteSettings: singleton({
      label: 'Site Settings',
      path: 'src/data/site-settings',
      format: 'json',
      schema: {
        siteTitle: fields.text({ label: 'Site Title', defaultValue: 'Hi, My Name Is Rich' }),
        siteTagline: fields.text({ label: 'Tagline', defaultValue: 'A personal blog about travel, design, and projects' }),
        siteUrl: fields.url({ label: 'Site URL' }),
        profileImage: fields.text({ label: 'Home Page Profile Image', description: 'Path to the main profile/hero image' }),
        defaultHeroImage: fields.text({ label: 'Default Hero Image', description: 'Fallback image for posts without one', defaultValue: '/images/stock/northern-lights-snowy-mountains.jpg' }),
        featuredPostCount: fields.integer({ label: 'Featured Posts on Home', defaultValue: 3 }),
        metaDescription: fields.text({ label: 'Default Meta Description', multiline: true, description: 'Used for SEO when pages don\'t have their own description' }),
        ogImage: fields.text({ label: 'Default OG Image', description: 'Default social sharing image path' }),
        footerText: fields.text({ label: 'Footer Copyright Text', defaultValue: '© {year} Rich' }),
        adminLinks: fields.array(
          fields.object({
            name: fields.text({ label: 'Link Name' }),
            url: fields.url({ label: 'URL' }),
            description: fields.text({ label: 'Description' }),
          }),
          {
            label: 'Admin Dashboard Links',
            itemLabel: (props) => props.fields.name.value || 'New link',
          }
        ),
      },
    }),

    // Categories are managed directly in src/data/categories.ts (not via Keystatic)
  },
});
