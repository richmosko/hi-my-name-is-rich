import { useState } from 'react';
import { useVikunjaProject, useVikunjaKanban, type VikunjaTask } from '../hooks/useVikunja';
import KanbanBoard from './KanbanBoard';
import GanttChart from './GanttChart';

interface ProjectDetailIslandProps {
  vikunjaProjectId?: number;
  status: string;
  groupOrder?: string[];
}

type ViewMode = 'labels' | 'pending' | 'kanban' | 'gantt';

function VikunjaTaskList({ tasks, groupOrder }: { tasks: VikunjaTask[]; groupOrder?: string[] }) {
  const [collapsed, setCollapsed] = useState<Set<string> | null>(null);

  const groups = new Map<string, { color: string; tasks: VikunjaTask[] }>();
  for (const task of tasks) {
    const label = task.labels?.[0];
    const key = label?.title || 'Ungrouped';
    const color = label?.hex_color || '888888';
    if (!groups.has(key)) groups.set(key, { color, tasks: [] });
    groups.get(key)!.tasks.push(task);
  }

  if (collapsed === null && groups.size > 0) {
    setCollapsed(new Set(groups.keys()));
  }
  const collapsedSet = collapsed ?? new Set<string>();

  const sorted = Array.from(groups.entries()).sort(([aKey, aVal], [bKey, bVal]) => {
    if (groupOrder) {
      const aIdx = groupOrder.indexOf(aKey);
      const bIdx = groupOrder.indexOf(bKey);
      const aPos = aIdx >= 0 ? aIdx : groupOrder.length + 1;
      const bPos = bIdx >= 0 ? bIdx : groupOrder.length + 1;
      if (aPos !== bPos) return aPos - bPos;
    }
    const aOpen = aVal.tasks.filter(t => !t.done).length;
    const bOpen = bVal.tasks.filter(t => !t.done).length;
    if (aOpen > 0 && bOpen === 0) return -1;
    if (aOpen === 0 && bOpen > 0) return 1;
    return aKey.localeCompare(bKey);
  });

  const toggle = (key: string) => {
    setCollapsed(prev => {
      const next = new Set(prev ?? []);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-content">Tasks</h3>
      {sorted.map(([groupName, { color, tasks: groupTasks }]) => {
        const done = groupTasks.filter(t => t.done).length;
        const total = groupTasks.length;
        const pct = Math.round((done / total) * 100);
        const isCollapsed = collapsedSet.has(groupName);
        const allDone = done === total;

        return (
          <div key={groupName} className="rounded-xl overflow-hidden border border-edge">
            <button
              onClick={() => toggle(groupName)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer hover:bg-surface-secondary/50 transition-colors"
            >
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: `#${color}` }} />
              <span className={`font-medium text-sm flex-1 ${allDone ? 'text-content-muted' : 'text-content'}`}>
                {groupName}
              </span>
              <span className="text-xs text-content-muted tabular-nums">{done}/{total}</span>
              <div className="w-16 h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                <div className={`h-full rounded-full ${allDone ? 'bg-emerald-500' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
              </div>
              <svg className={`w-4 h-4 text-content-muted transition-transform ${isCollapsed ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {!isCollapsed && (
              <div className="px-4 pb-3 space-y-1">
                {groupTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 py-1">
                    <span className={`text-xs ${task.done ? 'text-emerald-500' : 'text-content-muted'}`}>
                      {task.done ? '✓' : '○'}
                    </span>
                    <span className={`text-sm ${task.done ? 'text-content-muted line-through' : 'text-content-secondary'}`}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ProjectDetailIsland({ vikunjaProjectId, status, groupOrder }: ProjectDetailIslandProps) {
  const vikunja = useVikunjaProject(vikunjaProjectId);
  const kanban = useVikunjaKanban(vikunjaProjectId);
  const [viewMode, setViewMode] = useState<ViewMode>('labels');

  if (!vikunjaProjectId) {
    return (
      <div className="w-full max-w-[640px] text-center py-8">
        <p className="text-sm text-content-muted">No task tracking configured for this project.</p>
      </div>
    );
  }

  if (vikunja.loading) {
    return (
      <div className="w-full max-w-[640px] text-center py-8">
        <p className="text-sm text-content-muted animate-pulse">Loading tasks...</p>
      </div>
    );
  }

  if (vikunja.error || vikunja.total === 0) {
    return (
      <div className="w-full max-w-[640px] text-center py-8">
        <p className="text-sm text-content-muted">
          {vikunja.error ? 'Task data unavailable' : 'No tasks found'}
        </p>
      </div>
    );
  }

  const isWide = viewMode === 'kanban' || viewMode === 'gantt';

  return (
    <div className={`w-full ${isWide ? 'max-w-[1250px]' : 'max-w-[640px]'} transition-all duration-300`}>
      {/* View toggle */}
      <div className="flex gap-1.5 mb-6 justify-center">
        {(['labels', 'pending', 'kanban', 'gantt'] as ViewMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
            style={{
              background: viewMode === mode ? 'var(--color-accent)' : 'var(--color-surface-secondary)',
              color: viewMode === mode ? '#fff' : 'var(--color-content-muted)',
            }}
          >
            {{ labels: 'Labels', pending: 'Pending', kanban: 'Kanban', gantt: 'Gantt' }[mode]}
          </button>
        ))}
      </div>

      {/* Labels view */}
      {viewMode === 'labels' && (
        <VikunjaTaskList tasks={vikunja.tasks} groupOrder={groupOrder} />
      )}

      {/* Pending view */}
      {viewMode === 'pending' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">
            Pending · {vikunja.open}
          </p>
          <ul className="flex flex-col gap-1.5">
            {vikunja.tasks.filter(t => !t.done).map(task => (
              <li key={task.id} className="flex items-center gap-2.5">
                <span className="shrink-0 w-4 h-4 rounded flex items-center justify-center border border-edge bg-surface-secondary" />
                <span className="text-sm text-content">{task.title}</span>
                {(task.labels || []).map(l => (
                  <span key={l.id} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: `#${l.hex_color}22`, color: `#${l.hex_color}` }}>
                    {l.title}
                  </span>
                ))}
              </li>
            ))}
          </ul>
          {vikunja.open === 0 && <p className="text-sm text-content-muted py-4 text-center">All tasks complete!</p>}
        </div>
      )}

      {/* Kanban view */}
      {viewMode === 'kanban' && (
        <KanbanBoard buckets={kanban.buckets} loading={kanban.loading} error={kanban.error} />
      )}

      {/* Gantt view */}
      {viewMode === 'gantt' && (
        <GanttChart tasks={vikunja.tasks} loading={vikunja.loading} />
      )}
    </div>
  );
}
