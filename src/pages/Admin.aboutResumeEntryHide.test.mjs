import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('src/pages/Admin.tsx'), 'utf8');

assert.match(
  source,
  /value:\s*string \| number \| boolean \| string\[\] \| AboutResumeHighlight\[\]/,
  'About resume entry updater should accept boolean fields such as hidden.',
);

assert.match(
  source,
  /onClick=\{\(\) => updateAboutResumeEntry\(index, 'hidden', !entry\.hidden\)\}/,
  'Each about resume entry should expose a hide/show toggle.',
);

const resumeEntryToolbarMatch = source.match(
  /<div className="mb-4 flex flex-wrap items-start justify-between gap-3">[\s\S]*?<\/Button>\s*<\/div>\s*<\/div>\s*<div className="grid gap-3 xl:grid-cols/,
);

assert.ok(resumeEntryToolbarMatch, 'About resume entry toolbar should exist.');

const resumeEntryToolbar = resumeEntryToolbarMatch[0];

assert.match(resumeEntryToolbar, /<EyeOff className="h-3\.5 w-3\.5" \/>/);
assert.match(resumeEntryToolbar, /<Trash2 className="h-3\.5 w-3\.5" \/>/);
assert.match(resumeEntryToolbar, /entry\.hidden \? '显示' : '隐藏'/);
assert.match(resumeEntryToolbar, /entry\.hidden && \(/);
