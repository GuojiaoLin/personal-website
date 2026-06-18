import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('src/pages/About.tsx'), 'utf8');

assert.match(
  source,
  /resumeEntries:\s*Array\.isArray\(content\.resumeEntries\)\s*\?\s*content\.resumeEntries\s*:\s*defaultAboutContent\.resumeEntries/s,
  'About page should respect an explicit empty resumeEntries array from the backend.',
);

assert.equal(
  source.includes('resumeEntries: content.resumeEntries?.length ? content.resumeEntries : defaultAboutContent.resumeEntries'),
  false,
  'About page should not replace an empty backend resumeEntries array with default resume content.',
);

assert.match(
  source,
  /orderedResumeEntries\.length > 0 && \(/,
  'About page should render the resume section only when backend content has resume entries.',
);
