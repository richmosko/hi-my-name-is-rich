import { useVikunjaProject } from '../hooks/useVikunja';

interface ProjectProgressProps {
  vikunjaProjectId?: number;
  projectName: string;
  projectUrl: string;
}

/**
 * React island that displays live project progress from Vikunja.
 * Shows N/A when Vikunja data is unavailable.
 */
export default function ProjectProgress({ vikunjaProjectId, projectName, projectUrl }: ProjectProgressProps) {
  const vikunja = useVikunjaProject(vikunjaProjectId);

  if (!vikunjaProjectId) {
    return (
      <a href={projectUrl} className="rounded-2xl border border-edge p-5 sm:p-8 hover:border-accent transition-colors block">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-content">{projectName}</h3>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-content-muted shrink-0">N/A</span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden mt-4">
          <div className="h-full rounded-full bg-content-muted" style={{ width: '0%' }} />
        </div>
        <p className="text-xs text-content-muted mt-2">No task tracking configured</p>
      </a>
    );
  }

  if (vikunja.loading) {
    return (
      <div className="rounded-2xl border border-edge p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg sm:text-xl font-semibold text-content">{projectName}</h3>
          <span className="text-xl sm:text-2xl font-bold text-content-muted shrink-0 animate-pulse">...</span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden mt-4 animate-pulse" />
      </div>
    );
  }

  if (vikunja.error || vikunja.total === 0) {
    return (
      <a href={projectUrl} className="rounded-2xl border border-edge p-5 sm:p-8 hover:border-accent transition-colors block">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-content">{projectName}</h3>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-content-muted shrink-0">N/A</span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden mt-4">
          <div className="h-full rounded-full bg-content-muted" style={{ width: '0%' }} />
        </div>
        <p className="text-xs text-content-muted mt-2">
          {vikunja.error ? 'Task data unavailable' : 'No tasks found'}
        </p>
      </a>
    );
  }

  return (
    <a href={projectUrl} className="rounded-2xl border border-edge p-5 sm:p-8 hover:border-accent transition-colors block">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-content">{projectName}</h3>
          <p className="text-xs text-content-muted mt-1">
            {vikunja.done}/{vikunja.total} tasks · {vikunja.open} remaining
          </p>
        </div>
        <span className={`text-xl sm:text-2xl font-bold shrink-0 ${vikunja.percent === 100 ? 'text-emerald-600' : 'text-accent'}`}>
          {vikunja.percent}%
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden mt-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${vikunja.percent === 100 ? 'bg-emerald-500' : 'bg-accent'}`}
          style={{ width: `${vikunja.percent}%` }}
        />
      </div>
    </a>
  );
}
