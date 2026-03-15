import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Lightbox from './Lightbox';

interface GalleryImage {
  src: string;
  alt?: string;
  caption?: string;
}

interface GalleryProps {
  path?: string;
  images?: GalleryImage[] | string[];
  aspectRatio?: string;
  fullWidth?: boolean;
}

export default function Gallery({ path, images: imagesProp, aspectRatio = '4/3', fullWidth = true }: GalleryProps) {
  // Derive images from prop directly (no effect needed)
  const resolvedPropImages = useMemo(() => {
    if (!imagesProp) return null;
    return imagesProp.map((img) =>
      typeof img === 'string' ? { src: img } : img,
    );
  }, [imagesProp]);

  const [fetchedImages, setFetchedImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(() => !!path && !imagesProp);
  const [error, setError] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const images = resolvedPropImages ?? fetchedImages;

  // Fetch manifest from path
  useEffect(() => {
    if (!path || imagesProp) return;
    let cancelled = false;
    fetch(`${path}/manifest.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load manifest');
        return res.json();
      })
      .then((data: { images: Array<{ src: string; alt?: string; caption?: string }> }) => {
        if (cancelled) return;
        const resolved = data.images.map((img) => ({
          ...img,
          src: `${path}/${img.src}`,
        }));
        setFetchedImages(resolved);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [path, imagesProp]);

  // Track scroll position for arrow visibility + active dot
  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);

    // Calculate active index based on scroll position
    const imageWidth = el.clientWidth * 0.85 + 12; // 85% width + gap
    const index = Math.round(el.scrollLeft / imageWidth);
    setActiveIndex(Math.min(index, images.length - 1));
  }, [images.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [updateScrollState]);

  const scrollBy = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85 + 12;
    el.scrollBy({
      left: direction === 'right' ? amount : -amount,
      behavior: 'smooth',
    });
  };

  if (loading) {
    return (
      <div className="w-full h-48 rounded-xl bg-surface-secondary animate-pulse my-4" />
    );
  }

  if (error) {
    return (
      <p className="text-content-muted text-sm italic my-4">
        Gallery could not be loaded.
      </p>
    );
  }

  if (images.length === 0) return null;

  return (
    <div className={`relative my-4 ${fullWidth ? 'w-screen left-1/2 -translate-x-1/2 max-w-[950px]' : ''}`}>
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
      >
        {images.map((img, i) => (
          <div
            key={img.src}
            className="flex-shrink-0 w-[85%] snap-center rounded-lg overflow-hidden cursor-pointer"
          >
            <img
              src={img.src}
              alt={img.alt || ''}
              loading={i < 2 ? 'eager' : 'lazy'}
              style={{ aspectRatio }}
              className="w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
              onClick={() => setLightboxIndex(i)}
            />
          </div>
        ))}
      </div>

      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scrollBy('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface/80 backdrop-blur-sm border border-edge flex items-center justify-center text-content-muted hover:text-content transition-colors duration-300 hidden md:flex"
          aria-label="Scroll left"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scrollBy('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-surface/80 backdrop-blur-sm border border-edge flex items-center justify-center text-content-muted hover:text-content transition-colors duration-300 hidden md:flex"
          aria-label="Scroll right"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {images.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                i === activeIndex ? 'bg-accent' : 'bg-content-muted/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((prev) => Math.max(0, (prev ?? 0) - 1))}
          onNext={() =>
            setLightboxIndex((prev) => Math.min(images.length - 1, (prev ?? 0) + 1))
          }
        />
      )}
    </div>
  );
}
