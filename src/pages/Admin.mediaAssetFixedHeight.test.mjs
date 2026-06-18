import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('src/pages/Admin.tsx'), 'utf8');

assert.doesNotMatch(source, /max-h-64 gap-3 overflow-y-auto/);
assert.doesNotMatch(source, /className="h-64 overflow-y-auto/);
assert.match(source, /className="h-56 overflow-y-auto/);
assert.match(source, /className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-4"/);
assert.match(source, /className="flex h-56 items-center/);
