import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('src/pages/Admin.tsx'), 'utf8');

for (const forbidden of [
  "handleGalleryInput('status')",
  'saveGalleryPhoto(galleryForm.status)',
  'status = form.status',
  '保存信息',
]) {
  assert.equal(
    source.includes(forbidden),
    false,
    `Gallery editor should not include ${forbidden}.`,
  );
}

assert.match(source, /saveGalleryPhoto\('published'\)/);
assert.match(source, /删除图片/);

const galleryPreviewMatch = source.match(
  /\{galleryForm\.url \? \([\s\S]*?\) : \(/,
);

assert.ok(galleryPreviewMatch, 'Gallery image preview block should exist.');

const galleryPreviewBlock = galleryPreviewMatch[0];

assert.equal(
  galleryPreviewBlock.includes('aspect-[4/5]'),
  false,
  'Uploaded gallery preview should not use aspect ratio sizing that can enlarge the module.',
);
assert.match(galleryPreviewBlock, /h-\[360px\]/);
assert.match(galleryPreviewBlock, /h-full w-full object-cover/);

const saveGalleryPhotoMatch = source.match(
  /const saveGalleryPhoto = async \(status: ContentStatus\) => \{[\s\S]*?\n  \};/,
);

assert.ok(saveGalleryPhotoMatch, 'Gallery publish handler should exist.');

const saveGalleryPhotoBlock = saveGalleryPhotoMatch[0];

assert.equal(
  saveGalleryPhotoBlock.includes('setGalleryForm(formFromGalleryPhoto(saved));'),
  false,
  'Publishing should not keep the published photo in the editor.',
);
assert.equal(
  saveGalleryPhotoBlock.includes('setSelectedGalleryPhotoId(saved.id);'),
  false,
  'Publishing should not keep the published photo selected.',
);
assert.match(saveGalleryPhotoBlock, /setGalleryForm\(emptyGalleryPhotoForm\(\)\)/);
assert.match(saveGalleryPhotoBlock, /setSelectedGalleryPhotoId\(null\)/);
assert.match(saveGalleryPhotoBlock, /setIsCreatingNew\(true\)/);
