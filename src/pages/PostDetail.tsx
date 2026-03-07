import { useParams, Link } from 'react-router-dom';
import { posts } from '../data/posts';
import type { Category } from '../types';

const categoryColors: Record<Category, string> = {
  posts: 'bg-accent/20 text-accent',
  travel: 'bg-emerald-500/20 text-emerald-400',
  design: 'bg-purple-500/20 text-purple-400',
  goals: 'bg-amber-500/20 text-amber-400',
};

export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-content mb-4">
          Post not found
        </h2>
        <Link to="/posts" className="text-accent hover:text-accent-hover">
          &larr; Back to posts
        </Link>
      </div>
    );
  }

  return (
    <article className="flex flex-col gap-8">
      {/* Back link */}
      <Link
        to="/posts"
        className="text-sm text-content-muted hover:text-accent transition-colors inline-flex items-center gap-1"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to posts
      </Link>

      {/* Header */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {post.categories.map((cat) => (
            <span
              key={cat}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[cat]}`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </span>
          ))}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-content leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-content-muted">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </time>
          <span>&middot;</span>
          <span>{post.readTime}</span>
        </div>
      </header>

      {/* Content */}
      <div className="prose-custom flex flex-col gap-4 text-content-secondary leading-relaxed">
        {post.content.split('\n\n').map((paragraph, i) => {
          if (paragraph.startsWith('## ')) {
            return (
              <h2
                key={i}
                className="text-xl font-semibold text-content mt-6"
              >
                {paragraph.replace('## ', '')}
              </h2>
            );
          }
          if (paragraph.startsWith('### ')) {
            return (
              <h3
                key={i}
                className="text-lg font-semibold text-content mt-4"
              >
                {paragraph.replace('### ', '')}
              </h3>
            );
          }
          if (paragraph.startsWith('- ')) {
            const items = paragraph.split('\n');
            return (
              <ul key={i} className="list-disc list-inside space-y-1">
                {items.map((item, j) => (
                  <li key={j} className="text-content-secondary">
                    {item.replace('- ', '')}
                  </li>
                ))}
              </ul>
            );
          }
          // Handle bold text
          const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
          return (
            <p key={i}>
              {parts.map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={j} className="text-content font-semibold">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    </article>
  );
}
