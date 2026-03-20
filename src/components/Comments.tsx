import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    REMARK42?: {
      createInstance: (config: Record<string, unknown>) => void;
      destroy: () => void;
    };
    remark_config?: Record<string, unknown>;
  }
}

const REMARK42_HOST = import.meta.env.VITE_REMARK42_HOST || '';

interface CommentsProps {
  pageId: string;
}

export default function Comments({ pageId }: CommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip if no host configured (local dev without Remark42 server)
    if (!REMARK42_HOST) return;

    const config = {
      host: REMARK42_HOST,
      site_id: 'himynameisrich',
      url: `${window.location.origin}/post/${pageId}`,
      components: ['embed'],
      theme: 'light',
      page_title: document.title,
      locale: 'en',
      show_email_subscription: false,
    };

    window.remark_config = config;

    // Load the Remark42 embed script
    const script = document.createElement('script');
    script.src = `${REMARK42_HOST}/web/embed.js`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount or page change
      script.remove();
      if (window.REMARK42?.destroy) {
        window.REMARK42.destroy();
      }
      delete window.remark_config;
    };
  }, [pageId]);

  if (!REMARK42_HOST) {
    return (
      <div className="w-full max-w-[640px] border-t border-gray-200 pt-8 mt-4">
        <h3 className="text-lg font-semibold text-content mb-4">Comments</h3>
        <p className="text-sm text-content-muted">
          Comments are disabled in development. Set <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">VITE_REMARK42_HOST</code> to enable.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full max-w-[640px] border-t border-gray-200 pt-8 mt-4">
      <h3 className="text-lg font-semibold text-content mb-4">Comments</h3>
      <style>{`
        .remark42 {
          --font: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          --color0: var(--color-surface, #ffffff);
          --color1: var(--color-content, #444444);
          --color2: var(--color-content-secondary, #555555);
          --color3: var(--color-content-muted, #999999);
          --color4: var(--color-surface-secondary, #f5f5f5);
          --color5: var(--color-edge, #e5e5e5);
          --color6: var(--color-accent, #4a6cf7);
          --color7: var(--color-accent-hover, #3451d1);
          --border-radius: 6px;
        }
        .remark42 a { color: var(--color-accent, #4a6cf7); }
        .remark42 a:hover { color: var(--color-accent-hover, #3451d1); }
      `}</style>
      <div id="remark42" />
    </div>
  );
}
