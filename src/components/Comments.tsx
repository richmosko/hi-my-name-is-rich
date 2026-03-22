import { useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';

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
  const { theme } = useTheme();

  useEffect(() => {
    // Skip if no host configured (local dev without Remark42 server)
    if (!REMARK42_HOST) return;

    const config = {
      host: REMARK42_HOST,
      site_id: 'himynameisrich',
      url: `${window.location.origin}/post/${pageId}`,
      components: ['embed'],
      theme: theme,
      page_title: document.title,
      locale: 'en',
      show_email_subscription: false,
      show_rss_subscription: false,
      simple_view: false,
      no_footer: true,
      primary_color: theme === 'dark' ? '#6b8aff' : '#4a6cf7',
    };

    // Destroy previous instance before re-creating
    if (window.REMARK42?.destroy) {
      window.REMARK42.destroy();
    }

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
  }, [pageId, theme]);

  if (!REMARK42_HOST) {
    return (
      <div className="w-full max-w-[640px] border-t border-edge pt-8 mt-4">
        <h3 className="text-lg font-semibold text-content mb-4">Comments</h3>
        <p className="text-sm text-content-muted">
          Comments are disabled in development. Set <code className="bg-surface-secondary px-1.5 py-0.5 rounded text-xs">VITE_REMARK42_HOST</code> to enable.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full max-w-[640px] border-t border-edge pt-8 mt-4">
      <h3 className="text-lg font-semibold text-content mb-4">Comments</h3>
      <div id="remark42" />
    </div>
  );
}
