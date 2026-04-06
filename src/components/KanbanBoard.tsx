import type { KanbanBucket } from '../hooks/useLinear';

function TaskCard({ task }: { task: KanbanBucket['tasks'][0] }) {
  const labels = task.labels || [];
  return (
    <div className="rounded-lg border border-edge bg-surface p-3 flex flex-col gap-1.5">
      <div className="flex items-start gap-2">
        <span className={`shrink-0 mt-0.5 w-4 h-4 rounded flex items-center justify-center border ${
          task.done ? 'bg-accent border-accent text-white' : 'border-edge bg-surface-secondary'
        }`}>
          {task.done && (
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
        <span className={`text-sm leading-tight ${task.done ? 'text-content-muted line-through' : 'text-content'}`}>
          {task.title}
        </span>
      </div>
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 ml-6">
          {labels.map(label => (
            <span
              key={label.id}
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `#${label.hex_color}22`,
                color: `#${label.hex_color}`,
              }}
            >
              {label.title}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Column({ bucket }: { bucket: KanbanBucket }) {
  const tasks = bucket.tasks || [];
  const doneCount = tasks.filter(t => t.done).length;

  return (
    <div className="flex flex-col min-w-[250px] max-w-[300px] flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2 rounded-t-xl bg-surface-secondary border border-edge border-b-0">
        <h3 className="text-sm font-semibold text-content">{bucket.title}</h3>
        <span className="text-xs text-content-muted tabular-nums">
          {doneCount > 0 ? `${doneCount}/` : ''}{tasks.length}
        </span>
      </div>
      {/* Task list */}
      <div className="flex flex-col gap-2 p-2 rounded-b-xl border border-edge bg-surface-secondary/30 overflow-y-auto max-h-[500px]">
        {tasks.length === 0 ? (
          <p className="text-xs text-content-muted text-center py-4">No tasks</p>
        ) : (
          tasks.map(task => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({ buckets, loading, error }: {
  buckets: KanbanBucket[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return <div className="text-sm text-content-muted py-8 text-center">Loading Kanban board...</div>;
  }

  if (error) {
    return <div className="text-sm text-red-500 py-4">{error}</div>;
  }

  if (buckets.length === 0) {
    return (
      <div className="text-sm text-content-muted py-8 text-center">
        No workflow states found. Issues will appear here once they are assigned to workflow states in Linear.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-2 px-2 pb-2">
      <div className="flex gap-4 min-w-min justify-center">
        {buckets.map(bucket => (
          <Column key={bucket.id} bucket={bucket} />
        ))}
      </div>
    </div>
  );
}
