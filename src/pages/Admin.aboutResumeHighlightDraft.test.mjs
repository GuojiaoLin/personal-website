import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('src/pages/Admin.tsx'), 'utf8');

assert.match(
  source,
  /aboutResumeHighlightDrafts/,
  'About resume highlight editor should keep raw draft text while the user is typing.'
);

assert.match(
  source,
  /setAboutResumeHighlightDrafts\(\(current\) => \(\{[\s\S]*?\[index\]: value[\s\S]*?\}\)\)/,
  'Highlight textarea changes should update a raw text draft by entry index.'
);

assert.match(
  source,
  /value=\{aboutResumeHighlightDrafts\[index\] \?\? highlightsToText\(entry\.highlights\)\}/,
  'Highlight textarea value should prefer the raw draft instead of formatting parsed highlights on every keystroke.'
);

assert.match(
  source,
  /onChange=\{\(event\) => handleAboutResumeHighlightsChange\(index, event\.target\.value\)\}/,
  'Highlight textarea should use the dedicated draft-aware change handler.'
);
