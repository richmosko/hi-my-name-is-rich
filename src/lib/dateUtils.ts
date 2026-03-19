/**
 * Parse a date string (e.g. "2026-03-01" or "2026-03-01T06:10:00") as local time.
 *
 * JavaScript's `new Date("2026-03-01")` treats date-only strings as UTC midnight,
 * which shifts back a day when displayed in US timezones.  Appending `T00:00:00`
 * forces the parser to treat it as local midnight instead.
 */
export function parseLocalDate(dateStr: string): Date {
  // Normalize space-separated datetime ("2026-03-01 06:10:00") to T-separated
  const normalized = dateStr.trim().replace(/^(\d{4}-\d{2}-\d{2})\s+(\d)/, '$1T$2');

  // If it already has a time component, leave it alone
  if (normalized.includes('T')) {
    return new Date(normalized);
  }
  return new Date(`${normalized}T00:00:00`);
}
