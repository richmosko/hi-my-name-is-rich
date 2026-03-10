import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { posts } from '../lib/posts';
import { authors } from '../data/authors';
import { categoryColors, categoryConfig } from '../data/categories';

const DEFAULT_IMAGE = '/images/posts/northern-lights-snowy-mountains.jpg';

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

  const author = authors[post.authorId];
  const heroImage = post.image || DEFAULT_IMAGE;

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
        <h1 className="text-4xl font-bold text-content leading-tight">
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
          </div>
        </div>
      </header>

      {/* Article content — image + text body */}
      <div className="w-full flex flex-col gap-10 items-center">
        {/* Article image — full content width, 560px */}
        <div className="w-full h-[560px] rounded-xl overflow-hidden">
          <img
            src={heroImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article text — centered at 640px */}
        <div className="w-full max-w-[640px] flex flex-col gap-4 prose-custom text-content-secondary leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold text-content mt-8">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-semibold text-content mt-6">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-semibold text-content mt-4">
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-base font-semibold text-content mt-3">
                  {children}
                </h4>
              ),
              h5: ({ children }) => (
                <h5 className="text-sm font-semibold text-content mt-2">
                  {children}
                </h5>
              ),
              h6: ({ children }) => (
                <h6 className="text-sm font-medium text-content-muted mt-2">
                  {children}
                </h6>
              ),
              p: ({ children }) => <p>{children}</p>,
              strong: ({ children }) => (
                <strong className="text-content font-semibold">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic">{children}</em>
              ),
              del: ({ children }) => (
                <del className="line-through text-content-muted">
                  {children}
                </del>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-accent/30 pl-4 py-1 my-2 text-content-secondary italic">
                  {children}
                </blockquote>
              ),
              ul: ({ children, className }) => {
                const isTaskList = className?.includes('contains-task-list');
                return (
                  <ul className={`space-y-1 pl-6 ${isTaskList ? 'list-none' : 'list-disc'}`}>
                    {children}
                  </ul>
                );
              },
              ol: ({ children }) => (
                <ol className="list-decimal space-y-1 pl-6">
                  {children}
                </ol>
              ),
              li: ({ children, className }) => {
                const isTask = className?.includes('task-list-item');
                return (
                  <li className={`text-content-secondary ${isTask ? 'list-none' : ''}`}>
                    {children}
                  </li>
                );
              },
              code: ({ children, className }) => {
                // Fenced code blocks get a className like "language-js"
                const isBlock = className?.startsWith('language-') || false;
                if (isBlock) {
                  return (
                    <code className={`block bg-[#1e1e1e] text-[#d4d4d4] rounded-lg p-4 text-sm font-mono overflow-x-auto whitespace-pre ${className}`}>
                      {children}
                    </code>
                  );
                }
                // Inline code
                return (
                  <code className="bg-surface-secondary text-content rounded px-1.5 py-0.5 text-sm font-mono">
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="my-2">{children}</pre>
              ),
              hr: () => (
                <hr className="border-t border-edge my-6" />
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  className="text-accent hover:text-accent-hover underline"
                  target={href?.startsWith('http') ? '_blank' : undefined}
                  rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {children}
                </a>
              ),
              input: ({ checked, ...props }) => (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 accent-accent"
                  {...props}
                />
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
