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

assert.match(
  source,
  /const galleryVisibilityTargetStatus = galleryForm\.status === 'hidden' \? 'published' : 'hidden';/,
  'Gallery visibility action should publish hidden photos and hide visible photos.',
);

assert.match(
  source,
  /const galleryVisibilityButtonLabel = galleryForm\.status === 'hidden' \? '显示图片' : '隐藏图片';/,
  'Gallery visibility button should read 显示图片 when the current photo is hidden.',
);

assert.match(
  source,
  /status === 'hidden'\s*\?\s*'图册图片已隐藏，前台不会展示。'/,
  'Gallery save notice should explain that hidden photos are not shown publicly.',
);

const galleryEditorActionMatch = source.match(
  /<p className="text-xs font-black uppercase tracking-widest text-slate-400">Gallery Photos<\/p>[\s\S]*?onClick=\{\(\) => void deleteCurrentGalleryPhoto\(\)\}/,
);

assert.ok(galleryEditorActionMatch, 'Gallery editor action block should exist.');

const galleryEditorActionBlock = galleryEditorActionMatch[0];

assert.match(galleryEditorActionBlock, /<EyeOff className="h-4 w-4" \/>/);
assert.match(galleryEditorActionBlock, /\{galleryVisibilityButtonLabel\}/);
assert.match(
  galleryEditorActionBlock,
  /onClick=\{\(\) => void saveGalleryPhoto\(galleryVisibilityTargetStatus\)\}/,
);

assert.match(
  source,
  /replaceGalleryPhotoImage/,
  'Gallery editor should use the dedicated image replacement API.',
);

assert.match(
  source,
  /const handleGalleryPhotoReplacement = async \(event: ChangeEvent<HTMLInputElement>\) => \{/,
  'Gallery editor should have a handler for replacing the selected photo image.',
);

assert.match(
  source,
  /const replaced = await replaceGalleryPhotoImage\(galleryForm\.id, file\);/,
  'Replacing a gallery image should upload only the file for the current photo.',
);

assert.match(
  source,
  /setGalleryForm\(formFromGalleryPhoto\(replaced\)\)/,
  'Replacing a gallery image should keep the editor on the same photo with refreshed image fields.',
);

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
