export interface BlogPost {
  id?: string;
  slug: string;
  fileSlug: string;
  projectSlug: string;
  projectTitle: string;
  projectDescription: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  category: string;
  readingTime: string;
  order?: number;
  body: string;
}

export interface BlogProject {
  slug: string;
  title: string;
  description: string;
  projectIcon?: string | null;
  posts: BlogPost[];
}

type Frontmatter = Record<string, string | string[] | boolean>;

const postModules = import.meta.glob('../content/blog/**/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>;

const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

const cleanValue = (value: string) => value.trim().replace(/^['"]|['"]$/g, '');

const parseArrayValue = (value: string) =>
  value
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map((item) => cleanValue(item))
    .filter(Boolean);

const parseFrontmatter = (source: string): { metadata: Frontmatter; body: string } => {
  const match = source.match(frontmatterPattern);

  if (!match) {
    return { metadata: {}, body: source.trim() };
  }

  const metadata: Frontmatter = {};
  const lines = match[1].split(/\r?\n/);

  for (const line of lines) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const rawValue = line.slice(separator + 1).trim();

    if (!key) continue;

    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      metadata[key] = parseArrayValue(rawValue);
    } else if (rawValue === 'true' || rawValue === 'false') {
      metadata[key] = rawValue === 'true';
    } else {
      metadata[key] = cleanValue(rawValue);
    }
  }

  return {
    metadata,
    body: source.slice(match[0].length).trim(),
  };
};

const titleizeSlug = (slug: string) =>
  slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const getPathInfo = (path: string) => {
  const relativePath = path.split('/content/blog/').pop() ?? path;
  const segments = relativePath.split('/');
  const filename = segments.pop() ?? relativePath;
  const fileSlug = filename.replace(/\.md$/, '');
  const projectSlug = segments[0] || 'uncategorized';

  return {
    fileSlug,
    projectSlug,
  };
};

const estimateReadingTime = (body: string) => {
  const cjkChars = body.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  const latinWords = body.replace(/[\u4e00-\u9fff]/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const units = cjkChars + latinWords;
  const minutes = Math.max(1, Math.ceil(units / 450));

  return `${minutes} min`;
};

const toStringArray = (value: Frontmatter[string] | undefined) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value) return [value];
  return [];
};

const toStringValue = (value: Frontmatter[string] | undefined, fallback: string) => (
  typeof value === 'string' && value.trim() ? value : fallback
);

const toNumberValue = (value: Frontmatter[string] | undefined) => {
  if (typeof value !== 'string' || !value.trim()) return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const comparePosts = (first: BlogPost, second: BlogPost) => {
  const firstOrder = first.order;
  const secondOrder = second.order;
  const firstHasOrder = typeof firstOrder === 'number';
  const secondHasOrder = typeof secondOrder === 'number';

  if (firstHasOrder && secondHasOrder && firstOrder !== secondOrder) {
    return firstOrder - secondOrder;
  }

  if (firstHasOrder !== secondHasOrder) return firstHasOrder ? -1 : 1;

  const readingOrder = compareReadingPosition(first, second);
  if (readingOrder !== 0) return readingOrder;

  return new Date(second.date).getTime() - new Date(first.date).getTime();
};

const getLeadingReadingNumber = (value?: string) => {
  const match = value?.trim().match(/^(\d+)(?:\D|$)/);
  return match ? Number(match[1]) : undefined;
};

const getReadingNumber = (post: BlogPost) => {
  const slugTail = post.slug.split('/').pop();
  const candidates = [post.title, post.fileSlug, slugTail];

  for (const candidate of candidates) {
    const value = getLeadingReadingNumber(candidate);
    if (typeof value === 'number') return value;
  }

  return undefined;
};

const getReadingLabel = (post: BlogPost) => post.title || post.fileSlug || post.slug;

const compareReadingPosition = (first: BlogPost, second: BlogPost) => {
  const firstNumber = getReadingNumber(first);
  const secondNumber = getReadingNumber(second);

  if (typeof firstNumber === 'number' && typeof secondNumber === 'number' && firstNumber !== secondNumber) {
    return firstNumber - secondNumber;
  }

  return getReadingLabel(first).localeCompare(getReadingLabel(second), 'zh-CN', {
    numeric: true,
    sensitivity: 'base',
  });
};

const getLatestProjectDate = (project: BlogProject) => (
  project.posts.reduce((latest, post) => {
    const timestamp = new Date(post.date).getTime();
    return Number.isFinite(timestamp) && timestamp > latest ? timestamp : latest;
  }, new Date('1970-01-01').getTime())
);

export const blogPosts: BlogPost[] = Object.entries(postModules)
  .map(([path, source]) => {
    const { metadata, body } = parseFrontmatter(source);
    const { fileSlug, projectSlug: pathProjectSlug } = getPathInfo(path);
    const projectSlug = toStringValue(metadata.projectSlug, pathProjectSlug);
    const slug = `${projectSlug}/${fileSlug}`;
    const projectTitle = toStringValue(metadata.project, titleizeSlug(projectSlug));

    return {
      slug,
      fileSlug,
      projectSlug,
      projectTitle,
      projectDescription: toStringValue(metadata.projectDescription, ''),
      title: toStringValue(metadata.title, fileSlug),
      date: toStringValue(metadata.date, '1970-01-01'),
      summary: toStringValue(metadata.summary, body.split(/\r?\n/)[0] ?? ''),
      tags: toStringArray(metadata.tags),
      category: toStringValue(metadata.category, '随笔'),
      readingTime: toStringValue(metadata.readingTime, estimateReadingTime(body)),
      order: toNumberValue(metadata.order),
      body,
      draft: metadata.draft === true,
    };
  })
  .filter((post) => !('draft' in post && post.draft))
  .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime());

export const blogProjects: BlogProject[] = Array.from(
  blogPosts.reduce((projects, post) => {
    const project = projects.get(post.projectSlug) ?? {
      slug: post.projectSlug,
      title: post.projectTitle,
      description: post.projectDescription,
      posts: [],
    };

    project.posts.push(post);
    project.posts.sort(comparePosts);
    if (!project.description && post.projectDescription) {
      project.description = post.projectDescription;
    }

    projects.set(post.projectSlug, project);
    return projects;
  }, new Map<string, BlogProject>()).values()
).sort((first, second) => {
  return getLatestProjectDate(second) - getLatestProjectDate(first);
});

export const formatPostDate = (date: string) => {
  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parsed);
};
