import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('src/pages/Admin.tsx'), 'utf8');

assert.match(
  source,
  /status === 'hidden'\s*\?\s*'博客已隐藏，前台不会展示。'/,
  'Blog save notice should explain that hidden blog posts are not shown publicly.',
);

assert.match(
  source,
  /const blogVisibilityTargetStatus = form\.status === 'hidden' \? 'published' : 'hidden';/,
  'Blog visibility action should publish hidden blog posts and hide visible blog posts.',
);

assert.match(
  source,
  /const blogVisibilityButtonLabel = form\.status === 'hidden' \? '显示博客' : '隐藏博客';/,
  'Blog visibility button should read 显示博客 when the current blog post is hidden.',
);

assert.match(
  source,
  /onClick=\{\(\) => void save\(blogVisibilityTargetStatus\)\}/,
  'Blog editor should use the dynamic visibility target status.',
);

const blogEditorMatch = source.match(
  /<p className="text-xs font-black uppercase tracking-widest text-slate-400">[\s\S]*?Blog Editor[\s\S]*?<label>[\s\S]*?<span className="mb-2 block text-sm font-bold text-slate-600">博客序号<\/span>/,
);

assert.ok(blogEditorMatch, 'Blog editor block should exist.');

const blogEditorBlock = blogEditorMatch[0];

assert.match(blogEditorBlock, /<EyeOff className="h-4 w-4" \/>/);
assert.match(blogEditorBlock, /\{blogVisibilityButtonLabel\}/);
