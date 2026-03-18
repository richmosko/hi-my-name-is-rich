import { useState } from 'react';
import type { MDXComponents } from 'mdx/types';
import YouTube from './YouTube';
import Gallery from './Gallery';
import Video from './Video';
import Lightbox from './Lightbox';

function LightboxImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [open, setOpen] = useState(false);
  const { src, alt, ...rest } = props;
  if (!src) return <img {...props} />;
  return (
    <>
      <img
        src={src}
        alt={alt}
        className="cursor-pointer hover:opacity-90 transition-opacity rounded-lg"
        onClick={() => setOpen(true)}
        {...rest}
      />
      {open && (
        <Lightbox
          images={[{ src, alt: alt || '', caption: alt || '' }]}
          currentIndex={0}
          onClose={() => setOpen(false)}
          onPrev={() => {}}
          onNext={() => {}}
        />
      )}
    </>
  );
}

/** Shared component overrides for MDX content rendering */
export const mdxComponents: MDXComponents = {
  YouTube,
  Gallery,
  Video,
  img: LightboxImage,
  h1: (props) => (
    <h1 className="text-2xl font-bold text-content mt-8" {...props} />
  ),
  h2: (props) => (
    <h2 className="text-xl font-semibold text-content mt-6" {...props} />
  ),
  h3: (props) => (
    <h3 className="text-lg font-semibold text-content mt-4" {...props} />
  ),
  h4: (props) => (
    <h4 className="text-base font-semibold text-content mt-3" {...props} />
  ),
  h5: (props) => (
    <h5 className="text-sm font-semibold text-content mt-2" {...props} />
  ),
  h6: (props) => (
    <h6 className="text-sm font-medium text-content-muted mt-2" {...props} />
  ),
  p: (props) => <p {...props} />,
  strong: (props) => (
    <strong className="text-content font-semibold" {...props} />
  ),
  em: (props) => <em className="italic" {...props} />,
  del: (props) => (
    <del className="line-through text-content-muted" {...props} />
  ),
  blockquote: (props) => (
    <blockquote
      className="border-l-4 border-accent/30 pl-4 py-1 my-2 text-content-secondary italic"
      {...props}
    />
  ),
  ul: (props) => {
    const isTaskList =
      typeof props.className === 'string' &&
      props.className.includes('contains-task-list');
    return (
      <ul
        className={`space-y-1 pl-6 ${isTaskList ? 'list-none' : 'list-disc'}`}
        {...props}
      />
    );
  },
  ol: (props) => <ol className="list-decimal space-y-1 pl-6" {...props} />,
  li: (props) => {
    const isTask =
      typeof props.className === 'string' &&
      props.className.includes('task-list-item');
    return (
      <li
        className={`text-content-secondary ${isTask ? 'list-none' : ''}`}
        {...props}
      />
    );
  },
  code: (props) => {
    const isBlock =
      typeof props.className === 'string' &&
      props.className.startsWith('language-');
    if (isBlock) {
      return (
        <code
          className={`block bg-[#1e1e1e] text-[#d4d4d4] rounded-lg p-4 text-sm font-mono overflow-x-auto whitespace-pre ${props.className}`}
          {...props}
        />
      );
    }
    return (
      <code
        className="bg-surface-secondary text-content rounded px-1.5 py-0.5 text-sm font-mono"
        {...props}
      />
    );
  },
  pre: (props) => <pre className="my-2" {...props} />,
  hr: (props) => <hr className="border-t border-edge my-6" {...props} />,
  a: ({ href, className, ...props }) => (
    <a
      href={href}
      className={`text-accent hover:text-accent-hover underline ${className || ''}`}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props}
    />
  ),
  input: (props) => (
    <input readOnly className="mr-2 accent-accent" {...props} />
  ),
};
