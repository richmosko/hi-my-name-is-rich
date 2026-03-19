import { useState } from 'react';

interface TagFilterProps {
  tags: string[];
  activeTags: string[];
  onToggle: (tag: string) => void;
}

export default function TagFilter({ tags, activeTags, onToggle }: TagFilterProps) {
  const [expanded, setExpanded] = useState(false);

  if (tags.length === 0) return null;

  // Auto-expand if any tags are active
  const isOpen = expanded || activeTags.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setExpanded(!isOpen)}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-content-muted hover:text-content transition-colors"
      >
        <span>Filter by Tag</span>
        {activeTags.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold normal-case tracking-normal">
            {activeTags.length}
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
          {tags.map((tag) => {
            const isActive = activeTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => onToggle(tag)}
                aria-pressed={isActive}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-accent text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
