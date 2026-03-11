import { Link } from 'react-router-dom';
import { posts } from '../lib/posts';
import { authors } from '../data/authors';
import { categoryColors, categoryConfig } from '../data/categories';
import PostCard from '../components/PostCard';
import type { BlogPost, Category } from '../types';

const DEFAULT_IMAGE = '/images/stock/northern-lights-snowy-mountains.jpg';

function MiniPostCard({ post }: { post: BlogPost }) {
  const image = post.image || DEFAULT_IMAGE;
  const author = authors[post.authorId];

  return (
    <Link
      to={`/post/${post.slug}`}
      className="group flex gap-5 items-start"
    >
      {/* Mini thumbnail — fixed height 100px, 6:4 aspect */}
      <div className="shrink-0 h-[100px] aspect-[6/4] overflow-hidden rounded-lg">
        <img
          src={image}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Info — confined to the height of the mini thumbnail */}
      <div className="flex-1 flex flex-col justify-between self-stretch min-w-0">
        <h3 className="text-lg font-medium text-content leading-snug group-hover:text-accent transition-colors line-clamp-2">
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

interface PostsListProps {
  category?: Category;
  title: string;
}

export default function PostsList({ category, title }: PostsListProps) {
  const filteredPosts = category
    ? posts.filter((p) => p.categories.includes(category))
    : posts;

  const [featuredPost, ...remainingPosts] = filteredPosts;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="text-3xl font-bold text-content">{title}</h2>
        <p className="text-content-secondary mt-2 text-sm">
          {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-content-muted">No posts yet in this category.</p>
        </div>
      ) : (
        <>
          {/* Featured latest post — full width */}
          <PostCard post={featuredPost} />

          {/* Remaining posts — mini-postcard rows */}
          {remainingPosts.length > 0 && (
            <div className="flex flex-col gap-6">
              {remainingPosts.map((post) => (
                <MiniPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
