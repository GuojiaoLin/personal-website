import assert from 'node:assert/strict';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const sourcePath = resolve('src/lib/projectCards.ts');

if (!existsSync(sourcePath)) {
  throw new Error('Expected src/lib/projectCards.ts to exist.');
}

const output = ts.transpileModule(readFileSync(sourcePath, 'utf8'), {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    isolatedModules: true,
  },
}).outputText;

const tempPath = resolve(tmpdir(), `projectCards-${process.pid}-${Date.now()}.mjs`);
writeFileSync(tempPath, output, 'utf8');

try {
  const { filterProjectExperiences, resolveProjectImage } = await import(pathToFileURL(tempPath).href);

  assert.equal(
    resolveProjectImage(
      { slug: 'mmcsa', coverImageUrl: '/uploads/gallery/custom.png' },
      { mmcsa: '/local/default.png' },
    ),
    '/uploads/gallery/custom.png',
  );

  assert.equal(
    resolveProjectImage(
      { slug: 'mmcsa', coverImageUrl: '   ' },
      { mmcsa: '/local/default.png' },
    ),
    '/local/default.png',
  );

  assert.equal(
    resolveProjectImage(
      { slug: 'unknown', coverImageUrl: null },
      { default: '/local/default-fallback.png' },
    ),
    '/local/default-fallback.png',
  );

  assert.equal(typeof filterProjectExperiences, 'function');
  assert.deepEqual(
    filterProjectExperiences([
      { slug: 'momozhi', title: '墨墨知' },
      { slug: 'agent', title: 'Agent八股文' },
      { slug: 'mmcsa', title: '多模态客服 Agent' },
    ]).map((project) => project.slug),
    ['momozhi', 'mmcsa'],
  );
} finally {
  unlinkSync(tempPath);
}
