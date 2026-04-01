import { useState, useMemo } from 'react';
import { searchPosts } from '../lib/posts';
import { categoryConfig } from '../data/categories';
import PostCard from './PostCard';
import type { BlogPost } from '../types';

interface PostsListIslandProps {
  posts: BlogPost[];
  category?: string;
  initialQuery?: string;
  initialTag?: string;
}

type SortMode = 'newest' | 'oldest' | 'title-az' | 'title-za';

export default function PostsListIsland({ posts, category, initialQuery = '', initialTag = '' }: PostsListIslandProps) {
  const [query, setQuery] = useState(initialQuery);
  const [activeTags, setActiveTags] = useState<string[]>(initialTag ? [initialTag] : []);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [sort, setSort] = useState<SortMode>('newest');
  const [showCatFilter, setShowCatFilter] = useState(false);
  const [showTagFilter, setShowTagFilter] = useState(false);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    posts.forEach(p => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
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
      {/* Search + Filter + Sort row */}
      <div className="flex flex-wrap items-start gap-3 w-full max-w-[1250px] mx-auto">
        {/* Sort */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-content-muted font-medium">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="text-xs bg-surface border border-edge rounded-lg px-2 py-1.5 text-content"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title-az">Title A→Z</option>
            <option value="title-za">Title Z→A</option>
          </select>
        </div>

        {/* Category filter toggle */}
        {!category && (
          <button
            onClick={() => setShowCatFilter(!showCatFilter)}
            className="text-xs uppercase tracking-wider text-content-muted font-semibold flex items-center gap-1 cursor-pointer"
          >
            Filter by Category
            <svg className={`w-3 h-3 transition-transform ${showCatFilter ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {/* Tag filter toggle */}
        <button
          onClick={() => setShowTagFilter(!showTagFilter)}
          className="text-xs uppercase tracking-wider text-content-muted font-semibold flex items-center gap-1 cursor-pointer"
        >
          Filter by Tag
          <svg className={`w-3 h-3 transition-transform ${showTagFilter ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Category pills */}
      {showCatFilter && !category && (
        <div className="flex flex-wrap gap-2 max-w-[1250px] mx-auto w-full">
          {Object.entries(categoryConfig).map(([key, config]) => (
            <button
              key={key}
              onClick={() => toggleCategory(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                activeCategories.includes(key)
                  ? config.badgeColors
                  : 'bg-surface-secondary text-content-muted hover:text-content'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>
      )}

      {/* Tag pills */}
      {showTagFilter && (
        <div className="flex flex-wrap gap-2 max-w-[1250px] mx-auto w-full">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                activeTags.includes(tag)
                  ? 'bg-accent text-white'
                  : 'bg-surface-secondary text-content-muted hover:text-content'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

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
          <PostCard key={post.id} post={post} />
        ))}
        {filteredPosts.length === 0 && (
          <p className="text-content-muted text-center py-8">No posts found.</p>
        )}
      </div>
    </div>
  );
}
