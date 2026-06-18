import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('src/pages/Blog.tsx'), 'utf8');

assert.match(
  source,
  /interface BlogPost/,
  'Blog page should define the public blog view model without importing local Markdown data.',
);

assert.equal(
  source.includes("../lib/blog"),
  false,
  'Blog page should not import local Markdown helpers at runtime.',
);

assert.equal(
  source.includes('localBlogProjects'),
  false,
  'Blog page should not import local Markdown project metadata as fallback content.',
);

assert.equal(
  source.includes('projectDescriptions'),
  false,
  'Blog page should not look up project descriptions from local Markdown metadata.',
);

assert.match(
  source,
  /useState<BlogPost\[\]>\(\[\]\)/,
  'Blog page should start with no posts until the database API responds.',
);

assert.equal(
  source.includes('blogPosts as localBlogPosts'),
  false,
  'Blog page should not import local Markdown posts as fallback content.',
);

assert.equal(
  source.includes('setPublishedPosts(localBlogPosts)'),
  false,
  'Blog page should not restore local Markdown posts when the database API fails.',
);

assert.match(
  source,
  /useState<PublishedProjectRecord\[\]>\(\[\]\)/,
  'Blog page should start with no project folders until the database API responds.',
);

assert.equal(
  source.includes('localPublishedProjects'),
  false,
  'Blog page should not synthesize project folders from local Markdown metadata.',
);

assert.equal(
  source.includes('setPublishedProjects(localPublishedProjects)'),
  false,
  'Blog page should not restore local project folders when the database API fails.',
);
