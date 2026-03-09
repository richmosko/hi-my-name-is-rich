import { Link } from 'react-router-dom';
import { authors } from '../data/authors';
import { categoryColors, categoryConfig } from '../data/categories';
import type { BlogPost } from '../types';

const DEFAULT_IMAGE = '/images/posts/northern-lights-snowy-mountains.jpg';

interface PostCardProps {
  post: BlogPost;
}

export default function PostCard({ post }: PostCardProps) {
  const image = post.image || DEFAULT_IMAGE;
  const author = authors[post.authorId];

  return (
    <Link
      to={`/post/${post.slug}`}
      className="group flex flex-col gap-4 items-start"
    >
      {/* 6:4 thumbnail */}
      <div className="w-full aspect-[6/4] overflow-hidden rounded-xl">
        <img
          src={image}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Title → badges → author + date */}
      <div className="flex flex-col gap-2 w-full">
        <h3 className="text-xl font-medium text-content leading-snug group-hover:text-accent transition-colors">
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
