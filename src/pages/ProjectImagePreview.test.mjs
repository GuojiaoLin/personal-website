import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const previewPages = [
  'src/pages/ProjectSmartHome.tsx',
  'src/pages/ProjectWeb3.tsx',
];

for (const pagePath of previewPages) {
  const source = readFileSync(resolve(pagePath), 'utf8');

  assert.match(
    source,
    /className="flex h-\[42vh\] min-h-\[220px\] w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-100 md:h-\[58vh\] md:min-h-\[360px\]"/,
    `${pagePath} should keep the preview image area from collapsing before the image loads.`,
  );
  assert.match(
    source,
    /className="h-full w-full object-contain"/,
    `${pagePath} should fit the active preview image inside the reserved image area.`,
  );
  assert.equal(
    source.includes('className="mx-auto max-h-[64vh] w-full rounded-2xl object-contain"'),
    false,
    `${pagePath} should not rely on the image natural height for the modal layout.`,
  );
}
