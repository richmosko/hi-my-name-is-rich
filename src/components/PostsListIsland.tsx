import { useState, useMemo } from 'react';
import { searchPosts } from '../lib/posts';
import { authors } from '../data/authors';
import { categoryColors, categoryConfig } from '../data/categories';
import { parseLocalDate } from '../lib/dateUtils';
import CategoryFilter from './CategoryFilter';
import TagFilter from './TagFilter';
import type { BlogPost, Category } from '../types';

const DEFAULT_IMAGE = '/images/stock/northern-lights-snowy-mountains.jpg';

function MiniPostCard({ post, onTagClick }: { post: BlogPost; onTagClick?: (tag: string) => void }) {
  const image = post.image || DEFAULT_IMAGE;
  const authorIds = Array.isArray(post.authorId) ? post.authorId : [post.authorId];
  const postAuthors = authorIds.map((id) => authors[id]).filter(Boolean);

  return (
    <a href={`/post/${post.slug}`} className="group flex gap-4 sm:gap-5 items-start">
      {/* Mini thumbnail */}
      <div className="shrink-0 h-[80px] sm:h-[100px] aspect-[6/4] overflow-hidden rounded-lg">
        <img src={image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between self-stretch min-w-0">
        <h3 className="text-base sm:text-lg font-medium text-content leading-snug group-hover:text-accent transition-colors line-clamp-2">
          {post.title}
        </h3>

        {/* Category badges + tags */}
        <div className="flex flex-wrap gap-1.5">
          {post.categories.map((cat) => (
            <span key={cat} className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[cat] ?? 'bg-surface-secondary text-content-muted'}`}>
              {categoryConfig[cat]?.label ?? cat}
            </span>
          ))}
          {post.tags?.map((tag) => (
            <button
              key={tag}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTagClick?.(tag); }}
              className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-secondary text-content-muted hover:bg-edge transition-colors cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Author(s) + date */}
        <div className="flex items-center gap-3">
          {postAuthors.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {postAuthors.map((a) => (
                  <img key={a.id} src={a.avatar} alt={a.name} className="w-6 h-6 rounded-full object-cover border border-surface" />
                ))}
              </div>
              <span className="text-sm font-medium text-content">
                {postAuthors.map((a) => a.name).join(' & ')}
              </span>
            </div>
          )}
          <time dateTime={post.date} className="text-sm font-medium text-accent">
            {parseLocalDate(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </time>
        </div>
      </div>
    </a>
  );
}

interface PostsListIslandProps {
  posts: BlogPost[];
  category?: string;
  initialQuery?: string;
  initialTag?: string;
}

type SortMode = 'newest' | 'oldest' | 'title-az' | 'title-za';

export default function PostsListIsland({ posts, category, initialQuery = '', initialTag = '' }: PostsListIslandProps) {
  // Read URL params client-side (Astro pre-renders with empty params)
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const clientQuery = urlParams?.get('q') || initialQuery;
  const clientTag = urlParams?.get('tag') || initialTag;

  const [query, setQuery] = useState(clientQuery);
  const [activeTags, setActiveTags] = useState<string[]>(clientTag ? [clientTag] : []);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [sort, setSort] = useState<SortMode>('newest');

  // Get all unique tags and categories
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach(p => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [posts]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    posts.forEach(p => p.categories.forEach(c => cats.add(c)));
    return Array.from(cats).sort() as Category[];
  }, [posts]);

  // Filter and sort
  const filteredPosts = useMemo(() => {
    let results = searchPosts(posts, query, activeTags);

    // Category filter (OR logic)
    if (activeCategories.length > 0) {
      results = results.filter(p =>
        activeCategories.some(cat => p.categories.includes(cat as any))
      );
    }

    // Sort
    switch (sort) {
      case 'oldest':
        results = [...results].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'title-az':
        results = [...results].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-za':
        results = [...results].sort((a, b) => b.title.localeCompare(a.title));
        break;
      // 'newest' is default sort from content collections
    }

    return results;
  }, [posts, query, activeTags, activeCategories, sort]);

  const toggleTag = (tag: string) => {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const toggleCategory = (cat: string) => {
    setActiveCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Sort + Category Filter + Tag Filter — inline row */}
      <div className="w-full max-w-[1250px] mx-auto flex flex-col sm:flex-row sm:items-baseline gap-3 sm:gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium text-content-muted whitespace-nowrap">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="text-xs text-content-muted bg-transparent border border-edge rounded px-2 py-1.5 cursor-pointer hover:border-content-muted transition-colors"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title-az">Title (A–Z)</option>
            <option value="title-za">Title (Z–A)</option>
          </select>
        </div>
        {!category && allCategories.length > 0 && (
          <CategoryFilter
            categories={allCategories}
            activeCategories={activeCategories as Category[]}
            onToggle={(cat) => toggleCategory(cat)}
          />
        )}
        {allTags.length > 0 && (
          <TagFilter
            tags={allTags}
            activeTags={activeTags}
            onToggle={toggleTag}
          />
        )}
      </div>

      {/* Results count */}
      {(query || activeTags.length > 0 || activeCategories.length > 0) && (
        <p className="text-xs text-content-muted max-w-[640px] mx-auto w-full">
          {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''}
          {query && <> for &ldquo;{query}&rdquo;</>}
        </p>
      )}

      {/* Post list */}
      <div className="max-w-[640px] mx-auto w-full flex flex-col gap-6">
        {filteredPosts.map(post => (
          <MiniPostCard key={post.id} post={post} onTagClick={toggleTag} />
        ))}
        {filteredPosts.length === 0 && (
          <p className="text-content-muted text-center py-8">No posts found.</p>
        )}
      </div>
    </div>
  );
}
