import { Link } from 'react-router-dom';
import type { BlogPost, Category } from '../types';

const categoryColors: Record<Category, string> = {
  posts: 'bg-accent/20 text-accent',
  travel: 'bg-emerald-500/20 text-emerald-400',
  design: 'bg-purple-500/20 text-purple-400',
  goals: 'bg-amber-500/20 text-amber-400',
};

interface PostCardProps {
  post: BlogPost;
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link
      to={`/post/${post.slug}`}
      className="group block p-6 rounded-xl bg-surface-card border border-edge
                 hover:border-accent/30 hover:bg-surface-secondary
                 transition-all duration-200"
    >
      <div className="flex flex-wrap gap-2 mb-3">
        {post.categories.map((cat) => (
          <span
            key={cat}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[cat]}`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </span>
        ))}
      </div>
      <h3 className="text-lg font-semibold text-content group-hover:text-accent transition-colors mb-2">
        {post.title}
      </h3>
      <p className="text-sm text-content-secondary leading-relaxed mb-4">
        {post.excerpt}
      </p>
      <div className="flex items-center gap-3 text-xs text-content-muted">
        <time dateTime={post.date}>
          {new Date(post.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </time>
        <span>&middot;</span>
        <span>{post.readTime}</span>
      </div>
    </Link>
  );
}
