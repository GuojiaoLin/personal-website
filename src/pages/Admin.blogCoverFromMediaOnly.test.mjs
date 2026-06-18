import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('src/pages/Admin.tsx'), 'utf8');

assert.doesNotMatch(source, /首页卡片封面/);
assert.doesNotMatch(source, /handleCoverImageUpload/);
assert.doesNotMatch(source, /首页封面已上传并设置/);
assert.doesNotMatch(source, /首页封面上传失败/);
assert.doesNotMatch(source, /请先保存草稿，保存后才能从本地上传首页封面/);

assert.match(source, /const setCoverImageFromAsset = \(asset: MediaAssetRecord\) => \{/);
assert.match(source, /coverImageUrl: asset\.url/);
assert.match(source, /onClick=\{\(\) => setCoverImageFromAsset\(asset\)\}/);
assert.match(source, />\s*设为封面\s*</);
assert.match(source, /onChange=\{\(event\) => void handleMediaUpload\(event\)\}/);
