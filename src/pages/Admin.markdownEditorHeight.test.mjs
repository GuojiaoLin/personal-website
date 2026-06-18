import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('src/pages/Admin.tsx'), 'utf8');

const markdownEditorMatch = source.match(
  /<span className="mb-2 block text-sm font-bold text-slate-600">Markdown 正文<\/span>[\s\S]*?<textarea[\s\S]*?\/>/,
);

assert.ok(markdownEditorMatch, 'Blog Markdown body editor should exist.');

const markdownEditorBlock = markdownEditorMatch[0];

assert.match(
  markdownEditorBlock,
  /rows=\{33\}/,
  'Markdown editor rows should match the taller target from the reference screenshot.',
);

assert.match(
  markdownEditorBlock,
  /min-h-\[830px\]/,
  'Markdown editor minimum height should match the taller target from the reference screenshot.',
);

assert.doesNotMatch(markdownEditorBlock, /rows=\{18\}/);
assert.doesNotMatch(markdownEditorBlock, /rows=\{27\}/);
assert.doesNotMatch(markdownEditorBlock, /min-h-\[460px\]/);
assert.doesNotMatch(markdownEditorBlock, /min-h-\[690px\]/);
