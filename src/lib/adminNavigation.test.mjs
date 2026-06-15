import assert from 'node:assert/strict';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const sourcePath = resolve('src/lib/adminNavigation.ts');

if (!existsSync(sourcePath)) {
  throw new Error('Expected src/lib/adminNavigation.ts to exist.');
}

const output = ts.transpileModule(readFileSync(sourcePath, 'utf8'), {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    isolatedModules: true,
  },
}).outputText;

const tempPath = resolve(tmpdir(), `adminNavigation-${process.pid}-${Date.now()}.mjs`);
writeFileSync(tempPath, output, 'utf8');

try {
  const { getAdminNavigationState } = await import(pathToFileURL(tempPath).href);

  assert.equal(
    getAdminNavigationState({ isAuthReady: false, isOwner: false }).label,
    '确认中',
    'Auth checking should not show the owner login action.',
  );
  assert.equal(
    getAdminNavigationState({ isAuthReady: false, isOwner: false }).canUseAction,
    false,
    'Auth checking should disable the admin action until the session is known.',
  );
  assert.equal(
    getAdminNavigationState({ isAuthReady: true, isOwner: true }).label,
    '进入后台',
  );
  assert.equal(
    getAdminNavigationState({ isAuthReady: true, isOwner: false }).label,
    '站主登录',
  );
} finally {
  unlinkSync(tempPath);
}
