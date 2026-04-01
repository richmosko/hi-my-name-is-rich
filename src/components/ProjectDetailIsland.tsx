import { useState } from 'react';
import { useVikunjaProject } from '../hooks/useVikunja';

interface ProjectDetailIslandProps {
  vikunjaProjectId?: number;
  status: string;
  groupOrder?: string[];
}

/**
 * React island for project detail page: shows live progress + task list from Vikunja.
 * Displays N/A when Vikunja data is unavailable.
 */
type ViewMode = 'labels' | 'pending' | 'kanban' | 'gantt';

export default function ProjectDetailIsland({ vikunjaProjectId, status, groupOrder }: ProjectDetailIslandProps) {
  const vikunja = useVikunjaProject(vikunjaProjectId);
  const [viewMode, setViewMode] = useState<ViewMode>('labels');

  if (!vikunjaProjectId) {
    return (
      <div className="w-full max-w-[640px]">
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            status === 'completed' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-accent/10 text-accent'
          }`}>
            {status === 'completed' ? 'Completed' : 'Active'}
          </span>
          <span className="text-sm font-semibold text-content-muted">N/A</span>
        </div>
        <p className="text-xs text-content-muted">No task tracking configured for this project.</p>
      </div>
    );
  }

  if (vikunja.loading) {
    return (
      <div className="w-full max-w-[640px]">
        <div className="flex items-center gap-3 mb-4">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
            {status === 'completed' ? 'Completed' : 'Active'}
          </span>
          <span className="text-sm font-semibold text-content-muted animate-pulse">Loading...</span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden animate-pulse" />
      </div>
    );
  }

  if (vikunja.error || vikunja.total === 0) {
    return (
      <div className="w-full max-w-[640px]">
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
            status === 'completed' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-accent/10 text-accent'
          }`}>
            {status === 'completed' ? 'Completed' : 'Active'}
          </span>
          <span className="text-sm font-semibold text-content-muted">N/A</span>
        </div>
        <p className="text-xs text-content-muted">
          {vikunja.error ? 'Task data unavailable' : 'No tasks found'}
        </p>
      </div>
    );
  }

  // Group tasks by label
  const tasksByLabel = new Map<string, typeof vikunja.tasks>();
  const ungrouped: typeof vikunja.tasks = [];
  for (const task of vikunja.tasks) {
    const label = task.labels?.[0]?.title;
    if (label) {
      if (!tasksByLabel.has(label)) tasksByLabel.set(label, []);
      tasksByLabel.get(label)!.push(task);
    } else {
      ungrouped.push(task);
    }
  }

  // Sort groups by groupOrder if provided
  const sortedGroups = groupOrder
    ? [...tasksByLabel.entries()].sort((a, b) => {
        const ai = groupOrder.indexOf(a[0]);
        const bi = groupOrder.indexOf(b[0]);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      })
    : [...tasksByLabel.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const isWide = viewMode === 'kanban' || viewMode === 'gantt';

  return (
    <div className={`w-full ${isWide ? 'max-w-[1250px]' : 'max-w-[640px]'} transition-all duration-300`}>
      {/* View toggle buttons */}
      <div className="flex gap-1.5 mb-6 justify-center">
        {(['labels', 'pending', 'kanban', 'gantt'] as ViewMode[]).map(mode => {
          const label = { labels: 'Labels', pending: 'Pending', kanban: 'Kanban', gantt: 'Gantt' }[mode];
          return (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              style={{
                background: viewMode === mode ? 'var(--color-accent)' : 'var(--color-surface-secondary)',
                color: viewMode === mode ? '#fff' : 'var(--color-content-muted)',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Labels view — grouped tasks */}
      {viewMode === 'labels' && (
      <div className="flex flex-col gap-4">
        {sortedGroups.map(([label, tasks]) => {
          const done = tasks.filter(t => t.done).length;
          return (
            <details key={label} className="group">
              <summary className="flex items-center justify-between cursor-pointer text-xs font-semibold text-content-secondary tracking-wide">
                <span>{label} <span className="text-content-muted font-normal ml-1">· {done}/{tasks.length}</span></span>
                <svg className="w-3 h-3 text-content-muted transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <ul className="flex flex-col gap-1.5 mt-2 pl-2">
                {tasks.map(task => (
                  <li key={task.id} className="flex items-center gap-2.5">
                    <span className={`shrink-0 w-4 h-4 rounded flex items-center justify-center border ${
                      task.done ? 'bg-accent border-accent text-white' : 'border-edge bg-surface'
                    }`}>
                      {task.done && (
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className={`text-sm ${task.done ? 'text-content-muted line-through' : 'text-content'}`}>
                      {task.title}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}

        {ungrouped.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-content-secondary tracking-wide mb-2">
              Ungrouped <span className="text-content-muted font-normal">· {ungrouped.filter(t => t.done).length}/{ungrouped.length}</span>
            </p>
            <ul className="flex flex-col gap-1.5 pl-2">
              {ungrouped.map(task => (
                <li key={task.id} className="flex items-center gap-2.5">
                  <span className={`shrink-0 w-4 h-4 rounded flex items-center justify-center border ${
                    task.done ? 'bg-accent border-accent text-white' : 'border-edge bg-surface'
                  }`}>
                    {task.done && (
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className={`text-sm ${task.done ? 'text-content-muted line-through' : 'text-content'}`}>
                    {task.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      )}

      {/* Pending view — only unfinished tasks */}
      {viewMode === 'pending' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">
            Pending · {vikunja.open}
          </p>
          <ul className="flex flex-col gap-1.5">
            {vikunja.tasks
              .filter(t => !t.done)
              .map(task => (
                <li key={task.id} className="flex items-center gap-2.5">
                  <span className="shrink-0 w-4 h-4 rounded flex items-center justify-center border border-edge bg-surface-secondary" />
                  <span className="text-sm text-content">{task.title}</span>
                  {(task.labels || []).map(l => (
                    <span
                      key={l.id}
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: `#${l.hex_color}22`, color: `#${l.hex_color}` }}
                    >
                      {l.title}
                    </span>
                  ))}
                </li>
              ))}
          </ul>
          {vikunja.open === 0 && (
            <p className="text-sm text-content-muted py-4 text-center">All tasks complete!</p>
          )}
        </div>
      )}

      {/* Kanban view — placeholder */}
      {viewMode === 'kanban' && (
        <div className="text-center py-8">
          <p className="text-sm text-content-muted">Kanban view coming soon.</p>
          <p className="text-xs text-content-muted mt-1">View tasks in Kanban format at <a href="https://tasks.himynameisrich.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover">tasks.himynameisrich.com</a></p>
        </div>
      )}

      {/* Gantt view — placeholder */}
      {viewMode === 'gantt' && (
        <div className="text-center py-8">
          <p className="text-sm text-content-muted">Gantt view coming soon.</p>
          <p className="text-xs text-content-muted mt-1">View timeline at <a href="https://tasks.himynameisrich.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover">tasks.himynameisrich.com</a></p>
        </div>
      )}
    </div>
  );
}
