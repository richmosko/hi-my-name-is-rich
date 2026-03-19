import { useParams, Link } from 'react-router-dom';
import { projects } from '../lib/projects';
import { getProjectCompletion } from '../types';
import { mdxComponents } from '../components/MdxComponents';
import type { ProjectTask } from '../types';

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          percent === 100 ? 'bg-emerald-500' : 'bg-accent'
        }`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function TaskItem({ task }: { task: ProjectTask }) {
  return (
    <li className="flex items-center gap-2.5">
      <span
        className={`shrink-0 w-4 h-4 rounded flex items-center justify-center border ${
          task.completed
            ? 'bg-accent border-accent text-white'
            : 'border-edge bg-white'
        }`}
      >
        {task.completed && (
          <svg
            className="w-2.5 h-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </span>
      <span
        className={`text-sm ${
          task.completed
            ? 'text-content-muted line-through'
            : 'text-content'
        }`}
      >
        {task.title}
      </span>
    </li>
  );
}

function groupTasks(tasks: ProjectTask[]) {
  const groups: { name: string | null; tasks: ProjectTask[] }[] = [];
  const groupMap = new Map<string | null, ProjectTask[]>();

  for (const task of tasks) {
    const key = task.group ?? null;
    if (!groupMap.has(key)) {
      const arr: ProjectTask[] = [];
      groupMap.set(key, arr);
      groups.push({ name: key, tasks: arr });
    }
    groupMap.get(key)!.push(task);
  }

  return groups;
}

function TaskList({ tasks }: { tasks: ProjectTask[] }) {
  const completedCount = tasks.filter((t) => t.completed).length;
  const hasGroups = tasks.some((t) => t.group);

  if (!hasGroups) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">
          Tasks &middot; {completedCount}/{tasks.length}
        </p>
        <ul className="flex flex-col gap-1.5">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </ul>
      </div>
    );
  }

  const groups = groupTasks(tasks);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">
        Tasks &middot; {completedCount}/{tasks.length}
      </p>
      <div className="flex flex-col gap-4">
        {groups.map((group) => {
          const groupDone = group.tasks.filter((t) => t.completed).length;
          return (
            <div key={group.name ?? '_ungrouped'} className="flex flex-col gap-1.5">
              {group.name && (
                <p className="text-xs font-semibold text-content-secondary tracking-wide">
                  {group.name}
                  <span className="text-content-muted font-normal ml-1.5">
                    &middot; {groupDone}/{group.tasks.length}
                  </span>
                </p>
              )}
              <ul className={`flex flex-col gap-1.5 ${group.name ? 'pl-2' : ''}`}>
                {group.tasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-content mb-4">
          Project not found
        </h2>
        <Link to="/projects" className="text-accent hover:text-accent-hover">
          &larr; Back to projects
        </Link>
      </div>
    );
  }

  const percent = getProjectCompletion(project);
  const isCompleted = project.status === 'completed';
  const ProjectContent = project.content;

  return (
    <article className="flex flex-col gap-8 items-center">
      {/* Header */}
      <header className="w-full max-w-[640px] flex flex-col gap-4">
        <Link
          to="/projects"
          className="text-sm text-content-muted hover:text-accent transition-colors inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All Projects
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-content">
                {project.name}
              </h1>
              <span
                className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isCompleted
                    ? 'bg-emerald-500/10 text-emerald-700'
                    : 'bg-accent/10 text-accent'
                }`}
              >
                {isCompleted ? 'Completed' : 'Active'}
              </span>
            </div>
            <p className="text-sm text-content-secondary mt-1">
              {project.description}
            </p>
          </div>

          <span
            className={`text-2xl sm:text-3xl font-bold tabular-nums shrink-0 ${
              percent === 100 ? 'text-emerald-600' : 'text-accent'
            }`}
          >
            {percent}%
          </span>
        </div>

        <ProgressBar percent={percent} />

        {/* Dates */}
        {(project.startDate || project.completedDate) && (
          <div className="flex gap-4 text-xs text-content-muted">
            {project.startDate && (
              <span>
                Started{' '}
                {new Date(project.startDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
            {project.completedDate && (
              <span>
                Completed{' '}
                {new Date(project.completedDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>
        )}
        {/* External link */}
        {project.url && project.url !== '#' && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent hover:underline inline-flex items-center gap-1"
          >
            Visit Project
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </header>

      {/* Hero image */}
      {project.image && (
        <div
          className="w-full max-w-[1250px] rounded-xl overflow-hidden"
          style={{ aspectRatio: project.imageAspectRatio || '16/9' }}
        >
          <img
            src={project.image}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* MDX content */}
      {ProjectContent && (
        <div className="w-full max-w-[640px] text-sm text-content-secondary leading-relaxed">
          <ProjectContent components={mdxComponents} />
        </div>
      )}

      {/* Task list */}
      {project.tasks.length > 0 && (
        <div className="w-full max-w-[640px]">
          <TaskList tasks={project.tasks} />
        </div>
      )}
    </article>
  );
}
