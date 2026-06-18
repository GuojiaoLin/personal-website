import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Calendar, FolderOpen, Hash } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Comments } from '../components/Comments';
import { BackToTopButton } from '../components/BackToTopButton';
import { renderInlineMarkdown, renderMarkdown } from '../lib/markdown';
import { ProjectIconGlyph } from '../lib/projectIcons';
import { requestJson } from '../lib/siteApi';

interface ListResponse<T> {
  items: T[];
}

interface BlogPost {
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

interface BlogProject {
  slug: string;
  title: string;
  description: string;
  coverImageUrl?: string | null;
  projectIcon?: string | null;
  posts: BlogPost[];
}

interface PublishedProjectRecord {
  slug: string;
  title: string;
  summary: string;
  descriptionMarkdown: string;
  coverImageUrl?: string | null;
  projectIcon?: string | null;
}

interface PublishedBlogPostRecord {
  id: string;
  projectSlug: string;
  projectTitle: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  contentMarkdown: string;
  blogOrder: number;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const estimateReadingTime = (body: string) => {
  const cjkChars = body.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  const latinWords = body.replace(/[\u4e00-\u9fff]/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const units = cjkChars + latinWords;
  return `${Math.max(1, Math.ceil(units / 450))} min`;
};

const toDateString = (value?: string | null) => {
  if (!value) return new Date().toISOString().slice(0, 10);

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);

  return parsed.toISOString().slice(0, 10);
};

const formatPostDate = (date: string) => {
  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parsed);
};

const comparePosts = (first: BlogPost, second: BlogPost) => {
  const firstHasOrder = typeof first.order === 'number';
  const secondHasOrder = typeof second.order === 'number';

  if (firstHasOrder && secondHasOrder && first.order !== second.order) return (first.order ?? 0) - (second.order ?? 0);
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

const buildBlogProjects = (posts: BlogPost[], publishedProjects: PublishedProjectRecord[]) => {
  const projects = new Map<string, BlogProject>();

  publishedProjects.forEach((project) => {
    projects.set(project.slug, {
      slug: project.slug,
      title: project.title,
      description: project.summary || '',
      coverImageUrl: project.coverImageUrl ?? null,
      projectIcon: project.projectIcon ?? null,
      posts: [],
    });
  });

  posts.forEach((post) => {
    const project = projects.get(post.projectSlug) ?? {
      slug: post.projectSlug,
      title: post.projectTitle,
      description: post.projectDescription,
      coverImageUrl: undefined,
      projectIcon: undefined,
      posts: [],
    };

    project.posts.push(post);
    project.posts.sort(comparePosts);
    if (!project.description && post.projectDescription) {
      project.description = post.projectDescription;
    }

    projects.set(post.projectSlug, project);
  });

  return Array.from(projects.values()).sort((first, second) => (
    getLatestProjectDate(second) - getLatestProjectDate(first)
  ));
};

const toBlogPostFromRecord = (
  post: PublishedBlogPostRecord,
  projectsBySlug: Map<string, PublishedProjectRecord>
): BlogPost => {
  const project = projectsBySlug.get(post.projectSlug);
  const body = post.contentMarkdown || '';

  return {
    id: post.id,
    slug: post.slug,
    fileSlug: post.slug,
    projectSlug: post.projectSlug,
    projectTitle: project?.title || post.projectTitle,
    projectDescription: project?.summary || '',
    title: post.title,
    date: toDateString(post.publishedAt || post.updatedAt || post.createdAt),
    summary: post.summary,
    tags: [],
    category: post.category,
    readingTime: estimateReadingTime(body),
    order: Number.isFinite(post.blogOrder) ? post.blogOrder : undefined,
    body,
  };
};

const getPostKey = (post: BlogPost) => `${post.projectSlug}/${post.slug}`;

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [publishedPosts, setPublishedPosts] = useState<BlogPost[]>([]);
  const [publishedProjects, setPublishedProjects] = useState<PublishedProjectRecord[]>([]);
  const [isLoadingPublishedContent, setIsLoadingPublishedContent] = useState(true);
  const [loadError, setLoadError] = useState('');
  const activeProjectSlug = searchParams.get('project');
  const activePostSlug = searchParams.get('post');

  useEffect(() => {
    let isCurrent = true;

    const loadPublishedPosts = async () => {
      if (isCurrent) setIsLoadingPublishedContent(true);

      try {
        const [projectsResponse, postsResponse] = await Promise.all([
          requestJson<ListResponse<PublishedProjectRecord>>('/api/projects'),
          requestJson<ListResponse<PublishedBlogPostRecord>>('/api/blog-posts'),
        ]);
        const projectsBySlug = new Map(projectsResponse.items.map((project) => [project.slug, project]));
        const nextPosts = postsResponse.items.map((post) => toBlogPostFromRecord(post, projectsBySlug));

        if (isCurrent) {
          setPublishedProjects(projectsResponse.items);
          setPublishedPosts(nextPosts);
          setLoadError('');
        }
      } catch (error) {
        if (isCurrent) {
          setPublishedProjects([]);
          setPublishedPosts([]);
          setLoadError(error instanceof Error ? error.message : '数据库博客加载失败。');
        }
      } finally {
        if (isCurrent) setIsLoadingPublishedContent(false);
      }
    };

    void loadPublishedPosts();

    return () => {
      isCurrent = false;
    };
  }, []);

  const allBlogPosts = useMemo(() => {
    return [...publishedPosts].sort((first, second) => (
      new Date(second.date).getTime() - new Date(first.date).getTime()
    ));
  }, [publishedPosts]);

  const allBlogProjects = useMemo(
    () => buildBlogProjects(allBlogPosts, publishedProjects),
    [allBlogPosts, publishedProjects]
  );

  const activePost = allBlogPosts.find((post) => {
    if (!activePostSlug) return false;

    const projectScopedFileSlug = `${post.projectSlug}/${post.fileSlug}`;
    const matchesSlug = post.slug === activePostSlug
      || post.fileSlug === activePostSlug
      || projectScopedFileSlug === activePostSlug;
    if (!matchesSlug) return false;

    return activeProjectSlug ? post.projectSlug === activeProjectSlug : true;
  });
  const activeProject = allBlogProjects.find((project) => (
    project.slug === (activePost?.projectSlug ?? activeProjectSlug)
  ));
  const isResolvingDeepLink = isLoadingPublishedContent
    && Boolean(activePostSlug || activeProjectSlug)
    && !activePost
    && !activeProject;
  const isLoadingProjectFolders = isLoadingPublishedContent
    && !activePostSlug
    && !activeProjectSlug
    && allBlogProjects.length === 0;

  const showProjects = () => {
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showProject = (slug: string) => {
    setSearchParams({ project: slug });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showPost = (post: BlogPost) => {
    setSearchParams({ project: post.projectSlug, post: post.fileSlug });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getLatestPost = (posts: BlogPost[]) => (
    posts.reduce<BlogPost | undefined>((latest, post) => {
      if (!latest) return post;

      return new Date(post.date).getTime() > new Date(latest.date).getTime() ? post : latest;
    }, undefined)
  );

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-16">
        <AnimatePresence mode="wait">
          {activePost ? (
            <motion.article
              key={getPostKey(activePost)}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              className="mx-auto max-w-4xl"
            >
              <Button
                variant="ghost"
                className="mb-8 -ml-4 w-fit rounded-full text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                onClick={() => showProject(activePost.projectSlug)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回项目笔记
              </Button>

              <header className="pb-4">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-5xl">
                    {activePost.title}
                  </h1>
                  <div className="flex w-fit shrink-0 rounded-xl border border-slate-100 bg-white/80 px-3 py-1.5 text-sm font-bold text-slate-400 shadow-sm shadow-slate-900/5 lg:mt-2">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#854D0E]" />
                      {formatPostDate(activePost.date)}
                    </span>
                  </div>
                </div>
                <div className="mt-5 flex max-w-full flex-wrap items-center gap-3">
                  <Badge className="border-none bg-[#FFFF00] px-4 py-1.5 font-black text-black">
                    {activePost.projectTitle}
                  </Badge>
                  <Badge variant="secondary" className="rounded-full border-none bg-slate-100 px-4 py-1.5 font-black text-slate-600">
                    {activePost.category}
                  </Badge>
                  {typeof activePost.order === 'number' && (
                    <Badge variant="secondary" className="rounded-full border-none bg-slate-100 px-4 py-1.5 font-black text-slate-600">
                      题号 {activePost.order}
                    </Badge>
                  )}
                </div>
                {activePost.tags.length > 0 && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {activePost.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">
                        <Hash className="mr-1.5 h-3.5 w-3.5 text-[#854D0E]" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </header>

              <div className="mt-5 space-y-6">
                {renderMarkdown(activePost.body)}
              </div>

              <Comments
                className="mt-16 border-t border-slate-100 pt-10"
                postSlug={activePost.slug}
                postProjectSlug={activePost.projectSlug}
                postId={activePost.id}
              />
            </motion.article>
          ) : isResolvingDeepLink ? (
            <motion.div
              key="blog-target-loading"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="mx-auto max-w-4xl"
            >
              <div className="animate-pulse space-y-7 pt-14">
                <div className="h-14 w-64 rounded-2xl bg-slate-100" />
                <div className="space-y-3">
                  <div className="h-5 w-full rounded-full bg-slate-100" />
                  <div className="h-5 w-10/12 rounded-full bg-slate-100" />
                  <div className="h-5 w-7/12 rounded-full bg-slate-100" />
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="h-11 w-48 rounded-full bg-slate-100" />
                  <div className="h-11 w-24 rounded-full bg-slate-100" />
                  <div className="h-11 w-28 rounded-full bg-slate-100" />
                </div>
              </div>
            </motion.div>
          ) : activeProject ? (
            <motion.div
              key={activeProject.slug}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
            >
              <div className="mb-8 flex w-full flex-wrap items-start justify-between gap-3">
                <Button
                  variant="ghost"
                  className="-ml-4 rounded-full text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                  onClick={showProjects}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回项目文件夹
                </Button>
              </div>

              <section className="mb-10 border-b border-slate-100 pb-8">
                <div className="min-w-0 max-w-6xl">
                  <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    <FolderOpen className="h-4 w-4 text-[#854D0E]" />
                    Project Notes
                  </div>
                  <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                    {activeProject.title}
                  </h1>
                  {activeProject.description && (
                    <p className="mt-5 max-w-5xl text-base font-medium leading-8 text-slate-500 md:text-lg">
                      {activeProject.description}
                    </p>
                  )}
                </div>
              </section>

              {activeProject.posts.length > 0 ? (
                <section className="grid gap-5 md:grid-cols-2">
                  {activeProject.posts.map((post) => (
                  <article
                    key={getPostKey(post)}
                    className="group flex min-h-[240px] flex-col rounded-[22px] border border-slate-100 bg-white p-6 shadow-[0_14px_44px_-24px_rgba(15,23,42,0.35)] transition hover:-translate-y-1 hover:border-[#FFFF00] hover:shadow-[0_20px_60px_-24px_rgba(15,23,42,0.4)]"
                  >
                    <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-black text-slate-400">
                      {typeof post.order === 'number' && (
                        <Badge variant="secondary" className="rounded-full border-none bg-[#FFFF00] px-3 py-1 font-black text-black">
                          博客{post.order}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="rounded-full border-none bg-slate-100 px-3 py-1 font-black text-slate-600">
                        {post.category}
                      </Badge>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#854D0E]" />
                        {formatPostDate(post.date)}
                      </span>
                    </div>

                    <h2 className="text-xl md:text-2xl font-black leading-tight tracking-tight text-slate-950 transition group-hover:text-[#854D0E]">
                      {post.title}
                    </h2>
                    <p className="mt-3 flex-1 text-sm md:text-base font-medium leading-relaxed text-slate-500">
                      {renderInlineMarkdown(post.summary, `post-summary-${getPostKey(post)}`)}
                    </p>

                    {post.tags.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-400">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      className="mt-6 w-fit rounded-full px-0 font-black text-slate-950 hover:bg-transparent hover:text-[#854D0E]"
                      onClick={() => showPost(post)}
                    >
                      阅读全文
                      <ArrowLeft className="ml-2 h-4 w-4 rotate-180 transition group-hover:translate-x-1" />
                    </Button>
                  </article>
                  ))}
                </section>
              ) : (
                <div className="rounded-[28px] border border-dashed border-slate-200 px-8 py-16 text-center">
                  <p className="text-lg font-bold text-slate-500">这个项目还没有博客。</p>
                  <p className="mt-2 text-sm font-bold text-slate-400">进入站主后台，新建博客后选择这个项目即可。</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="project-folders"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
            >
              <section className="mb-16 text-center">
                <div className="mb-5 flex h-10 items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    className="inline-flex items-center gap-2 rounded-full bg-[#FFFF00] px-3.5 py-1.5 text-black shadow-sm shadow-[#FFFF00]/20"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-[0.24em]">
                      Project Notes
                    </span>
                  </motion.div>
                </div>
                <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl">
                  技术博客
                </h1>
                <p className="mx-auto max-w-2xl text-base md:text-lg font-medium leading-relaxed text-slate-500">
                  <span className="block">技术博客不是按时间随手堆放的记录，而是按项目归档的思考链路。</span>
                  <span className="mt-3 block">如果你想更完整地理解一个项目，我建议先去「项目经历」里看它最终呈现出来的样子，再回到这里读对应的开发笔记、设计复盘和技术记录。</span>
                </p>
              </section>

              {loadError && (
                <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
                  后台博客暂时加载失败，请检查后端服务：{loadError}
                </div>
              )}

              {isLoadingProjectFolders ? (
                <section className="grid gap-5 md:grid-cols-2">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={`blog-project-skeleton-${index}`} className="min-h-[220px] animate-pulse rounded-[22px] border border-slate-100 bg-white p-6 shadow-[0_14px_44px_-24px_rgba(15,23,42,0.35)]">
                      <div className="mb-6 h-12 w-12 rounded-xl bg-slate-100" />
                      <div className="h-7 w-2/3 rounded-full bg-slate-100" />
                      <div className="mt-4 space-y-2">
                        <div className="h-4 w-full rounded-full bg-slate-100" />
                        <div className="h-4 w-4/5 rounded-full bg-slate-100" />
                      </div>
                      <div className="mt-8 border-t border-slate-100 pt-5">
                        <div className="h-4 w-28 rounded-full bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </section>
              ) : allBlogProjects.length > 0 ? (
                <section className="grid gap-5 md:grid-cols-2">
                  {allBlogProjects.map((project) => {
                    const latestPost = getLatestPost(project.posts);
                    const projectLogo = project.coverImageUrl?.trim();

                    return (
                      <button
                        key={project.slug}
                        type="button"
                        onClick={() => showProject(project.slug)}
                        className="group flex min-h-[220px] flex-col rounded-[22px] border border-slate-100 bg-white p-6 text-left shadow-[0_14px_44px_-24px_rgba(15,23,42,0.35)] transition hover:-translate-y-1 hover:border-[#FFFF00] hover:shadow-[0_20px_60px_-24px_rgba(15,23,42,0.4)]"
                      >
                        <div className="mb-6 flex items-start justify-between gap-4">
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[#FFFF00] text-black shadow-md shadow-[#FFFF00]/20 transition group-hover:rotate-3">
                            {projectLogo ? (
                              <img src={projectLogo} alt={`${project.title} logo`} className="h-full w-full object-contain p-1" />
                            ) : (
                              <ProjectIconGlyph value={project.projectIcon} className="h-6 w-6" />
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <h2 className="text-2xl font-black tracking-tight text-slate-950 transition group-hover:text-[#854D0E]">
                            {project.title}
                          </h2>
                          {project.description && (
                            <p className="mt-3 text-sm md:text-base font-medium leading-relaxed text-slate-500">
                              {project.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
                          <span className="text-xs font-bold text-slate-400">
                            最新：{latestPost ? formatPostDate(latestPost.date) : '暂无'}
                          </span>
                          <span className="inline-flex items-center text-sm font-black text-slate-950 transition group-hover:text-[#854D0E]">
                            查看笔记
                            <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </section>
              ) : (
                <div className="rounded-[28px] border border-dashed border-slate-200 px-8 py-16 text-center">
                  <p className="text-lg font-bold text-slate-500">还没有项目笔记。</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BackToTopButton />
    </Layout>
  );
};

export default Blog;
