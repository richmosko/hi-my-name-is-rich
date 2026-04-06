import { useLinearProject } from '../hooks/useLinear';

interface Props {
  linearProjectId?: string;
  status: string;
}

/**
 * Compact progress bar + status for project header.
 * Shows only status badge, percentage, and progress bar.
 */
export default function ProjectProgressBar({ linearProjectId, status }: Props) {
  const project = useLinearProject(linearProjectId);

  const isCompleted = status === 'completed';

  if (!linearProjectId) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isCompleted ? 'bg-emerald-500/10 text-emerald-700' : 'bg-accent/10 text-accent'}`}>
            {isCompleted ? 'Completed' : 'Active'}
          </span>
          <span className="text-sm font-semibold text-content-muted">N/A</span>
        </div>
      </div>
    );
  }

  if (project.loading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isCompleted ? 'bg-emerald-500/10 text-emerald-700' : 'bg-accent/10 text-accent'}`}>
            {isCompleted ? 'Completed' : 'Active'}
          </span>
          <span className="text-sm font-semibold text-content-muted animate-pulse">...</span>
        </div>
        <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden animate-pulse" />
      </div>
    );
  }

  if (project.error || project.total === 0) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isCompleted ? 'bg-emerald-500/10 text-emerald-700' : 'bg-accent/10 text-accent'}`}>
            {isCompleted ? 'Completed' : 'Active'}
          </span>
          <span className="text-sm font-semibold text-content-muted">N/A</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isCompleted ? 'bg-emerald-500/10 text-emerald-700' : 'bg-accent/10 text-accent'}`}>
          {isCompleted ? 'Completed' : 'Active'}
        </span>
        <span className={`text-sm font-semibold ${project.percent === 100 ? 'text-emerald-600' : 'text-accent'}`}>
          {project.percent}%
        </span>
        <span className="text-xs text-content-muted">
          {project.done}/{project.total} tasks
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${project.percent === 100 ? 'bg-emerald-500' : 'bg-accent'}`}
          style={{ width: `${project.percent}%` }}
        />
      </div>
    </div>
  );
}
