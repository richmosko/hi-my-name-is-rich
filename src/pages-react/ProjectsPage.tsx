import { useState } from 'react';
import { Link } from 'react-router-dom';
import { projects } from '../lib/projects';
import { getProjectCompletion } from '../types';
import { parseLocalDate } from '../lib/dateUtils';
import { useVikunjaProject, useVikunjaIssueCounts } from '../hooks/useVikunja';
import type { Project, ProjectTask } from '../types';

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
            : 'border-edge bg-surface'
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

/** Group tasks by their `group` field, preserving order of first appearance */
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
    // Flat list — no groups
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

  // Grouped view
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

function ProjectCard({ project, issueCounts }: { project: Project; issueCounts?: { bug: number; enhancement: number; question: number; total: number } }) {
  const [expanded, setExpanded] = useState(false);
  const vikunja = useVikunjaProject(project.vikunjaProjectId);
  const staticPercent = getProjectCompletion(project);
  const percent = vikunja.total > 0 ? vikunja.percent : staticPercent;
  const isCompleted = project.status === 'completed';
  const hasDetails = project.excerpt || project.tasks.length > 0 || vikunja.total > 0;

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-8 flex flex-col gap-4 sm:gap-5 ${
        isCompleted
          ? 'border-edge/60 bg-surface-secondary/40'
          : 'border-edge bg-surface'
      } ${hasDetails ? 'cursor-pointer' : ''}`}
      onClick={() => hasDetails && setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Link
              to={`/project/${project.id}`}
              onClick={(e) => e.stopPropagation()}
              className={`text-lg sm:text-xl font-semibold hover:text-accent transition-colors ${
                isCompleted ? 'text-content-muted' : 'text-content'
              }`}
            >
              {project.name}
            </Link>
            <span
              className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isCompleted
                  ? 'bg-emerald-500/10 text-emerald-700'
                  : 'bg-accent/10 text-accent'
              }`}
            >
              {isCompleted ? 'Completed' : 'Active'}
            </span>
            {/* Issue badges */}
            {issueCounts && issueCounts.bug > 0 && (
              <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#ef444422', color: '#ef4444' }}>
                {issueCounts.bug} bug{issueCounts.bug > 1 ? 's' : ''}
              </span>
            )}
            {issueCounts && issueCounts.enhancement > 0 && (
              <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#3b82f622', color: '#3b82f6' }}>
                {issueCounts.enhancement} enh
              </span>
            )}
            {issueCounts && issueCounts.question > 0 && (
              <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#a855f722', color: '#a855f7' }}>
                {issueCounts.question} ?
              </span>
            )}
            {hasDetails && (
              <svg
                className={`w-4 h-4 text-content-muted transition-transform duration-200 ${
                  expanded ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
          <p
            className={`text-sm mt-1 ${
              isCompleted ? 'text-content-muted' : 'text-content-secondary'
            }`}
          >
            {project.description}
          </p>
        </div>

        {/* Percentage */}
        <span
          className={`text-xl sm:text-2xl font-bold tabular-nums shrink-0 ${
            percent === 100 ? 'text-emerald-600' : 'text-accent'
          }`}
        >
          {percent}%
        </span>
      </div>

      {/* Progress bar */}
      <ProgressBar percent={percent} />

      {/* Dates */}
      {(project.startDate || project.completedDate) && (
        <div className="flex gap-4 text-xs text-content-muted">
          {project.startDate && (
            <span>
              Started{' '}
              {parseLocalDate(project.startDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )}
          {project.completedDate && (
            <span>
              Completed{' '}
              {parseLocalDate(project.completedDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          )}
        </div>
      )}

      {/* Expandable details */}
      {expanded && (
        <>
          {/* Excerpt */}
          {project.excerpt && (
            <div className="pt-2 border-t border-edge/50 text-sm text-content-secondary leading-relaxed">
              {project.excerpt}
            </div>
          )}

          {/* Task list — Vikunja live or static MDX */}
          {vikunja.total > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">
                Tasks &middot; {vikunja.done}/{vikunja.total}
              </p>
              {vikunja.subProjects.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {vikunja.subProjects.map(sp => (
                    <div key={sp.id} className="flex flex-col gap-1">
                      <p className="text-xs font-semibold text-content-secondary tracking-wide">
                        {sp.title}
                        <span className="text-content-muted font-normal ml-1.5">
                          &middot; {sp.done}/{sp.total}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-content-muted">{vikunja.done} done · {vikunja.open} open</p>
              )}
            </div>
          ) : project.tasks.length > 0 ? (
            <TaskList tasks={project.tasks} />
          ) : null}
        </>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  const activeProjects = projects.filter((p) => p.status === 'active');
  const completedProjects = projects.filter((p) => p.status === 'completed');
  const { counts: issueCounts } = useVikunjaIssueCounts();

  return (
    <div className="flex flex-col gap-8 items-center">
      {/* Page header */}
      <div className="w-full max-w-[640px]">
        <h1 className="text-2xl sm:text-3xl font-bold text-content">Projects</h1>
        <p className="text-content-secondary mt-2 text-sm">
          What I&rsquo;m building, tinkering with, and have shipped.
        </p>
      </div>

      {/* Hero image */}
      <div className="w-full max-w-[1250px] rounded-2xl overflow-hidden">
        <img
          src="/images/stock/profile-rich-welding.jpg"
          alt="Rich welding in the workshop"
          className="w-full h-auto object-cover aspect-[21/9]"
        />
      </div>

      {/* Active projects */}
      {activeProjects.length > 0 && (
        <section className="w-full max-w-[640px] flex flex-col gap-6">
          <h2 className="text-xl font-semibold text-content">
            In Progress
          </h2>
          <div className="flex flex-col gap-6">
            {activeProjects.map((project) => (
              <ProjectCard key={project.id} project={project} issueCounts={project.vikunjaProjectId ? issueCounts[project.vikunjaProjectId] : undefined} />
            ))}
          </div>
        </section>
      )}

      {/* Completed projects */}
      {completedProjects.length > 0 && (
        <section className="w-full max-w-[640px] flex flex-col gap-6">
          <h2 className="text-xl font-semibold text-content-muted">
            Completed
          </h2>
          <div className="flex flex-col gap-6">
            {completedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} issueCounts={project.vikunjaProjectId ? issueCounts[project.vikunjaProjectId] : undefined} />
            ))}
          </div>
        </section>
      )}

      {projects.length === 0 && (
        <div className="text-center py-16">
          <p className="text-content-muted">No projects yet.</p>
        </div>
      )}
    </div>
  );
}
