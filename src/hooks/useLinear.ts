import { useEffect, useState } from 'react';

// In production, proxy through Astro server route to keep API key server-side.
// In dev, call Linear directly (API key must be set in .env).
const LINEAR_API_KEY = import.meta.env.PUBLIC_LINEAR_API_KEY || import.meta.env.LINEAR_API_KEY || '';
const LINEAR_API: string = import.meta.env.PROD ? '/api/linear/graphql' : 'https://api.linear.app/graphql';

// ─── Shared Types (same shape as old Vikunja types for component compatibility) ───

export interface ProjectTask {
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

export interface KanbanBucket {
  id: number;
  title: string;
  tasks: ProjectTask[];
}

export interface ProjectStats {
  total: number;
  done: number;
  open: number;
  percent: number;
  tasks: ProjectTask[];
  subProjects: { id: number; title: string; total: number; done: number; percent: number }[];
  loading: boolean;
  error: string | null;
}

export interface KanbanData {
  buckets: KanbanBucket[];
  loading: boolean;
  error: string | null;
}

const EMPTY: ProjectStats = {
  total: 0, done: 0, open: 0, percent: 0, tasks: [], subProjects: [], loading: false, error: null,
};

// Labels that count as "issues" — excluded from progress calculation
const ISSUE_LABELS = ['bug', 'enhancement', 'question'];

// ─── GraphQL helper ───

async function linearQuery(query: string, variables: Record<string, unknown> = {}): Promise<unknown> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  // In dev mode, send the API key directly; in prod, the proxy adds it
  if (!import.meta.env.PROD && LINEAR_API_KEY) {
    headers['Authorization'] = LINEAR_API_KEY;
  }

  const res = await fetch(LINEAR_API, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`Linear API error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message || 'GraphQL error');
  return json.data;
}

// ─── Linear Issue → ProjectTask mapper ───

interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  state: { id: string; name: string; type: string; position: number };
  labels: { nodes: { id: string; name: string; color: string }[] };
  priority: number;
  dueDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

let taskIdCounter = 1;

function mapIssueToTask(issue: LinearIssue): ProjectTask {
  const done = issue.state.type === 'completed';
  return {
    id: taskIdCounter++,
    title: issue.title,
    done,
    done_at: issue.completedAt || null,
    created: issue.createdAt,
    updated: issue.updatedAt,
    priority: issue.priority,
    project_id: 0,
    bucket_id: 0,
    start_date: issue.startedAt || '',
    end_date: issue.completedAt || '',
    due_date: issue.dueDate || '',
    percent_done: done ? 1 : 0,
    labels: issue.labels.nodes.map((l, i) => ({
      id: i,
      title: l.name,
      // Strip '#' prefix so existing UI can do `#${hex_color}`
      hex_color: l.color.replace('#', ''),
    })),
  };
}

// ─── Fetch all issues for a project (with cursor pagination) ───

const ISSUES_QUERY = `
  query($projectId: String!, $after: String) {
    project(id: $projectId) {
      progress
      issues(first: 250, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id identifier title description
          state { id name type position }
          labels { nodes { id name color } }
          priority dueDate startedAt completedAt createdAt updatedAt
        }
      }
    }
  }
`;

async function fetchAllProjectIssues(projectId: string): Promise<{ issues: LinearIssue[]; progress: number }> {
  const allIssues: LinearIssue[] = [];
  let cursor: string | null = null;
  let progress = 0;

  while (true) {
    const data = await linearQuery(ISSUES_QUERY, { projectId, after: cursor }) as {
      project: {
        progress: number;
        issues: {
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
          nodes: LinearIssue[];
        };
      };
    };

    progress = data.project.progress;
    allIssues.push(...data.project.issues.nodes);

    if (!data.project.issues.pageInfo.hasNextPage) break;
    cursor = data.project.issues.pageInfo.endCursor;
  }

  return { issues: allIssues, progress };
}

// ─── Hooks ───

/**
 * Fetch project stats from Linear.
 * Returns the same interface shape as the old useVikunjaProject.
 */
export function useLinearProject(projectId: string | undefined): ProjectStats {
  const [stats, setStats] = useState<ProjectStats>({ ...EMPTY, loading: !!projectId });

  useEffect(() => {
    if (!projectId) {
      setStats(EMPTY);
      return;
    }

    let cancelled = false;
    setStats((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        // Reset ID counter for consistent numbering
        taskIdCounter = 1;
        const { issues, progress } = await fetchAllProjectIssues(projectId);

        if (cancelled) return;

        const allTasks = issues.map(mapIssueToTask);

        // Exclude issue-tracking tasks from progress
        const isIssueTask = (t: ProjectTask) =>
          t.labels.some(l => ISSUE_LABELS.includes(l.title.toLowerCase()));
        const progressTasks = allTasks.filter(t => !isIssueTask(t));

        const done = progressTasks.filter(t => t.done).length;
        const total = progressTasks.length;

        // Use Linear's built-in progress if available, otherwise calculate
        const percent = total > 0
          ? Math.round(progress * 100)
          : 0;

        setStats({
          total,
          done,
          open: total - done,
          percent,
          tasks: allTasks,
          subProjects: [], // Linear projects are flat (no sub-projects)
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

// ─── Kanban Hook ───

const WORKFLOW_STATES_QUERY = `
  query {
    workflowStates(first: 50) {
      nodes { id name type position }
    }
  }
`;

/**
 * Fetch Kanban board data by grouping issues into workflow state buckets.
 */
export function useLinearKanban(projectId: string | undefined): KanbanData {
  const [state, setState] = useState<KanbanData>({
    buckets: [], loading: !!projectId, error: null,
  });

  useEffect(() => {
    if (!projectId) return;

    let cancelled = false;

    (async () => {
      try {
        taskIdCounter = 1;

        // Fetch workflow states and issues in parallel
        const [statesData, projectData] = await Promise.all([
          linearQuery(WORKFLOW_STATES_QUERY),
          fetchAllProjectIssues(projectId),
        ]);

        if (cancelled) return;

        const allStates = (statesData as {
          workflowStates: { nodes: { id: string; name: string; type: string; position: number }[] };
        }).workflowStates.nodes;

        // Sort states by position (Backlog → Todo → In Progress → Done)
        // Exclude canceled states from kanban
        const activeStates = allStates
          .filter(s => s.type !== 'canceled')
          .sort((a, b) => a.position - b.position);

        // Build issue → state mapping
        const issuesByState = new Map<string, ProjectTask[]>();
        for (const s of activeStates) {
          issuesByState.set(s.id, []);
        }

        for (const issue of projectData.issues) {
          const task = mapIssueToTask(issue);
          const stateId = issue.state.id;
          if (issuesByState.has(stateId)) {
            issuesByState.get(stateId)!.push(task);
          }
        }

        // Convert to KanbanBucket[]
        const buckets: KanbanBucket[] = activeStates.map((s, i) => ({
          id: i,
          title: s.name,
          tasks: issuesByState.get(s.id) || [],
        }));

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
