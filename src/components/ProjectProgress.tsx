import { useLinearProject } from '../hooks/useLinear';

interface ProjectProgressProps {
  linearProjectId?: string;
  projectName: string;
  projectUrl: string;
  description?: string;
}

/**
 * React island that displays live project progress from Linear.
 * Shows N/A when Linear data is unavailable.
 */
export default function ProjectProgress({ linearProjectId, projectName, projectUrl, description }: ProjectProgressProps) {
  const project = useLinearProject(linearProjectId);

  if (!linearProjectId) {
    return (
      <a href={projectUrl} className="rounded-2xl border border-edge p-5 sm:p-8 hover:border-accent transition-colors block">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-content">{projectName}</h3>{description && <p className="text-sm text-content-secondary mt-1">{description}</p>}
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

  if (project.loading) {
    return (
      <div className="rounded-2xl border border-edge p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg sm:text-xl font-semibold text-content">{projectName}</h3>{description && <p className="text-sm text-content-secondary mt-1">{description}</p>}
          <span className="text-xl sm:text-2xl font-bold text-content-muted shrink-0 animate-pulse">...</span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden mt-4 animate-pulse" />
      </div>
    );
  }

  if (project.error || project.total === 0) {
    return (
      <a href={projectUrl} className="rounded-2xl border border-edge p-5 sm:p-8 hover:border-accent transition-colors block">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-content">{projectName}</h3>{description && <p className="text-sm text-content-secondary mt-1">{description}</p>}
          </div>
          <span className="text-xl sm:text-2xl font-bold text-content-muted shrink-0">N/A</span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden mt-4">
          <div className="h-full rounded-full bg-content-muted" style={{ width: '0%' }} />
        </div>
        <p className="text-xs text-content-muted mt-2">
          {project.error ? 'Task data unavailable' : 'No tasks found'}
        </p>
      </a>
    );
  }

  return (
    <a href={projectUrl} className="rounded-2xl border border-edge p-5 sm:p-8 hover:border-accent transition-colors block">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-content">{projectName}</h3>{description && <p className="text-sm text-content-secondary mt-1">{description}</p>}
          <p className="text-xs text-content-muted mt-1">
            {project.done}/{project.total} tasks · {project.open} remaining
          </p>
        </div>
        <span className={`text-xl sm:text-2xl font-bold shrink-0 ${project.percent === 100 ? 'text-emerald-600' : 'text-accent'}`}>
          {project.percent}%
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden mt-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${project.percent === 100 ? 'bg-emerald-500' : 'bg-accent'}`}
          style={{ width: `${project.percent}%` }}
        />
      </div>
    </a>
  );
}
