import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('src/pages/Admin.tsx'), 'utf8');

assert.doesNotMatch(
  source,
  /<span className="hidden text-sm font-bold text-slate-500 sm:inline">\{user\?\.email\}<\/span>/,
);
assert.match(source, /const adminHeaderIdentityClass = /);
assert.match(
  source,
  /h-10 min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600/,
);
assert.match(source, /<UserRound className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" \/>/);
assert.match(source, /<span className="block max-w-\[220px\] truncate">\{user\?\.email\}<\/span>/);
assert.match(source, /aria-label=\{`[^`]*\$\{user\?\.email \?\? '[^']+'\}`\}/);
assert.doesNotMatch(source, />OWNER</);
assert.doesNotMatch(source, /<Mail className="h-4 w-4"/);

const identityClassMatch = source.match(/const adminHeaderIdentityClass = '([^']+)'/);

assert.ok(identityClassMatch, 'Expected a dedicated header identity class.');
assert.equal(identityClassMatch[1].includes('bg-gradient-to-r'), false);
assert.equal(identityClassMatch[1].includes('rounded-full'), false);
