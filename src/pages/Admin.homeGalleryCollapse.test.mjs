import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sourcePath = resolve('src/pages/Admin.tsx');

if (!existsSync(sourcePath)) {
  throw new Error('Expected src/pages/Admin.tsx to exist.');
}

const source = readFileSync(sourcePath, 'utf8');

assert.match(source, /isHomeGallerySlotsOpen/);
assert.match(source, /setIsHomeGallerySlotsOpen/);
assert.match(source, /aria-expanded=\{isHomeGallerySlotsOpen\}/);
assert.match(source, /isHomeGallerySlotsOpen \? '收起首页图片设置' : '展开首页图片设置'/);
assert.match(source, /\{isHomeGallerySlotsOpen && \(/);
assert.doesNotMatch(source, /从本地上传 4 张图，上传后会直接展示到首页。/);
assert.match(source, /md:grid-cols-\[minmax\(0,1fr\)_auto_auto\] md:items-stretch/);
assert.match(source, /flex min-h-10 items-center/);
assert.match(source, /flex h-10 items-center/);
assert.match(source, /className="h-10 gap-1\.5/);
