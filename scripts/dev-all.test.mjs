import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const packageJson = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));

assert.equal(
  packageJson.scripts['dev:all'],
  'node scripts/dev-all.mjs',
  'package.json should expose npm run dev:all for one-command local startup.',
);

const { createDevCommands, createSpawnOptions, resolveExecutable } = await import('./dev-all.mjs');

assert.deepEqual(
  createDevCommands(),
  [
    { label: 'db', command: 'docker', args: ['compose', 'up', '-d'], cwd: process.cwd(), blocking: true },
    { label: 'backend', command: resolveExecutable('mvn'), args: ['spring-boot:run'], cwd: resolve('backend'), blocking: false },
    { label: 'frontend', command: resolveExecutable('npm'), args: ['run', 'dev'], cwd: process.cwd(), blocking: false },
  ],
  'dev-all should start database first, then backend and frontend from the right directories.',
);

assert.deepEqual(
  createSpawnOptions(resolve('backend'), { platform: 'win32' }),
  { cwd: resolve('backend'), stdio: 'inherit', shell: true },
  'Windows should launch npm.cmd and mvn.cmd through the shell to avoid spawn EINVAL.',
);
