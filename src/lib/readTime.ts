/**
 * Calculate human-readable read time from raw MDX body.
 *
 * Strips frontmatter and code/JSX noise, then assumes ~200 WPM.
 * Always rounds up to at least 1 minute.
 */
export function calculateReadTime(body: string): string {
  const text = body
    .replace(/^---[\s\S]*?---/, '')           // frontmatter (defensive — usually already stripped)
    .replace(/^import\s+.*$/gm, '')            // import statements
    .replace(/<[^>]+>/g, ' ')                  // JSX/HTML tags
    .replace(/```[\s\S]*?```/g, '')            // fenced code blocks
    .replace(/`[^`]*`/g, '')                   // inline code
    .replace(/https?:\/\/\S+/g, '');            // URLs

  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}
