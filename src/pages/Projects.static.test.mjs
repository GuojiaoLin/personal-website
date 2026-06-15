import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(resolve('src/pages/Projects.tsx'), 'utf8');

assert.match(source, /const projects: Project\[\] = \[/);

for (const forbidden of [
  '../lib/projectsApi',
  '../lib/projectCards',
  'listPublishedProjects',
  'PublicProjectRecord',
  'filterProjectExperiences',
  'resolveProjectImage',
  'useEffect',
  'useMemo',
  'useState',
]) {
  assert.equal(
    source.includes(forbidden),
    false,
    `Projects page should be front-end hardcoded and not include ${forbidden}.`,
  );
}
