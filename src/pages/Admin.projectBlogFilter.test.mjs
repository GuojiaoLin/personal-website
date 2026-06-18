import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('src/pages/Admin.tsx'), 'utf8');

assert.match(
  source,
  /const visibleBlogPosts = useMemo\(\(\) => \(/,
  'Admin should derive a visible blog list instead of rendering every post.',
);

const visiblePostsMatch = source.match(
  /const visibleBlogPosts = useMemo\(\(\) => \([\s\S]*?\), \[posts, selectedProjectId\]\);/,
);

assert.ok(visiblePostsMatch, 'Visible blog list should depend on posts and selectedProjectId.');

const visiblePostsBlock = visiblePostsMatch[0];

assert.match(
  visiblePostsBlock,
  /selectedProjectId\s*\?\s*posts\.filter\(\(post\) => post\.projectId === selectedProjectId\)\s*:\s*posts/,
  'Visible blog list should include only posts for the selected project when a project is selected.',
);

const blogListMatch = source.match(
  /\) : contentTab === 'blog' \? \([\s\S]*?\) : contentTab === 'gallery' \? \(/,
);

assert.ok(blogListMatch, 'Admin blog sidebar block should exist.');

const blogListBlock = blogListMatch[0];

assert.match(blogListBlock, /visibleBlogPosts\.length === 0/);
assert.match(blogListBlock, /visibleBlogPosts\.map\(\(post\) => \{/);
assert.doesNotMatch(blogListBlock, /posts\.length === 0/);
assert.doesNotMatch(blogListBlock, /posts\.map\(\(post\) => \{/);
