import { useEffect, useState } from 'react';

const VIKUNJA_HOST = import.meta.env.PUBLIC_VIKUNJA_HOST || import.meta.env.VITE_VIKUNJA_HOST || '';
const VIKUNJA_TOKEN = import.meta.env.PUBLIC_VIKUNJA_TOKEN || import.meta.env.VITE_VIKUNJA_TOKEN || '';
// In production, proxy through Astro server route to avoid CORS issues
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
  project_id: number;
  bucket_id: number;
  start_date: string;
  end_date: string;
  due_date: string;
  percent_done: number;
  labels: { id: number; title: string; hex_color: string }[];
}

export interface VikunjaBucket {
  id: number;
  title: string;
  tasks: VikunjaTask[];
}

interface VikunjaProject {
  id: number;
  title: string;
  parent_project_id: number;
}

export interface VikunjaProjectStats {
  total: number;
  done: number;
  open: number;
  percent: number;
  tasks: VikunjaTask[];
  /** Sub-project stats keyed by project title */
  subProjects: { id: number; title: string; total: number; done: number; percent: number }[];
  loading: boolean;
  error: string | null;
}

const EMPTY: VikunjaProjectStats = {
  total: 0, done: 0, open: 0, percent: 0, tasks: [], subProjects: [], loading: false, error: null,
};

/** Fetch all pages of tasks for a single project */
async function fetchProjectTasks(projectId: number): Promise<VikunjaTask[]> {
  const allTasks: VikunjaTask[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `${VIKUNJA_API}/projects/${projectId}/tasks?page=${page}&per_page=50`,
      { headers: { Authorization: `Bearer ${VIKUNJA_TOKEN}` } }
    );
    if (!res.ok) throw new Error(`Vikunja API error: ${res.status}`);
    const tasks: VikunjaTask[] = await res.json();
    allTasks.push(...tasks);
    if (tasks.length < 50) break;
    page++;
  }
  return allTasks;
}

/** Recursively find all descendant project IDs */
async function getDescendantProjects(parentId: number): Promise<VikunjaProject[]> {
  // Fetch all projects and filter by parent_project_id
  // Vikunja doesn't have a "children of" endpoint, so we fetch all and filter
  const allProjects: VikunjaProject[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `${VIKUNJA_API}/projects?page=${page}&per_page=50`,
      { headers: { Authorization: `Bearer ${VIKUNJA_TOKEN}` } }
    );
    if (!res.ok) break;
    const projects: VikunjaProject[] = await res.json();
    allProjects.push(...projects);
    if (projects.length < 50) break;
    page++;
  }

  // Build a tree and collect all descendants recursively
  const descendants: VikunjaProject[] = [];
  const queue = [parentId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = allProjects.filter(p => p.parent_project_id === currentId);
    for (const child of children) {
      descendants.push(child);
      queue.push(child.id);
    }
  }
  return descendants;
}

/**
 * Fetch tasks for a Vikunja project and ALL its sub-projects (recursively).
 * Returns aggregated stats + per-sub-project breakdown.
 */
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
        // Get all descendant sub-projects
        const descendants = await getDescendantProjects(projectId);
        const allProjectIds = [projectId, ...descendants.map(d => d.id)];

        // Fetch tasks from all projects in parallel
        const taskArrays = await Promise.all(allProjectIds.map(fetchProjectTasks));
        const allTasks = taskArrays.flat();

        if (cancelled) return;

        // Exclude issue-tracking tasks (bug/enhancement/question) from progress
        const isIssueTask = (t: VikunjaTask) =>
          (t.labels || []).some(l => ISSUE_LABELS.includes(l.title as IssueType));
        const progressTasks = allTasks.filter(t => !isIssueTask(t));

        const done = progressTasks.filter((t) => t.done).length;
        const total = progressTasks.length;

        // Build sub-project breakdown (also excluding issue tasks)
        const subProjects = descendants.map(d => {
          const tasks = progressTasks.filter(t => t.project_id === d.id);
          const subDone = tasks.filter(t => t.done).length;
          return {
            id: d.id,
            title: d.title,
            total: tasks.length,
            done: subDone,
            percent: tasks.length > 0 ? Math.round((subDone / tasks.length) * 100) : 0,
          };
        }).filter(s => s.total > 0);

        // Also include tasks directly on the parent (not in any sub-project)
        const parentTasks = progressTasks.filter(t => t.project_id === projectId);
        if (parentTasks.length > 0 && descendants.length > 0) {
          const parentDone = parentTasks.filter(t => t.done).length;
          subProjects.unshift({
            id: projectId,
            title: '(Ungrouped)',
            total: parentTasks.length,
            done: parentDone,
            percent: parentTasks.length > 0 ? Math.round((parentDone / parentTasks.length) * 100) : 0,
          });
        }

        setStats({
          total,
          done,
          open: total - done,
          percent: total > 0 ? Math.round((done / total) * 100) : 0,
          tasks: allTasks,
          subProjects,
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
        // Fetch all projects, then all tasks, sort by updated desc
        const projectsRes = await fetch(
          `${VIKUNJA_API}/projects?page=1&per_page=50`,
          { headers: { Authorization: `Bearer ${VIKUNJA_TOKEN}` } }
        );
        if (!projectsRes.ok) throw new Error(`Vikunja API error: ${projectsRes.status}`);
        const projects: { id: number }[] = await projectsRes.json();

        const allTasks: VikunjaTask[] = [];
        const taskArrays = await Promise.all(
          projects.map(p => fetchProjectTasks(p.id))
        );
        for (const tasks of taskArrays) allTasks.push(...tasks);

        // Sort by updated desc and take top N
        allTasks.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
        if (!cancelled) setState({ tasks: allTasks.slice(0, limit), loading: false, error: null });
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

const ISSUE_LABELS = ['bug', 'enhancement', 'question'] as const;
type IssueType = typeof ISSUE_LABELS[number];

export interface ProjectIssueCounts {
  [projectId: number]: {
    bug: number;
    enhancement: number;
    question: number;
    total: number;
  };
}

/**
 * Fetch open issue counts (bug/enhancement/question) for all projects.
 * Returns a map of projectId → { bug, enhancement, question, total }.
 * Only counts open (not done) tasks.
 */
export function useVikunjaIssueCounts(): {
  counts: ProjectIssueCounts;
  loading: boolean;
} {
  const [state, setState] = useState<{ counts: ProjectIssueCounts; loading: boolean }>({
    counts: {}, loading: !!(VIKUNJA_HOST && VIKUNJA_TOKEN),
  });

  useEffect(() => {
    if (!VIKUNJA_HOST || !VIKUNJA_TOKEN) return;

    let cancelled = false;

    (async () => {
      try {
        // Get all projects first
        const projectsRes = await fetch(
          `${VIKUNJA_API}/projects?page=1&per_page=50`,
          { headers: { Authorization: `Bearer ${VIKUNJA_TOKEN}` } }
        );
        if (!projectsRes.ok) throw new Error('Failed to fetch projects');
        const projects: { id: number }[] = await projectsRes.json();

        if (cancelled) return;

        // Fetch tasks from each project in parallel
        const allTasks: VikunjaTask[] = [];
        const taskArrays = await Promise.all(
          projects.map(p => fetchProjectTasks(p.id))
        );
        for (const tasks of taskArrays) allTasks.push(...tasks);

        if (cancelled) return;

        // Count issues by project and label
        const counts: ProjectIssueCounts = {};
        for (const task of allTasks) {
          if (task.done) continue;
          const projectId = task.project_id;
          for (const label of task.labels || []) {
            if (ISSUE_LABELS.includes(label.title as IssueType)) {
              if (!counts[projectId]) counts[projectId] = { bug: 0, enhancement: 0, question: 0, total: 0 };
              counts[projectId][label.title as IssueType]++;
              counts[projectId].total++;
            }
          }
        }

        if (!cancelled) setState({ counts, loading: false });
      } catch {
        if (!cancelled) setState({ counts: {}, loading: false });
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return state;
}

export interface VikunjaKanbanData {
  buckets: VikunjaBucket[];
  loading: boolean;
  error: string | null;
}

/** Fetch Kanban buckets with tasks for a project */
export function useVikunjaKanban(projectId: number | undefined): VikunjaKanbanData {
  const [state, setState] = useState<VikunjaKanbanData>({
    buckets: [], loading: !!projectId, error: null,
  });

  useEffect(() => {
    if (!projectId || !VIKUNJA_HOST || !VIKUNJA_TOKEN) {
      setState({ buckets: [], loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        // Fetch project to find the Kanban view ID
        const projectRes = await fetch(
          `${VIKUNJA_API}/projects/${projectId}`,
          { headers: { Authorization: `Bearer ${VIKUNJA_TOKEN}` } }
        );
        if (!projectRes.ok) throw new Error(`Failed to fetch project: ${projectRes.status}`);
        const project = await projectRes.json();
        const kanbanView = (project.views || []).find(
          (v: { view_kind: string }) => v.view_kind === 'kanban'
        );
        if (!kanbanView) throw new Error('No Kanban view found for this project');

        // Fetch buckets with tasks
        const bucketsRes = await fetch(
          `${VIKUNJA_API}/projects/${projectId}/views/${kanbanView.id}/tasks`,
          { headers: { Authorization: `Bearer ${VIKUNJA_TOKEN}` } }
        );
        if (!bucketsRes.ok) throw new Error(`Failed to fetch buckets: ${bucketsRes.status}`);
        const buckets: VikunjaBucket[] = await bucketsRes.json();

        if (!cancelled) setState({ buckets, loading: false, error: null });
      } catch (err) {
        if (!cancelled) {
          setState({ buckets: [], loading: false, error: err instanceof Error ? err.message : 'Failed to fetch' });
        }
      }
    })();

    return () => { cancelled = true; };
  }, [projectId]);

  return state;
}
