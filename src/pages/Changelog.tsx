import { useVikunjaRecentTasks, type VikunjaTask } from '../hooks/useVikunja';
import { useTheme } from '../hooks/useTheme';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function groupByDate(tasks: VikunjaTask[]): Map<string, VikunjaTask[]> {
  const groups = new Map<string, VikunjaTask[]>();
  for (const task of tasks) {
    const date = task.done_at
      ? new Date(task.done_at).toISOString().slice(0, 10)
      : new Date(task.updated).toISOString().slice(0, 10);
    const existing = groups.get(date) || [];
    existing.push(task);
    groups.set(date, existing);
  }
  return groups;
}

function groupByMonth(tasks: VikunjaTask[]): Map<string, VikunjaTask[]> {
  const groups = new Map<string, VikunjaTask[]>();
  for (const task of tasks) {
    const date = task.done_at ? new Date(task.done_at) : new Date(task.updated);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = groups.get(key) || [];
    existing.push(task);
    groups.set(key, existing);
  }
  return groups;
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function Changelog() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { tasks, loading, error } = useVikunjaRecentTasks(200);

  // Split into completed and recent activity
  const completedTasks = tasks.filter(t => t.done).sort((a, b) => {
    const aDate = a.done_at || a.updated;
    const bDate = b.done_at || b.updated;
    return bDate.localeCompare(aDate);
  });

  const monthGroups = groupByMonth(completedTasks);

  const cardStyle = {
    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
  };

  return (
    <div className="max-w-[640px] mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-content mb-2">Changelog</h1>
      <p className="text-content-muted text-sm mb-8">
        Recently completed tasks across all projects, pulled live from Vikunja.
      </p>

      {loading && (
        <div className="text-center text-content-muted py-12">Loading changelog...</div>
      )}

      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {!loading && completedTasks.length === 0 && (
        <p className="text-content-muted text-sm py-8 text-center">No completed tasks yet.</p>
      )}

      {/* Month groups */}
      {Array.from(monthGroups.entries()).map(([month, monthTasks]) => {
        const dayGroups = groupByDate(monthTasks);

        return (
          <div key={month} className="mb-10">
            <h2 className="text-xl font-semibold text-content mb-4">
              {monthLabel(month)}
            </h2>

            {Array.from(dayGroups.entries()).map(([date, dayTasks]) => (
              <div key={date} className="mb-4">
                <div className="text-xs font-medium text-content-muted mb-2 uppercase tracking-wide">
                  {formatDate(date)}
                </div>
                <div className="space-y-1.5">
                  {dayTasks.map(task => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 rounded-lg px-4 py-2.5"
                      style={cardStyle}
                    >
                      <span className="text-green-500 flex-shrink-0">✓</span>
                      <span className="text-sm text-content flex-1">{task.title}</span>
                      {task.labels?.length > 0 && (
                        <div className="flex gap-1 flex-shrink-0">
                          {task.labels.map(label => (
                            <span
                              key={label.id}
                              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{
                                background: `#${label.hex_color}22`,
                                color: `#${label.hex_color}`,
                              }}
                            >
                              {label.title}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* Stats footer */}
      {!loading && completedTasks.length > 0 && (
        <div className="border-t border-edge pt-4 mt-8 text-xs text-content-muted text-center">
          {completedTasks.length} tasks completed · Data from Vikunja
        </div>
      )}
    </div>
  );
}
