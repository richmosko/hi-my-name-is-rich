import { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';

const REMARK42_HOST = import.meta.env.VITE_REMARK42_HOST || '';
const SITE_ID = 'himynameisrich';

// Bridge: sends API requests through a same-origin iframe on remark42's domain
// so authenticated (cookie-based) endpoints work.
let bridgeReady = false;
let bridgeIframe: HTMLIFrameElement | null = null;
const pendingRequests = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
let reqCounter = 0;

function initBridge(): Promise<void> {
  if (bridgeReady) return Promise.resolve();
  return new Promise((resolve) => {
    if (bridgeIframe) { resolve(); return; }
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = `${REMARK42_HOST}/web/admin-bridge.html`;
    document.body.appendChild(iframe);
    bridgeIframe = iframe;

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'remark42-bridge-ready') {
        bridgeReady = true;
        window.removeEventListener('message', onMessage);
        resolve();
      }
    };
    window.addEventListener('message', onMessage);
    // Timeout fallback
    setTimeout(() => { bridgeReady = true; resolve(); }, 3000);
  });
}

function bridgeFetch(url: string): Promise<{ ok: boolean; status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    if (!bridgeIframe?.contentWindow) {
      reject(new Error('Bridge iframe not ready'));
      return;
    }
    const id = `req_${++reqCounter}`;
    pendingRequests.set(id, {
      resolve: (v) => { pendingRequests.delete(id); resolve(v as { ok: boolean; status: number; data: unknown }); },
      reject: (e) => { pendingRequests.delete(id); reject(e); },
    });
    bridgeIframe.contentWindow.postMessage({ id, url }, REMARK42_HOST);
    // Timeout
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error('Bridge request timeout'));
      }
    }, 10000);
  });
}

// Listen for bridge responses
if (typeof window !== 'undefined') {
  window.addEventListener('message', (e) => {
    const { id, ok, status, data, error } = e.data || {};
    if (id && pendingRequests.has(id)) {
      const req = pendingRequests.get(id)!;
      if (error) req.reject(new Error(error));
      else req.resolve({ ok, status, data });
    }
  });
}

interface Comment {
  id: string;
  pid: string;
  text: string;
  user: { name: string; id: string; picture?: string };
  locator: { site: string; url: string };
  score: number;
  time: string;
  delete?: boolean;
}

interface PostInfo {
  url: string;
  count: number;
  first_time?: string;
  last_time?: string;
}

interface BlockedUser {
  id: string;
  name?: string;
  until?: string;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function postSlugFromUrl(url: string): string {
  // Extract slug from full URL like https://himynameisrich.com/post/my-slug
  const match = url.match(/\/post\/([^/?#]+)/);
  return match ? match[1] : url;
}

export default function Admin() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [recentComments, setRecentComments] = useState<Comment[]>([]);
  const [posts, setPosts] = useState<PostInfo[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'recent' | 'posts' | 'blocked' | 'widget'>('recent');

  const fetchData = useCallback(async () => {
    if (!REMARK42_HOST) {
      setError('VITE_REMARK42_HOST not configured');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use bridge iframe (same-origin on remark42's domain) for all API calls.
      // This allows authenticated (cookie-based) admin endpoints to work.
      await initBridge();

      const errors: string[] = [];

      const [commentsRes, postsRes, blockedRes] = await Promise.allSettled([
        bridgeFetch(`${REMARK42_HOST}/api/v1/last/50?site=${SITE_ID}`),
        bridgeFetch(`${REMARK42_HOST}/api/v1/list?site=${SITE_ID}&limit=100&skip=0`),
        bridgeFetch(`${REMARK42_HOST}/api/v1/admin/blocked?site=${SITE_ID}`),
      ]);

      if (commentsRes.status === 'fulfilled' && commentsRes.value.ok) {
        const data = commentsRes.value.data;
        setRecentComments(Array.isArray(data) ? data as Comment[] : []);
      } else if (commentsRes.status === 'fulfilled') {
        errors.push(`Comments: ${commentsRes.value.status}`);
      } else {
        errors.push(`Comments: ${commentsRes.reason}`);
      }

      if (postsRes.status === 'fulfilled' && postsRes.value.ok) {
        const data = postsRes.value.data;
        setPosts(Array.isArray(data) ? (data as PostInfo[]).sort((a, b) => b.count - a.count) : []);
      } else if (postsRes.status === 'fulfilled') {
        errors.push(`Posts: ${postsRes.value.status}`);
      } else {
        errors.push(`Posts: ${postsRes.reason}`);
      }

      if (blockedRes.status === 'fulfilled' && blockedRes.value.ok) {
        const data = blockedRes.value.data;
        setBlockedUsers(Array.isArray(data) ? data as BlockedUser[] : []);
      } else if (blockedRes.status === 'fulfilled' && blockedRes.value.status === 401) {
        // Expected when not signed in as admin — don't show as error
        setBlockedUsers([]);
      } else if (blockedRes.status === 'fulfilled') {
        errors.push(`Blocked: ${blockedRes.value.status}`);
      } else {
        // Network/bridge errors — don't show for blocked endpoint
        setBlockedUsers([]);
      }

      if (errors.length > 0) setError(errors.join(' | '));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalComments = posts.reduce((sum, p) => sum + p.count, 0);
  const postsWithComments = posts.filter(p => p.count > 0).length;

  const cardStyle = {
    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
  };

  const tabStyle = (active: boolean) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer' as const,
    fontSize: '13px',
    fontWeight: active ? 600 : 400,
    background: active
      ? (isDark ? 'rgba(107,138,255,0.15)' : 'rgba(74,108,247,0.1)')
      : 'transparent',
    color: active
      ? (isDark ? '#8da4ff' : '#4a6cf7')
      : (isDark ? '#888' : '#666'),
    border: 'none',
  });

  if (!REMARK42_HOST) {
    return (
      <div className="max-w-[640px] mx-auto py-12 text-center text-content-muted">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <p>Comments system not configured. Set <code>VITE_REMARK42_HOST</code> to enable.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-content">Admin Dashboard</h1>
        <button
          onClick={fetchData}
          className="text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer"
          style={{
            background: isDark ? '#4a6cf7' : '#4a6cf7',
            color: '#fff',
          }}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl px-5 py-4" style={cardStyle}>
          <div className="text-2xl font-bold text-content">{totalComments}</div>
          <div className="text-xs text-content-muted mt-1">Total Comments</div>
        </div>
        <div className="rounded-xl px-5 py-4" style={cardStyle}>
          <div className="text-2xl font-bold text-content">{postsWithComments}</div>
          <div className="text-xs text-content-muted mt-1">Posts with Comments</div>
        </div>
        <div className="rounded-xl px-5 py-4" style={cardStyle}>
          <div className="text-2xl font-bold text-content">{blockedUsers.length}</div>
          <div className="text-xs text-content-muted mt-1">Blocked Users</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button style={tabStyle(activeTab === 'recent')} onClick={() => setActiveTab('recent')}>
          Recent Comments ({recentComments.length})
        </button>
        <button style={tabStyle(activeTab === 'posts')} onClick={() => setActiveTab('posts')}>
          Posts ({postsWithComments})
        </button>
        <button style={tabStyle(activeTab === 'blocked')} onClick={() => setActiveTab('blocked')}>
          Blocked ({blockedUsers.length})
        </button>
        <button style={tabStyle(activeTab === 'widget')} onClick={() => setActiveTab('widget')}>
          Moderate
        </button>
      </div>

      {loading ? (
        <div className="text-center text-content-muted py-12">Loading...</div>
      ) : (
        <>
          {/* Recent Comments Tab */}
          {activeTab === 'recent' && (
            <div className="space-y-3">
              {recentComments.length === 0 ? (
                <p className="text-content-muted text-sm py-8 text-center">No comments yet.</p>
              ) : (
                recentComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-xl px-5 py-4"
                    style={{
                      ...cardStyle,
                      opacity: comment.delete ? 0.4 : 1,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {comment.user.picture && (
                        <img
                          src={comment.user.picture}
                          alt={comment.user.name}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-content">{comment.user.name}</span>
                          <span className="text-xs text-content-muted">{timeAgo(comment.time)}</span>
                          {comment.score !== 0 && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{
                                background: comment.score > 0
                                  ? 'rgba(34,197,94,0.1)'
                                  : 'rgba(239,68,68,0.1)',
                                color: comment.score > 0 ? '#22c55e' : '#ef4444',
                              }}
                            >
                              {comment.score > 0 ? '+' : ''}{comment.score}
                            </span>
                          )}
                          {comment.delete && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">deleted</span>
                          )}
                        </div>
                        <p className="text-sm text-content-secondary mt-1 line-clamp-3">{comment.text}</p>
                        <a
                          href={`/post/${postSlugFromUrl(comment.locator.url)}`}
                          className="text-xs text-accent hover:text-accent-hover mt-2 inline-block"
                        >
                          on {postSlugFromUrl(comment.locator.url)}
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="space-y-2">
              {posts.length === 0 ? (
                <p className="text-content-muted text-sm py-8 text-center">No posts with comments.</p>
              ) : (
                posts.map((post) => (
                  <div
                    key={post.url}
                    className="flex items-center justify-between rounded-xl px-5 py-3"
                    style={cardStyle}
                  >
                    <a
                      href={`/post/${postSlugFromUrl(post.url)}`}
                      className="text-sm text-accent hover:text-accent-hover truncate flex-1 mr-4"
                    >
                      {postSlugFromUrl(post.url)}
                    </a>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-sm font-semibold text-content">{post.count}</span>
                      <span className="text-xs text-content-muted">comments</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Blocked Users Tab */}
          {activeTab === 'blocked' && (
            <div className="space-y-2">
              {blockedUsers.length === 0 ? (
                <p className="text-content-muted text-sm py-8 text-center">No blocked users.</p>
              ) : (
                blockedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-xl px-5 py-3"
                    style={cardStyle}
                  >
                    <div>
                      <span className="text-sm font-medium text-content">{user.name || user.id}</span>
                      <span className="text-xs text-content-muted ml-2">{user.id}</span>
                    </div>
                    {user.until && (
                      <span className="text-xs text-content-muted">
                        until {new Date(user.until).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Remark42 last-comments widget — runs in same-origin iframe with full admin controls */}
          {activeTab === 'widget' && (
            <div>
              <p className="text-sm text-content-muted mb-4">
                This widget runs directly from Remark42. Sign in here to access admin controls (delete, pin, block) across all posts.
              </p>
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  ...cardStyle,
                  minHeight: '500px',
                }}
              >
                <iframe
                  src={`${REMARK42_HOST}/web/last-comments.html?site=${SITE_ID}&max=50`}
                  style={{
                    width: '100%',
                    minHeight: '500px',
                    border: 'none',
                    background: 'transparent',
                  }}
                  title="Remark42 Recent Comments"
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Cloudflare analytics link */}
      <div className="mt-12 pt-6 border-t border-edge">
        <h2 className="text-lg font-semibold text-content mb-2">Traffic Analytics</h2>
        <p className="text-sm text-content-muted mb-3">
          Traffic stats are available in the Cloudflare dashboard. Click below to view page views, visitors, and bandwidth.
        </p>
        <a
          href="https://dash.cloudflare.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-accent hover:text-accent-hover inline-flex items-center gap-1"
        >
          Open Cloudflare Dashboard
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
