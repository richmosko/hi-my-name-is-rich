#!/usr/bin/env node

const commands = [
  { cmd: 'npm run help', desc: 'Show this help message' },
  { cmd: '', desc: '' },
  { cmd: '--- Development ---', desc: '' },
  { cmd: 'npm run dev', desc: 'Start local dev server (http://localhost:5173)' },
  { cmd: 'npm run build', desc: 'TypeScript check + production build' },
  { cmd: 'npm run preview', desc: 'Preview production build locally' },
  { cmd: 'npm run lint', desc: 'Run ESLint on all files' },
  { cmd: '', desc: '' },
  { cmd: '--- Content ---', desc: '' },
  { cmd: 'npm run new-post -- "Title"', desc: 'Create a new blog post MDX file' },
  { cmd: 'npm run new-project -- "Name"', desc: 'Create a new project MDX file' },
  { cmd: 'npm run update-read-times', desc: 'Recalculate readTime for all posts' },
  { cmd: 'npm run build-search-index', desc: 'Rebuild full-text search index' },
  { cmd: 'npm run generate-galleries', desc: 'Generate manifest.json for photo albums' },
  { cmd: '', desc: '' },
  { cmd: '--- Pre-commit ---', desc: '' },
  { cmd: 'npm run precommit', desc: 'Run all pre-commit tasks (read times, search index, galleries, lint)' },
];

console.log('\n  📖 hi-my-name-is-rich — Available Commands\n');

for (const { cmd, desc } of commands) {
  if (!cmd && !desc) {
    console.log('');
  } else if (cmd.startsWith('---')) {
    console.log(`  \x1b[1m${cmd}\x1b[0m`);
  } else {
    console.log(`  \x1b[36m${cmd.padEnd(42)}\x1b[0m ${desc}`);
  }
}

console.log('');
