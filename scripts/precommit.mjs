#!/usr/bin/env node
// Runs all tasks that should happen before committing content changes

import { execSync } from 'child_process';

const tasks = [
  { name: 'Update read times', cmd: 'node scripts/update-read-times.mjs' },
  { name: 'Build search index', cmd: 'node scripts/build-search-index.mjs' },
  { name: 'Generate gallery manifests', cmd: 'node scripts/generate-gallery-manifest.mjs' },
  { name: 'Lint', cmd: 'npx eslint .' },
];

console.log('\n🔧 Running pre-commit tasks...\n');

let failed = false;

for (const task of tasks) {
  process.stdout.write(`  ⏳ ${task.name}...`);
  try {
    const output = execSync(task.cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const summary = output.trim().split('\n').pop() || 'done';
    console.log(`\r  ✅ ${task.name} — ${summary}`);
  } catch (err) {
    console.log(`\r  ❌ ${task.name} — FAILED`);
    console.error(err.stderr || err.stdout || err.message);
    failed = true;
  }
}

console.log('');
if (failed) {
  console.log('⚠️  Some tasks failed. Fix the issues above before committing.\n');
  process.exit(1);
} else {
  console.log('✅ All pre-commit tasks passed. Ready to commit!\n');
}
