import { Link, useSearchParams } from 'react-router-dom';
import { posts, searchPosts } from '../lib/posts';
import { authors } from '../data/authors';
import { categoryColors, categoryConfig } from '../data/categories';
import { parseLocalDate } from '../lib/dateUtils';
import TagFilter from '../components/TagFilter';
import CategoryFilter from '../components/CategoryFilter';
import type { BlogPost, Category } from '../types';

function getCategoryDescription(category?: Category): string | undefined {
  if (!category) return undefined;
  return categoryConfig[category]?.description;
}

const DEFAULT_IMAGE = '/images/stock/northern-lights-snowy-mountains.jpg';

function MiniPostCard({
  post,
  onTagClick,
}: {
  post: BlogPost;
  onTagClick?: (tag: string) => void;
}) {
  const image = post.image || DEFAULT_IMAGE;
  const author = authors[post.authorId];

  return (
    <Link
      to={`/post/${post.slug}`}
      className="group flex gap-4 sm:gap-5 items-start"
    >
      {/* Mini thumbnail — fixed height, 6:4 aspect */}
      <div className="shrink-0 h-[80px] sm:h-[100px] aspect-[6/4] overflow-hidden rounded-lg">
        <img
          src={image}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Info — confined to the height of the mini thumbnail */}
      <div className="flex-1 flex flex-col justify-between self-stretch min-w-0">
        <h3 className="text-base sm:text-lg font-medium text-content leading-snug group-hover:text-accent transition-colors line-clamp-2">
          {post.title}
        </h3>

        {/* Category badges + tags — left justified */}
        <div className="flex flex-wrap gap-1.5">
          {post.categories.map((cat) => (
            <span
              key={cat}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[cat] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {categoryConfig[cat]?.label ?? cat}
            </span>
          ))}
          {post.tags?.map((tag) => (
            <button
              key={tag}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTagClick?.(tag);
              }}
              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              {tag}
            </button>
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
            {parseLocalDate(post.date).toLocaleDateString('en-US', {
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
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const activeTags = searchParams.getAll('tag');
  const activeCategories = searchParams.getAll('cat') as Category[];
  const description = getCategoryDescription(category);

  // Stage 1: category filter (from route prop or from user-selected filter)
  const categoryPosts = category
    ? posts.filter((p) => p.categories.includes(category))
    : activeCategories.length > 0
      ? posts.filter((p) => activeCategories.some((c) => p.categories.includes(c)))
      : posts;

  // Stage 2: search + tag filter
  const filteredPosts = searchPosts(categoryPosts, query, activeTags);

  // Derive all unique tags from category-scoped posts
  const tagSet = new Set<string>();
  categoryPosts.forEach((p) => p.tags?.forEach((t) => tagSet.add(t)));
  const availableTags = Array.from(tagSet).sort();

  // Derive all unique categories from all posts (only for "All Posts" view)
  const catSet = new Set<Category>();
  posts.forEach((p) => p.categories.forEach((c) => catSet.add(c)));
  const availableCategories = Array.from(catSet).sort() as Category[];

  function handleTagToggle(tag: string) {
    setSearchParams((prev) => {
      const tags = prev.getAll('tag');
      const next = new URLSearchParams(prev);
      next.delete('tag');
      if (tags.includes(tag)) {
        tags.filter((t) => t !== tag).forEach((t) => next.append('tag', t));
      } else {
        tags.forEach((t) => next.append('tag', t));
        next.append('tag', tag);
      }
      return next;
    });
  }

  function handleCategoryToggle(cat: Category) {
    setSearchParams((prev) => {
      const cats = prev.getAll('cat');
      const next = new URLSearchParams(prev);
      next.delete('cat');
      if (cats.includes(cat)) {
        cats.filter((c) => c !== cat).forEach((c) => next.append('cat', c));
      } else {
        cats.forEach((c) => next.append('cat', c));
        next.append('cat', cat);
      }
      return next;
    });
  }

  function clearSearch() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('q');
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-8 items-center">
      <div className="w-full max-w-[640px]">
        <h2 className="text-2xl sm:text-3xl font-bold text-content">
          {query ? `Search Results: "${query}"` : title}
        </h2>
        {description && !query && (
          <p className="text-content-secondary mt-1 text-sm">{description}</p>
        )}
        <p className="text-content-muted mt-1 text-xs">
          {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
          {query && (
            <>
              {' '}&middot;{' '}
              <button onClick={clearSearch} className="text-accent hover:underline">
                Clear search
              </button>
            </>
          )}
        </p>
      </div>

      {/* Hero image */}
      <div className="w-full max-w-[1250px] rounded-2xl overflow-hidden">
        <img
          src="/images/stock/profile-rich-writing.jpg"
          alt="Rich writing"
          className="w-full h-auto object-cover aspect-[21/9]"
        />
      </div>

      {/* Category + Tag filters */}
      {((!category && availableCategories.length > 0) || availableTags.length > 0) && (
        <div className="w-full max-w-[640px] flex gap-8">
          {!category && availableCategories.length > 0 && (
            <CategoryFilter
              categories={availableCategories}
              activeCategories={activeCategories}
              onToggle={handleCategoryToggle}
            />
          )}
          {availableTags.length > 0 && (
            <TagFilter
              tags={availableTags}
              activeTags={activeTags}
              onToggle={handleTagToggle}
            />
          )}
        </div>
      )}

      {filteredPosts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-content-muted">
            {query || activeTags.length > 0
              ? 'No posts match your search.'
              : 'No posts yet in this category.'}
          </p>
        </div>
      ) : (
        <div className="w-full max-w-[640px] flex flex-col gap-6">
          {filteredPosts.map((post) => (
            <MiniPostCard
              key={post.id}
              post={post}
              onTagClick={handleTagToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
