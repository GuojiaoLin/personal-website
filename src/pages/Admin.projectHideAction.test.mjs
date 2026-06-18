import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('src/pages/Admin.tsx'), 'utf8');

assert.match(
  source,
  /status === 'hidden'\s*\?\s*'项目已隐藏，前台不会展示。'/,
  'Project save notice should explain that hidden projects are not shown publicly.',
);

assert.match(
  source,
  /const projectVisibilityTargetStatus = projectForm\.status === 'hidden' \? 'published' : 'hidden';/,
  'Project visibility action should publish hidden projects and hide visible projects.',
);

assert.match(
  source,
  /const projectVisibilityButtonLabel = projectForm\.status === 'hidden' \? '显示项目' : '隐藏项目';/,
  'Project visibility button should read 显示项目 when the current project is hidden.',
);

assert.match(
  source,
  /onClick=\{\(\) => void saveProject\(projectVisibilityTargetStatus\)\}/,
  'Project editor should use the dynamic visibility target status.',
);

const projectEditorMatch = source.match(
  /<p className="text-xs font-black uppercase tracking-widest text-slate-400">Project Editor<\/p>[\s\S]*?<section className="rounded-md border border-slate-200 bg-white p-4">/,
);

assert.ok(projectEditorMatch, 'Project editor block should exist.');

const projectEditorBlock = projectEditorMatch[0];

assert.match(projectEditorBlock, /<EyeOff className="h-4 w-4" \/>/);
assert.match(projectEditorBlock, /\{projectVisibilityButtonLabel\}/);
