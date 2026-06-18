import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('src/pages/Admin.tsx'), 'utf8');

assert.match(source, /navigator\.clipboard\?\.writeText/);
assert.match(source, /document\.execCommand\('copy'\)/);

const copyHandlerMatch = source.match(
  /const copyMediaAssetMarkdownUrl = async \(asset: MediaAssetRecord\) => \{[\s\S]*?\n  \};/,
);

assert.ok(copyHandlerMatch, 'Media asset markdown copy handler should exist.');

const copyHandlerBlock = copyHandlerMatch[0];

assert.match(copyHandlerBlock, /const markdown = `!\[\[\$\{asset\.fileName\}\|640\]\]`;/);
assert.match(copyHandlerBlock, /copyTextToClipboard\(markdown\)/);
assert.doesNotMatch(copyHandlerBlock, /setForm\(/);
assert.doesNotMatch(copyHandlerBlock, /contentMarkdown/);
assert.doesNotMatch(copyHandlerBlock, /setEditorMode\(/);

assert.match(source, /onClick=\{\(\) => void copyMediaAssetMarkdownUrl\(asset\)\}/);
assert.match(source, />\s*复制 Markdown URL\s*</);
assert.doesNotMatch(source, /onClick=\{\(\) => insertMediaAsset\(asset\)\}/);
assert.doesNotMatch(source, /图片已插入正文/);
assert.doesNotMatch(source, /需要时可点击图片卡片里的“插入正文”/);
