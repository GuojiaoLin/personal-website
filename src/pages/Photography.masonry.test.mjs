import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('src/pages/Photography.tsx'), 'utf8');

assert.match(source, /const getGalleryShuffleKey = \(photo: Photo\) =>/);
assert.match(source, /const shuffleGalleryPhotos = \(items: Photo\[\]\) => \{/);
assert.match(source, /setPhotos\(shuffleGalleryPhotos\(galleryPhotos\.map\(photoFromGalleryRecord\)\)\)/);

const shuffleGalleryPhotosMatch = source.match(
  /const shuffleGalleryPhotos = \(items: Photo\[\]\) => \{[\s\S]*?\n\};/,
);

assert.ok(shuffleGalleryPhotosMatch, 'Photography page should define shuffleGalleryPhotos.');

const shuffleGalleryPhotosBlock = shuffleGalleryPhotosMatch[0];

assert.equal(
  shuffleGalleryPhotosBlock.includes('photo.id'),
  false,
  'Photography shuffle should not use backend photo id.',
);
assert.match(shuffleGalleryPhotosBlock, /getGalleryShuffleKey/);
assert.match(shuffleGalleryPhotosBlock, /hashPath/);

const photoFromGalleryRecordMatch = source.match(
  /const photoFromGalleryRecord = \(photo: GalleryPhotoRecord\): Photo => \{[\s\S]*?\n\};/,
);

assert.ok(photoFromGalleryRecordMatch, 'Gallery API records should be converted for the frontend.');
assert.equal(
  photoFromGalleryRecordMatch[0].includes('hashPath(photo.id'),
  false,
  'Frontend image shape should not be derived from backend photo id.',
);

assert.match(source, /const distributePhotos = \(items: Photo\[\], columnCount: number\) => \{/);

const distributePhotosMatch = source.match(
  /const distributePhotos = \(items: Photo\[\], columnCount: number\) => \{[\s\S]*?\n\};/,
);

assert.ok(distributePhotosMatch, 'Photography page should define distributePhotos.');

const distributePhotosBlock = distributePhotosMatch[0];

assert.equal(
  distributePhotosBlock.includes('index % columnCount'),
  false,
  'Photography masonry should not round-robin photos by index.',
);
assert.match(distributePhotosBlock, /columnHeights/);
assert.match(distributePhotosBlock, /getShortestGalleryColumnIndex/);
assert.match(distributePhotosBlock, /getPhotoLayoutWeight\(photo\)/);
