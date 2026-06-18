import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const blogSource = readFileSync(resolve('src/pages/Blog.tsx'), 'utf8');
const adminSource = readFileSync(resolve('src/pages/Admin.tsx'), 'utf8');

assert.match(
  blogSource,
  /coverImageUrl\?: string \| null;/,
  'Blog project records should include the uploaded project cover image URL.',
);

assert.match(
  blogSource,
  /coverImageUrl: project\.coverImageUrl \?\? null/,
  'Blog project folders should carry the uploaded cover image URL into the card model.',
);

assert.doesNotMatch(
  blogSource,
  /momoLogoImage|mmcsaLogoImage|momozhi_cat|logo-mmcsa-yellow/,
  'Blog project cards should not use slug-specific hardcoded logo images.',
);

assert.match(
  blogSource,
  /project\.coverImageUrl\?\.trim\(\)/,
  'Blog project cards should render the uploaded project cover image when present.',
);

assert.match(
  blogSource,
  /object-contain/,
  'Uploaded logo images should be contained inside the yellow logo tile instead of cropped.',
);

assert.match(
  adminSource,
  /accept="image\/png,image\/jpeg"/,
  'Project cover upload should allow PNG and JPG logo assets.',
);

assert.match(
  adminSource,
  /项目 Logo 图/,
  'Admin project upload section should label the asset as a logo, not a generic display image.',
);

assert.match(
  adminSource,
  /PNG\/JPG Logo/,
  'Admin project upload helper text should clearly allow PNG and JPG logo assets.',
);

assert.match(
  adminSource,
  /自动替换背景为黄色/,
  'Admin project upload helper text should explain that uploaded logos are processed onto a yellow background.',
);

assert.doesNotMatch(
  adminSource,
  /项目展示图|展示图/,
  'Admin project upload copy should not keep the old project display-image wording.',
);

assert.match(
  adminSource,
  /bg-\[#FFFF00\]/,
  'Project cover preview should show the uploaded logo on the same yellow background used publicly.',
);
