import { mdxComponents } from './MdxComponents';
import LightboxImage from './LightboxImage';
import Gallery from './Gallery';
import Video from './Video';
import YouTube from './YouTube';

/**
 * Client-side MDX content renderer.
 * Used as a React island so interactive components (Gallery, Video, Lightbox)
 * get proper client-side hydration with useEffect, useState, etc.
 *
 * Usage in Astro:
 *   <MdxRenderer client:load content={htmlContent} />
 */
export default function MdxRenderer({ children }: { children?: React.ReactNode }) {
  // This component just provides the React context for child MDX components.
  // The actual content comes from Astro's <Content> and is passed as children slot.
  return <div className="flex flex-col gap-4 text-content-secondary leading-relaxed">{children}</div>;
}

// Export components for use with Astro <Content>
export const components = {
  ...mdxComponents,
  img: LightboxImage,
  Gallery,
  Video,
  YouTube,
};
