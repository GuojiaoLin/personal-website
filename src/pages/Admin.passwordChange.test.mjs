import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const adminSource = readFileSync(resolve('src/pages/Admin.tsx'), 'utf8');
const apiSource = readFileSync(resolve('src/lib/adminApi.ts'), 'utf8');

assert.match(apiSource, /export const changeAdminPassword = /);
assert.match(adminSource, /changeAdminPassword/);
assert.match(adminSource, /currentPassword/);
assert.match(adminSource, /newPassword/);
assert.match(adminSource, /confirmPassword/);
assert.match(adminSource, /autoComplete="current-password"/);
assert.match(adminSource, /autoComplete="new-password"/);
assert.match(adminSource, /minLength=\{6\}/);
assert.match(adminSource, /新密码至少需要 6 位。/);
assert.doesNotMatch(adminSource, /新密码至少需要 12 位。/);
assert.match(adminSource, /setPasswordChangeForm\(emptyPasswordChangeForm\(\)\)/);
assert.match(adminSource, /role="dialog"/);
assert.match(adminSource, /aria-modal="true"/);
assert.match(adminSource, /id="password-dialog-title"/);
assert.match(adminSource, /aria-labelledby="password-dialog-title"/);
