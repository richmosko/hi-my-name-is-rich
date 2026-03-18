import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { posts } from '../lib/posts';
import { authors } from '../data/authors';
import { categoryColors, categoryConfig } from '../data/categories';
import { mdxComponents } from '../components/MdxComponents';
import Lightbox from '../components/Lightbox';


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

  const [heroLightbox, setHeroLightbox] = useState(false);
  const author = authors[post.authorId];
  const heroImage = post.image || '';
  const PostContent = post.content;

  return (
    <article className="flex flex-col gap-8 items-center">
      {/* Header — above the image, at text width */}
      <header className="w-full max-w-[640px] flex flex-col gap-6">
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

        {/* Author profile + date row */}
        <div className="flex items-center gap-4">
          {author && (
            <div className="flex items-center gap-3">
              <img
                src={author.avatar}
                alt={author.name}
                className="w-[48px] h-[48px] rounded-full object-cover"
              />
              <span className="text-base font-medium text-content">
                {author.name}
              </span>
            </div>
          )}
          <time
            dateTime={post.date}
            className="text-sm font-medium text-content-muted"
          >
            {new Date(post.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </time>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-bold text-content leading-tight">
          {post.title}
        </h1>

        {/* Read time + categories bar */}
        <div className="flex items-center justify-between bg-[#f4f4f4] rounded-xl px-3 py-2.5">
          <span className="text-sm font-medium text-content-muted">
            {post.readTime}
          </span>
          <div className="flex flex-wrap gap-2">
            {post.categories.map((cat) => (
              <span
                key={cat}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[cat]}`}
              >
                {categoryConfig[cat].label}
              </span>
            ))}
            {post.tags?.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* Article content — image + text body */}
      <div className="w-full flex flex-col gap-10 items-center">
        {/* Article image — full content width, aspect ratio from frontmatter or 16/9 default */}
        {heroImage && (
          <>
            <div
              className="w-full rounded-xl overflow-hidden cursor-pointer"
              style={{ aspectRatio: post.imageAspectRatio || '16/9' }}
              onClick={() => setHeroLightbox(true)}
            >
              <img
                src={heroImage}
                alt={post.title}
                className="w-full h-full object-cover hover:opacity-90 transition-opacity"
              />
            </div>
            {heroLightbox && (
              <Lightbox
                images={[{ src: heroImage, alt: post.title }]}
                currentIndex={0}
                onClose={() => setHeroLightbox(false)}
                onPrev={() => {}}
                onNext={() => {}}
              />
            )}
          </>
        )}

        {/* Article text — centered at 640px */}
        <div className="w-full max-w-[640px] flex flex-col gap-4 prose-custom text-content-secondary leading-relaxed">
          <PostContent components={mdxComponents} />
        </div>
      </div>
    </article>
  );
}
