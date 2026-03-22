import { useState } from 'react';
import { categoryConfig } from '../data/categories';
import type { Category } from '../types';

interface CategoryFilterProps {
  categories: Category[];
  activeCategories: Category[];
  onToggle: (category: Category) => void;
}

export default function CategoryFilter({ categories, activeCategories, onToggle }: CategoryFilterProps) {
  const [expanded, setExpanded] = useState(false);

  if (categories.length === 0) return null;

  const isOpen = expanded || activeCategories.length > 0;

  return (
    <div className="min-w-fit flex flex-col gap-2">
      <button
        onClick={() => setExpanded(!isOpen)}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-content-muted hover:text-content transition-colors whitespace-nowrap"
      >
        <span>Filter by Category</span>
        {activeCategories.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold normal-case tracking-normal">
            {activeCategories.length}
          </span>
        )}
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isActive = activeCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => onToggle(cat)}
                aria-pressed={isActive}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-accent text-white'
                    : (categoryConfig[cat]?.badgeColors ?? 'bg-surface-secondary text-content-muted') + ' hover:opacity-80'
                }`}
              >
                {categoryConfig[cat]?.label ?? cat}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
