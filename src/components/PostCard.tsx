import { Link } from 'react-router-dom';
import { authors } from '../data/authors';
import { categoryColors, categoryConfig } from '../data/categories';
import type { BlogPost } from '../types';

const DEFAULT_IMAGE = '/images/stock/northern-lights-snowy-mountains.jpg';

interface PostCardProps {
  post: BlogPost;
  variant?: 'default' | 'large' | 'compact';
}

export default function PostCard({ post, variant = 'default' }: PostCardProps) {
  const image = post.image || DEFAULT_IMAGE;
  const author = authors[post.authorId];

  const isLarge = variant === 'large';
  const isCompact = variant === 'compact';

  return (
    <Link
      to={`/post/${post.slug}`}
      className={`group flex flex-col items-start ${
        isLarge ? 'lg:h-full gap-4' : isCompact ? 'gap-2' : 'gap-4'
      }`}
    >
      {/* Thumbnail */}
      <div
        className={`w-full overflow-hidden rounded-xl ${
          isLarge
            ? 'aspect-[6/4] lg:aspect-auto lg:flex-1 lg:min-h-0'
            : isCompact
              ? 'aspect-[16/9]'
              : 'aspect-[6/4]'
        }`}
      >
        <img
          src={image}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Title → badges → author + date */}
      <div className="flex flex-col gap-2 w-full shrink-0">
        <h3
          className={`font-medium text-content leading-snug group-hover:text-accent transition-colors ${
            isLarge ? 'text-xl sm:text-2xl' : isCompact ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'
          }`}
        >
          {post.title}
        </h3>

        {/* Category badges — left justified */}
        <div className="flex flex-wrap gap-1.5">
          {post.categories.map((cat) => (
            <span
              key={cat}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[cat]}`}
            >
              {categoryConfig[cat].label}
            </span>
          ))}
        </div>

        {/* Author + date */}
        <div className="flex items-center gap-3">
          {author && (
            <div className="flex items-center gap-2">
              <img
                src={author.avatar}
                alt={author.name}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-sm font-medium text-content">
                {author.name}
              </span>
            </div>
          )}
          <time
            dateTime={post.date}
            className="text-sm font-medium text-accent"
          >
            {new Date(post.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </time>
        </div>
      </div>
    </Link>
  );
}
