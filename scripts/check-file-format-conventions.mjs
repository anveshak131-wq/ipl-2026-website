#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);
const tracked = new Set(trackedFiles);

const failures = [];

function addFailure(title, files) {
  if (files.length === 0) {
    return;
  }

  failures.push({ title, files });
}

const requiredConfigs = [
  'next.config.mjs',
  'tailwind.config.js',
  'postcss.config.js',
  'wrangler.toml',
];

addFailure(
  'Missing canonical config files:',
  requiredConfigs.filter((file) => !existsSync(file)),
);

addFailure(
  'Canonical config files should be tracked:',
  requiredConfigs.filter((file) => existsSync(file) && !tracked.has(file)),
);

const duplicateConfigs = [
  'next.config.js',
  'next.config.ts',
  'next.config.cjs',
  'tailwind.config.ts',
  'tailwind.config.mjs',
  'tailwind.config.cjs',
  'postcss.config.ts',
  'postcss.config.mjs',
  'postcss.config.cjs',
  'wrangler.json',
  'wrangler.jsonc',
];

addFailure(
  'Duplicate config files should not exist in the working tree:',
  duplicateConfigs.filter((file) => existsSync(file)),
);

addFailure(
  'Generated local state should not be tracked:',
  trackedFiles.filter((file) => file.startsWith('.wrangler/') || file.startsWith('.tmp/')),
);

function isAllowedJavaScript(file) {
  if (file.startsWith('functions/')) {
    return true;
  }

  return [
    'postcss.config.js',
    'tailwind.config.js',
    'prototype/script.js',
  ].includes(file);
}

addFailure(
  'Use TypeScript for app code and .mjs for local automation instead of tracked .js files:',
  trackedFiles.filter((file) => file.endsWith('.js') && !isAllowedJavaScript(file)),
);

if (failures.length > 0) {
  console.error('File format convention check failed.\n');

  for (const failure of failures) {
    console.error(failure.title);
    for (const file of failure.files) {
      console.error(`  - ${file}`);
    }
    console.error('');
  }

  process.exit(1);
}

console.log('File format conventions OK.');
