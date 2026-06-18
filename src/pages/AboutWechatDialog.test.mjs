import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('src/pages/About.tsx'), 'utf8');

assert.match(
  source,
  /className="mx-auto grid aspect-square w-full max-w-\[280px\] place-items-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm"/,
  'WeChat QR area should reserve a square container before the image loads.',
);

assert.match(
  source,
  /className="h-full w-full object-contain"/,
  'WeChat QR image should shrink to fit inside the reserved container.',
);

assert.equal(
  source.includes('className="mx-auto w-full max-w-[280px] rounded-2xl border border-slate-100 shadow-sm"'),
  false,
  'WeChat QR modal should not rely on the image natural height for layout.',
);
