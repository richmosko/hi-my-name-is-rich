import { useEffect, useState } from 'react';

const VIKUNJA_HOST = import.meta.env.VITE_VIKUNJA_HOST || '';
const VIKUNJA_TOKEN = import.meta.env.VITE_VIKUNJA_TOKEN || '';
// In production, proxy through nginx to avoid CORS issues
// /api/vikunja/ → tasks.himynameisrich.com/api/v1/
const VIKUNJA_API: string = import.meta.env.PROD ? '/api/vikunja' : `${VIKUNJA_HOST}/api/v1`;

export interface VikunjaTask {
  id: number;
  title: string;
  done: boolean;
  done_at: string | null;
  created: string;
  updated: string;
  priority: number;
  labels: { id: number; title: string; hex_color: string }[];
}

export interface VikunjaProjectStats {
  total: number;
  done: number;
  open: number;
  percent: number;
  tasks: VikunjaTask[];
  loading: boolean;
  error: string | null;
}

const EMPTY: VikunjaProjectStats = {
  total: 0, done: 0, open: 0, percent: 0, tasks: [], loading: false, error: null,
};

/** Fetch tasks for a Vikunja project and compute stats */
export function useVikunjaProject(projectId: number | undefined): VikunjaProjectStats {
  const [stats, setStats] = useState<VikunjaProjectStats>({ ...EMPTY, loading: !!projectId });

  useEffect(() => {
    if (!projectId || !VIKUNJA_HOST || !VIKUNJA_TOKEN) {
      setStats(EMPTY);
      return;
    }

    let cancelled = false;
    setStats((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        // Fetch all tasks (done and not done) — paginate if needed
        const allTasks: VikunjaTask[] = [];
        let page = 1;
        while (true) {
          const res = await fetch(
            `${VIKUNJA_API}/projects/${projectId}/tasks?page=${page}&per_page=100`,
            { headers: { Authorization: `Bearer ${VIKUNJA_TOKEN}` } }
          );
          if (!res.ok) throw new Error(`Vikunja API error: ${res.status}`);
          const tasks: VikunjaTask[] = await res.json();
          allTasks.push(...tasks);
          if (tasks.length < 100) break;
          page++;
        }

        if (cancelled) return;

        const done = allTasks.filter((t) => t.done).length;
        const total = allTasks.length;
        setStats({
          total,
          done,
          open: total - done,
          percent: total > 0 ? Math.round((done / total) * 100) : 0,
          tasks: allTasks,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (!cancelled) {
          setStats((s) => ({
            ...s,
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to fetch',
          }));
        }
      }
    })();

    return () => { cancelled = true; };
  }, [projectId]);

  return stats;
}

/** Fetch recent tasks across all projects (for changelog) */
export function useVikunjaRecentTasks(limit = 50): {
  tasks: VikunjaTask[];
  loading: boolean;
  error: string | null;
} {
  const [state, setState] = useState<{ tasks: VikunjaTask[]; loading: boolean; error: string | null }>({
    tasks: [], loading: true, error: null,
  });

  useEffect(() => {
    if (!VIKUNJA_HOST || !VIKUNJA_TOKEN) {
      setState({ tasks: [], loading: false, error: null });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `${VIKUNJA_API}/tasks/all?sort_by=updated&order_by=desc&per_page=${limit}`,
          { headers: { Authorization: `Bearer ${VIKUNJA_TOKEN}` } }
        );
        if (!res.ok) throw new Error(`Vikunja API error: ${res.status}`);
        const tasks: VikunjaTask[] = await res.json();
        if (!cancelled) setState({ tasks, loading: false, error: null });
      } catch (err) {
        if (!cancelled) {
          setState({ tasks: [], loading: false, error: err instanceof Error ? err.message : 'Failed to fetch' });
        }
      }
    })();

    return () => { cancelled = true; };
  }, [limit]);

  return state;
}
