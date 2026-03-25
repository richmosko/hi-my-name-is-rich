import type { VikunjaTask } from '../hooks/useVikunja';

const ZERO_DATE = '0001-01-01T00:00:00Z';

function hasValidDate(dateStr: string): boolean {
  return !!dateStr && dateStr !== ZERO_DATE && !dateStr.startsWith('0001');
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export default function GanttChart({ tasks, loading }: {
  tasks: VikunjaTask[];
  loading: boolean;
}) {
  if (loading) {
    return <div className="text-sm text-content-muted py-8 text-center">Loading Gantt chart...</div>;
  }

  // Filter tasks that have valid start OR end dates
  const datedTasks = tasks.filter(t =>
    hasValidDate(t.start_date) || hasValidDate(t.end_date) || hasValidDate(t.due_date)
  );

  if (datedTasks.length === 0) {
    return (
      <div className="text-sm text-content-muted py-8 text-center">
        <p>No tasks have start/end dates yet.</p>
        <p className="mt-2">
          Add dates to tasks in{' '}
          <a href={`${import.meta.env.VITE_VIKUNJA_HOST || '#'}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent-hover">
            Vikunja
          </a>{' '}
          to see the Gantt chart.
        </p>
      </div>
    );
  }

  // Calculate timeline bounds
  const dates = datedTasks.flatMap(t => {
    const d: Date[] = [];
    if (hasValidDate(t.start_date)) d.push(new Date(t.start_date));
    if (hasValidDate(t.end_date)) d.push(new Date(t.end_date));
    if (hasValidDate(t.due_date)) d.push(new Date(t.due_date));
    return d;
  });

  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

  // Add padding (1 week on each side)
  minDate.setDate(minDate.getDate() - 7);
  maxDate.setDate(maxDate.getDate() + 7);

  const totalDays = daysBetween(minDate, maxDate) || 1;

  // Group tasks by first label
  const groups: { label: string; color: string; tasks: VikunjaTask[] }[] = [];
  const groupMap = new Map<string, VikunjaTask[]>();

  for (const task of datedTasks) {
    const label = task.labels?.[0]?.title || 'Ungrouped';
    if (!groupMap.has(label)) {
      groupMap.set(label, []);
      groups.push({
        label,
        color: task.labels?.[0]?.hex_color || '888888',
        tasks: groupMap.get(label)!,
      });
    }
    groupMap.get(label)!.push(task);
  }

  // Generate month markers
  const months: { label: string; left: number }[] = [];
  const current = new Date(minDate);
  current.setDate(1);
  current.setMonth(current.getMonth() + 1);
  while (current <= maxDate) {
    const offset = daysBetween(minDate, current) / totalDays * 100;
    months.push({
      label: current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      left: offset,
    });
    current.setMonth(current.getMonth() + 1);
  }

  // Today marker
  const today = new Date();
  const todayOffset = today >= minDate && today <= maxDate
    ? daysBetween(minDate, today) / totalDays * 100
    : null;

  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <div className="min-w-[600px]">
        {/* Timeline header */}
        <div className="relative h-6 border-b border-edge mb-2">
          {months.map((m, i) => (
            <span
              key={i}
              className="absolute text-[10px] text-content-muted"
              style={{ left: `${m.left}%`, transform: 'translateX(-50%)' }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* Task rows */}
        <div className="flex flex-col gap-1">
          {groups.map(group => (
            <div key={group.label}>
              {/* Group header */}
              <div className="flex items-center gap-1.5 py-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: `#${group.color}` }}
                />
                <span className="text-xs font-semibold text-content-secondary">{group.label}</span>
              </div>

              {/* Task bars */}
              {group.tasks.map(task => {
                const start = hasValidDate(task.start_date)
                  ? new Date(task.start_date)
                  : hasValidDate(task.due_date) ? new Date(task.due_date) : minDate;
                const end = hasValidDate(task.end_date)
                  ? new Date(task.end_date)
                  : hasValidDate(task.due_date) ? new Date(task.due_date) : start;

                const leftPct = daysBetween(minDate, start) / totalDays * 100;
                const widthPct = Math.max(daysBetween(start, end) / totalDays * 100, 0.5);

                return (
                  <div key={task.id} className="relative h-7 flex items-center">
                    {/* Task name */}
                    <span className={`absolute left-0 text-[11px] truncate max-w-[140px] z-10 ${
                      task.done ? 'text-content-muted' : 'text-content-secondary'
                    }`}>
                      {task.title}
                    </span>
                    {/* Bar */}
                    <div
                      className="absolute h-4 rounded-sm"
                      style={{
                        left: `max(150px, ${leftPct}%)`,
                        width: `${widthPct}%`,
                        minWidth: '4px',
                        backgroundColor: task.done
                          ? `#${group.color}88`
                          : `#${group.color}`,
                        border: task.done ? 'none' : `1px solid #${group.color}`,
                        opacity: task.done ? 0.5 : 1,
                      }}
                      title={`${task.title}: ${formatDate(start.toISOString())} – ${formatDate(end.toISOString())}`}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Today line */}
        {todayOffset !== null && (
          <div
            className="absolute top-0 bottom-0 w-px bg-red-500/50 pointer-events-none"
            style={{ left: `${todayOffset}%` }}
          />
        )}
      </div>
    </div>
  );
}
