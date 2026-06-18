import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('src/pages/About.tsx'), 'utf8');

assert.match(
  source,
  /import \{ createPortal \} from 'react-dom';/,
  'WeChat QR modal should render outside the page animation stacking context.',
);

assert.match(
  source,
  /isWechatOpen && createPortal\(/,
  'WeChat QR modal should be portaled to the document body.',
);

assert.match(
  source,
  /className="fixed inset-0 z-\[120\] flex items-center justify-center bg-slate-950\/30 px-4 py-8 backdrop-blur-sm"/,
  'WeChat QR modal overlay should sit above footer and floating page chrome.',
);

assert.match(
  source,
  /className="mx-auto w-full max-w-\[280px\] rounded-2xl border border-slate-100 bg-slate-50 p-2 shadow-sm"/,
  'WeChat QR area should allow portrait contact-card images to keep their full height.',
);

assert.match(
  source,
  /className="block h-auto max-h-\[58dvh\] w-full rounded-xl object-contain"/,
  'WeChat QR image should shrink to fit without being cropped.',
);

assert.equal(
  source.includes('aspect-square'),
  false,
  'WeChat QR modal should not force portrait contact-card images into a square crop.',
);

assert.match(
  source,
  /className="relative max-h-\[calc\(100dvh-4rem\)\] w-full max-w-sm overflow-y-auto rounded-\[28px\] border border-slate-100 bg-white p-6 text-center shadow-\[0_30px_90px_-42px_rgba\(15,23,42,0\.85\)\]"/,
  'WeChat QR modal should stay usable on short screens when the full image is shown.',
);
