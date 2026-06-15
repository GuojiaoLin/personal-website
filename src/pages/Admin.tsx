import { type ChangeEvent, type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  FileText,
  FolderKanban,
  ImageIcon,
  Loader2,
  LogOut,
  MessageCircle,
  PencilLine,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  type AdminUser,
  type BlogPostPayload,
  type BlogPostRecord,
  type ContentStatus,
  type GalleryPhotoPayload,
  type GalleryPhotoRecord,
  type MediaAssetRecord,
  type ProjectPayload,
  type ProjectRecord,
  type ResumeVersionRecord,
  activateResumeVersion,
  createBlogPost,
  createProject,
  deleteBlogPost,
  deleteGalleryPhoto,
  deleteMediaAsset,
  deleteProject,
  deleteResumeVersion,
  getCurrentAdmin,
  listAdminGalleryPhotos,
  listMediaAssets,
  listAdminBlogPosts,
  listAdminProjects,
  listAdminResumeVersions,
  loginAdmin,
  logoutAdmin,
  updateGalleryPhoto,
  updateProject,
  updateBlogPost,
  uploadAboutAsset,
  uploadGalleryPhoto,
  uploadMediaAsset,
  uploadResumeVersion,
} from '../lib/adminApi';
import {
  type CommentRecord,
  type CommentStatus,
  approveAdminComment,
  deleteAdminComment,
  formatCommentDate,
  hideAdminComment,
  listAdminComments,
} from '../lib/commentsApi';
import { renderMarkdown } from '../lib/markdown';
import { ProjectIconGlyph, projectIconOptions } from '../lib/projectIcons';
import { getApiUrl } from '../lib/siteApi';
import { cn } from '../lib/utils';
import {
  type AboutContactItem,
  type AboutContentPayload,
  type AboutContentRecord,
  type AboutProfileDetail,
  type AboutResumeEntry,
  type AboutResumeHighlight,
  getAdminAboutContent,
  updateAdminAboutContent,
} from '../lib/aboutApi';

type AuthState = 'checking' | 'anonymous' | 'authenticated';
type EditorMode = 'edit' | 'preview';
type ContentTab = 'project' | 'blog' | 'gallery' | 'comment' | 'about';
type SelectedType = ContentTab | null;
const DEFAULT_BLOG_CATEGORY = '技术博客';

interface BlogEditorForm {
  id?: string;
  projectId: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  contentMarkdown: string;
  blogOrder: number;
  featuredOnHome: boolean;
  homeOrder: number;
  coverImageUrl: string;
  status: ContentStatus;
}

interface ProjectEditorForm {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  descriptionMarkdown: string;
  projectIcon: string;
  techStackText: string;
  sortOrder: number;
  status: ContentStatus;
}

interface GalleryPhotoForm {
  id?: string;
  title: string;
  description: string;
  location: string;
  takenAt: string;
  sortOrder: number;
  status: ContentStatus;
  url: string;
  fileName: string;
}

const nextBlogOrderForProject = (posts: BlogPostRecord[], projectId: string) => {
  const scopedPosts = projectId ? posts.filter((post) => post.projectId === projectId) : posts;
  const maxOrder = scopedPosts.reduce((max, post) => Math.max(max, Number(post.blogOrder) || 0), 0);
  return maxOrder + 1;
};

const emptyForm = (projectId = '', blogOrder = 1): BlogEditorForm => ({
  projectId,
  title: '',
  slug: '',
  category: DEFAULT_BLOG_CATEGORY,
  summary: '',
  contentMarkdown: '## 小标题\n\n这里写正文。',
  blogOrder,
  featuredOnHome: false,
  homeOrder: blogOrder,
  coverImageUrl: '',
  status: 'draft',
});

const emptyProjectForm = (): ProjectEditorForm => ({
  title: '',
  slug: '',
  summary: '',
  descriptionMarkdown: '',
  projectIcon: '',
  techStackText: '',
  sortOrder: 0,
  status: 'draft',
});

const emptyGalleryPhotoForm = (): GalleryPhotoForm => ({
  title: '',
  description: '',
  location: '生活图册',
  takenAt: '',
  sortOrder: 0,
  status: 'draft',
  url: '',
  fileName: '',
});

const emptyAboutContent = (): AboutContentRecord => ({
  portraitImageUrl: '',
  wechatQrImageUrl: '',
  profileDetails: [],
  resumeEntries: [],
  contactHeading: '连接我的世界',
  contactItems: [],
  socialLinks: [],
});

const emptyAboutProfileDetail = (): AboutProfileDetail => ({
  label: '新信息',
  value: '',
  icon: 'user',
  copyValue: '',
  wide: false,
});

const emptyAboutResumeEntry = (sortOrder: number): AboutResumeEntry => ({
  category: 'Project Resume',
  title: '新的项目简历',
  meta: '独立开发',
  period: '',
  techStack: [],
  descriptionLabel: '项目描述',
  description: '',
  highlightsLabel: '项目亮点',
  highlights: [],
  sortOrder,
});

const emptyAboutContactItem = (): AboutContactItem => ({
  label: 'Contact',
  value: '',
  icon: 'mail',
});

const textToList = (value: string) => value
  .split(/[,\n，、]/)
  .map((item) => item.trim())
  .filter(Boolean);

const listToText = (values?: string[] | null) => (values ?? []).join('、');

const highlightsToText = (highlights?: AboutResumeHighlight[] | null) => (
  (highlights ?? []).map((item) => `${item.title}：${item.detail}`).join('\n')
);

const textToHighlights = (value: string): AboutResumeHighlight[] => value
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const separatorIndex = line.search(/[：:]/);
    if (separatorIndex < 0) {
      return { title: line, detail: '' };
    }

    return {
      title: line.slice(0, separatorIndex).trim(),
      detail: line.slice(separatorIndex + 1).trim(),
    };
  })
  .filter((item) => item.title && item.detail);

const aboutContentToPayload = (content: AboutContentRecord): AboutContentPayload => ({
  portraitImageUrl: content.portraitImageUrl?.trim() || '',
  wechatQrImageUrl: content.wechatQrImageUrl?.trim() || '',
  profileDetails: content.profileDetails.map((item) => ({
    label: item.label.trim(),
    value: item.value.trim(),
    icon: item.icon?.trim() || 'user',
    copyValue: item.copyValue?.trim() || null,
    wide: Boolean(item.wide),
  })).filter((item) => item.label && item.value),
  resumeEntries: content.resumeEntries.map((entry, index) => ({
    category: entry.category?.trim() || 'Project Resume',
    title: entry.title.trim(),
    meta: entry.meta?.trim() || '',
    period: entry.period?.trim() || '',
    techStack: entry.techStack ?? [],
    descriptionLabel: entry.descriptionLabel?.trim() || '项目描述',
    description: entry.description?.trim() || '',
    highlightsLabel: entry.highlightsLabel?.trim() || '项目亮点',
    highlights: entry.highlights ?? [],
    sortOrder: Number(entry.sortOrder) || index + 1,
  })).filter((entry) => entry.title),
  contactHeading: content.contactHeading.trim() || '连接我的世界',
  contactItems: content.contactItems.map((item) => ({
    label: item.label.trim(),
    value: item.value.trim(),
    icon: item.icon?.trim() || 'mail',
  })).filter((item) => item.label && item.value),
  socialLinks: [],
});

const cleanSlug = (value: string) => value
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const slugify = (value: string, fallbackPrefix = 'post') => (
  cleanSlug(value) || `${fallbackPrefix}-${Date.now().toString(36)}`
);

const getBlogSlugBase = (form: Pick<BlogEditorForm, 'title' | 'blogOrder'>) => (
  cleanSlug(form.title) || `blog-${Number(form.blogOrder) || 'post'}`
);

const getUniqueBlogSlug = (
  form: Pick<BlogEditorForm, 'id' | 'projectId' | 'title' | 'blogOrder'>,
  posts: BlogPostRecord[]
) => {
  const baseSlug = getBlogSlugBase(form);
  const usedSlugs = new Set(
    posts
      .filter((post) => post.id !== form.id && post.projectId === form.projectId)
      .map((post) => post.slug.toLowerCase())
  );

  let candidate = baseSlug;
  let suffix = 2;

  while (usedSlugs.has(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const formatBlogSaveError = (error: unknown) => {
  const message = error instanceof Error ? error.message : '';

  if (message === 'Blog post slug already exists.') {
    return '这篇博客的链接名和已有博客重复了，请刷新后再保存。';
  }

  return message || '保存失败。';
};

const statusLabel: Record<ContentStatus, string> = {
  draft: '草稿',
  published: '已发布',
  hidden: '隐藏',
};

const statusClassName: Record<ContentStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  published: 'bg-[#FFFF00] text-black',
  hidden: 'bg-slate-900 text-white',
};

const StatusBadge = ({ status }: { status: ContentStatus }) => (
  <Badge className={cn('shrink-0 border-none text-[11px] font-black', statusClassName[status])}>
    {statusLabel[status]}
  </Badge>
);

const adminHeaderButtonClass = 'h-10 gap-2 rounded-md border-slate-200 bg-white px-3.5 text-sm font-black text-slate-600 shadow-sm shadow-slate-200/50 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 disabled:shadow-none';
const adminHeaderDangerButtonClass = cn(
  adminHeaderButtonClass,
  'hover:border-red-200 hover:bg-red-50 hover:text-red-700'
);

const commentStatusLabel: Record<CommentStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  hidden: '已隐藏',
};

const commentStatusClassName: Record<CommentStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-[#FFFF00] text-black',
  hidden: 'bg-slate-900 text-white',
};

const CommentStatusBadge = ({ status }: { status: CommentStatus }) => (
  <Badge className={cn('shrink-0 border-none text-[11px] font-black', commentStatusClassName[status])}>
    {commentStatusLabel[status]}
  </Badge>
);

const commentTargetLabel = (comment: CommentRecord, posts: BlogPostRecord[]) => {
  if (comment.targetType === 'guestbook') return '留言板';

  return posts.find((post) => post.id === comment.targetId)?.title ?? '未知博客';
};

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.ceil(bytes / 1024)} KB`;
};

const formatAdminDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

const getSafeReturnPath = (value: string | null) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '';
  if (value === '/admin' || value.startsWith('/admin?')) return '';

  return value;
};

const formFromPost = (post: BlogPostRecord): BlogEditorForm => ({
  id: post.id,
  projectId: post.projectId,
  title: post.title,
  slug: post.slug,
  category: post.category || DEFAULT_BLOG_CATEGORY,
  summary: post.summary,
  contentMarkdown: post.contentMarkdown,
  blogOrder: post.blogOrder,
  featuredOnHome: Boolean(post.featuredOnHome),
  homeOrder: post.homeOrder,
  coverImageUrl: post.coverImageUrl ?? '',
  status: post.status,
});

const toPayload = (form: BlogEditorForm, status: ContentStatus, slug = form.slug): BlogPostPayload => ({
  projectId: form.projectId,
  title: form.title.trim(),
  slug: (slug.trim() || getBlogSlugBase(form)).toLowerCase(),
  category: form.category.trim() || DEFAULT_BLOG_CATEGORY,
  summary: form.summary.trim(),
  contentMarkdown: form.contentMarkdown.trim(),
  blogOrder: Number(form.blogOrder) || 0,
  featuredOnHome: form.featuredOnHome,
  homeOrder: Number(form.blogOrder) || 0,
  coverImageUrl: form.coverImageUrl.trim() || null,
  status,
});

const formFromProject = (project: ProjectRecord): ProjectEditorForm => ({
  id: project.id,
  title: project.title,
  slug: project.slug,
  summary: project.summary,
  descriptionMarkdown: project.descriptionMarkdown,
  projectIcon: project.projectIcon || '',
  techStackText: project.techStack.join(', '),
  sortOrder: project.sortOrder,
  status: project.status,
});

const toProjectPayload = (form: ProjectEditorForm, status: ContentStatus): ProjectPayload => ({
  title: form.title.trim(),
  slug: (form.slug.trim() || slugify(form.title, 'project')).toLowerCase(),
  summary: form.summary.trim(),
  descriptionMarkdown: form.descriptionMarkdown.trim(),
  coverImageUrl: null,
  projectIcon: form.projectIcon || null,
  techStack: form.techStackText
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
  sortOrder: Number(form.sortOrder) || 0,
  status,
});

const formFromGalleryPhoto = (photo: GalleryPhotoRecord): GalleryPhotoForm => ({
  id: photo.id,
  title: photo.title,
  description: photo.description,
  location: photo.location,
  takenAt: photo.takenAt,
  sortOrder: photo.sortOrder,
  status: photo.status,
  url: photo.url,
  fileName: photo.fileName,
});

const toGalleryPhotoPayload = (form: GalleryPhotoForm, status = form.status): GalleryPhotoPayload => ({
  title: form.title.trim(),
  description: form.description.trim(),
  location: form.location.trim(),
  takenAt: form.takenAt.trim(),
  sortOrder: Number(form.sortOrder) || 0,
  status,
});

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [user, setUser] = useState<AdminUser | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [posts, setPosts] = useState<BlogPostRecord[]>([]);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhotoRecord[]>([]);
  const [resumeVersions, setResumeVersions] = useState<ResumeVersionRecord[]>([]);
  const [aboutContent, setAboutContent] = useState<AboutContentRecord>(() => emptyAboutContent());
  const [isAboutAssetsOpen, setIsAboutAssetsOpen] = useState(true);
  const [isAboutResumeVersionsOpen, setIsAboutResumeVersionsOpen] = useState(true);
  const [isAboutProfileOpen, setIsAboutProfileOpen] = useState(true);
  const [isAboutResumeOpen, setIsAboutResumeOpen] = useState(true);
  const [isAboutContactOpen, setIsAboutContactOpen] = useState(true);
  const [commentFilter, setCommentFilter] = useState<CommentStatus | 'all'>('all');
  const [form, setForm] = useState<BlogEditorForm>(() => emptyForm());
  const [projectForm, setProjectForm] = useState<ProjectEditorForm>(() => emptyProjectForm());
  const [galleryForm, setGalleryForm] = useState<GalleryPhotoForm>(() => emptyGalleryPhotoForm());
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isSavingGalleryPhoto, setIsSavingGalleryPhoto] = useState(false);
  const [isSavingAbout, setIsSavingAbout] = useState(false);
  const [aboutAssetUploadTarget, setAboutAssetUploadTarget] = useState<'portraitImageUrl' | 'wechatQrImageUrl' | null>(null);
  const [isUploadingGalleryPhoto, setIsUploadingGalleryPhoto] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [commentActionId, setCommentActionId] = useState<string | null>(null);
  const [galleryActionId, setGalleryActionId] = useState<string | null>(null);
  const [resumeActionId, setResumeActionId] = useState<string | null>(null);
  const [mediaAssets, setMediaAssets] = useState<MediaAssetRecord[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaActionId, setMediaActionId] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState('');
  const [galleryError, setGalleryError] = useState('');
  const [resumeError, setResumeError] = useState('');
  const [aboutError, setAboutError] = useState('');
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [selectedType, setSelectedType] = useState<SelectedType>(null);
  const [contentTab, setContentTab] = useState<ContentTab>('project');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  const [selectedGalleryPhotoId, setSelectedGalleryPhotoId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const hasAppliedAdminTarget = useRef(false);
  const returnPathAfterLogin = getSafeReturnPath(searchParams.get('returnTo'));

  const activePost = useMemo(
    () => posts.find((post) => post.id === selectedBlogId) ?? posts.find((post) => post.id === form.id),
    [form.id, posts, selectedBlogId]
  );
  const activeBlogPostId = selectedType === 'blog' ? form.id : '';
  const canUploadMedia = Boolean(activeBlogPostId) && !isUploadingMedia;

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === (selectedType === 'project' ? selectedProjectId : form.projectId)),
    [form.projectId, projects, selectedProjectId, selectedType]
  );

  const getFrontendReturnPath = useCallback(() => {
    if (returnPathAfterLogin) return returnPathAfterLogin;

    if (activePost?.status === 'published') {
      return `/blog?project=${encodeURIComponent(activePost.projectSlug)}&post=${encodeURIComponent(activePost.slug)}`;
    }

    const returnProjectSlug = selectedProject?.slug || activePost?.projectSlug || projects[0]?.slug;
    return returnProjectSlug ? `/blog?project=${encodeURIComponent(returnProjectSlug)}` : '/blog';
  }, [activePost, projects, returnPathAfterLogin, selectedProject]);

  const editingProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? projects.find((project) => project.id === projectForm.id),
    [projectForm.id, projects, selectedProjectId]
  );

  const commentStats = useMemo(() => ({
    all: comments.length,
    pending: comments.filter((comment) => comment.status === 'pending').length,
    approved: comments.filter((comment) => comment.status === 'approved').length,
    hidden: comments.filter((comment) => comment.status === 'hidden').length,
  }), [comments]);

  const filteredComments = useMemo(() => (
    commentFilter === 'all'
      ? comments
      : comments.filter((comment) => comment.status === commentFilter)
  ), [commentFilter, comments]);

  const activeResumeVersion = useMemo(
    () => resumeVersions.find((version) => version.active) ?? null,
    [resumeVersions]
  );

  const galleryStats = useMemo(() => ({
    all: galleryPhotos.length,
    published: galleryPhotos.filter((photo) => photo.status === 'published').length,
    draft: galleryPhotos.filter((photo) => photo.status === 'draft').length,
    hidden: galleryPhotos.filter((photo) => photo.status === 'hidden').length,
  }), [galleryPhotos]);

  const refreshContent = useCallback(async () => {
    setIsLoadingContent(true);
    setError('');

    try {
      const [nextProjects, nextPosts, nextComments, nextGalleryPhotos, nextAboutContent] = await Promise.all([
        listAdminProjects(),
        listAdminBlogPosts(),
        listAdminComments(),
        listAdminGalleryPhotos(),
        getAdminAboutContent(),
      ]);

      setProjects(nextProjects);
      setPosts(nextPosts);
      setComments(nextComments);
      setGalleryPhotos(nextGalleryPhotos);
      setAboutContent(nextAboutContent);
      setAboutError('');
      listAdminResumeVersions()
        .then((nextResumeVersions) => {
          setResumeVersions(nextResumeVersions);
          setResumeError('');
        })
        .catch((resumeLoadError) => {
          setResumeVersions([]);
          setResumeError(resumeLoadError instanceof Error ? resumeLoadError.message : '简历版本加载失败。');
        });
      setSelectedProjectId((current) => (
        current && nextProjects.some((project) => project.id === current) ? current : null
      ));
      setSelectedBlogId((current) => (
        current && nextPosts.some((post) => post.id === current) ? current : null
      ));
      setSelectedGalleryPhotoId((current) => (
        current && nextGalleryPhotos.some((photo) => photo.id === current) ? current : null
      ));

      setProjectForm((current) => {
        if (current.id) {
          const freshProject = nextProjects.find((project) => project.id === current.id);
          if (freshProject) return formFromProject(freshProject);
        }

        return current;
      });

      setForm((current) => {
        if (current.id) {
          const freshPost = nextPosts.find((post) => post.id === current.id);
          if (freshPost) return formFromPost(freshPost);
        }

        if (!current.projectId && nextProjects.length > 0) {
          return { ...current, projectId: nextProjects[0].id };
        }

        return current;
      });

      setGalleryForm((current) => {
        if (current.id) {
          const freshPhoto = nextGalleryPhotos.find((photo) => photo.id === current.id);
          if (freshPhoto) return formFromGalleryPhoto(freshPhoto);
        }

        return current;
      });

      if (!hasAppliedAdminTarget.current) {
        const targetType = searchParams.get('type');
        const targetPost = searchParams.get('post');
        const targetProject = searchParams.get('project');

        if (targetType === 'blog' && targetPost) {
          const matchedPost = nextPosts.find((post) => (
            post.id === targetPost
            || (post.slug === targetPost && (!targetProject || post.projectSlug === targetProject))
          ));

          if (matchedPost) {
            setSelectedType('blog');
            setContentTab('blog');
            setSelectedBlogId(matchedPost.id);
            setSelectedProjectId(matchedPost.projectId);
            setIsCreatingNew(false);
            setEditorMode('preview');
            setForm(formFromPost(matchedPost));
          }
        } else if (targetType === 'project' && targetProject) {
          const matchedProject = nextProjects.find((project) => project.id === targetProject || project.slug === targetProject);

          if (matchedProject) {
            setSelectedType('project');
            setContentTab('project');
            setSelectedProjectId(matchedProject.id);
            setSelectedBlogId(null);
            setIsCreatingNew(false);
            setEditorMode('edit');
            setProjectForm(formFromProject(matchedProject));
            setForm((current) => ({ ...current, projectId: matchedProject.id }));
          }
        }

        hasAppliedAdminTarget.current = true;
      }
      return true;
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '后台数据加载失败。');
      return false;
    } finally {
      setIsLoadingContent(false);
    }
  }, [searchParams]);

  const refreshMediaAssets = useCallback(async (blogPostId?: string | null) => {
    setMediaError('');

    if (!blogPostId) {
      setMediaAssets([]);
      return;
    }

    try {
      setMediaAssets(await listMediaAssets(blogPostId));
    } catch (loadError) {
      setMediaAssets([]);
      setMediaError(loadError instanceof Error ? loadError.message : '图片列表加载失败。');
    }
  }, []);

  const refreshCurrentContent = useCallback(async () => {
    setNotice('');

    const loaded = await refreshContent();
    await refreshMediaAssets(activeBlogPostId);

    if (loaded) {
      setNotice(activeBlogPostId ? '内容已刷新。' : '内容列表已刷新。当前未保存草稿不会被覆盖。');
    }
  }, [activeBlogPostId, refreshContent, refreshMediaAssets]);

  useEffect(() => {
    let isCurrent = true;

    getCurrentAdmin()
      .then((nextUser) => {
        if (!isCurrent) return;
        setUser(nextUser);
        setAuthState('authenticated');
      })
      .catch(() => {
        if (!isCurrent) return;
        setAuthState('anonymous');
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (authState === 'authenticated') {
      void refreshContent();
    }
  }, [authState, refreshContent]);

  useEffect(() => {
    if (authState !== 'authenticated' || selectedType !== 'blog') {
      setMediaAssets([]);
      setMediaError('');
      return;
    }

    void refreshMediaAssets(activeBlogPostId);
  }, [activeBlogPostId, authState, refreshMediaAssets, selectedType]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');

    try {
      const nextUser = await loginAdmin(email, password);
      setUser(nextUser);
      setAuthState('authenticated');
      setPassword('');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '登录失败。');
    }
  };

  const handleReturnToFrontend = () => {
    navigate(getFrontendReturnPath(), { replace: true });
  };

  const handleLogoutAdmin = async () => {
    const returnPath = getFrontendReturnPath();
    setError('');
    setNotice('');

    try {
      await logoutAdmin();
      setUser(null);
      setAuthState('anonymous');
      setPassword('');
      navigate(returnPath, { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '退出登录失败。');
    }
  };

  const updateField = (
    field: keyof BlogEditorForm,
    value: string | number | boolean | ContentStatus
  ) => {
    setForm((current) => {
      const nextForm = {
        ...current,
        [field]: value,
        slug: field === 'title' && !current.id ? slugify(String(value)) : current.slug,
      };

      if (field === 'projectId' && !current.id) {
        return {
          ...nextForm,
          blogOrder: nextBlogOrderForProject(posts, String(value || '')),
        };
      }

      return nextForm;
    });
  };

  const handleInput = (field: keyof BlogEditorForm) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = field === 'blogOrder' || field === 'homeOrder' ? Number(event.target.value) : event.target.value;
    updateField(field, value);
    if (field === 'projectId') {
      setSelectedProjectId(String(value || '') || null);
    }
  };

  const handleCheckboxInput = (field: keyof Pick<BlogEditorForm, 'featuredOnHome'>) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    updateField(field, event.target.checked);
  };

  const updateProjectField = (
    field: keyof ProjectEditorForm,
    value: string | number | ContentStatus
  ) => {
    setProjectForm((current) => ({
      ...current,
      [field]: value,
      slug: field === 'title' && !current.id ? slugify(String(value), 'project') : current.slug,
    }));
  };

  const handleProjectInput = (field: keyof ProjectEditorForm) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = field === 'sortOrder' ? Number(event.target.value) : event.target.value;
    updateProjectField(field, value);
  };

  const updateGalleryField = (
    field: keyof GalleryPhotoForm,
    value: string | number | ContentStatus
  ) => {
    setGalleryForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleGalleryInput = (field: keyof GalleryPhotoForm) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = field === 'sortOrder' ? Number(event.target.value) : event.target.value;
    updateGalleryField(field, value);
  };

  const updateAboutField = (
    field: keyof Pick<AboutContentRecord, 'portraitImageUrl' | 'wechatQrImageUrl'>,
    value: string
  ) => {
    setAboutContent((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleAboutAssetUpload = (
    field: keyof Pick<AboutContentRecord, 'portraitImageUrl' | 'wechatQrImageUrl'>
  ) => async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    setIsAboutAssetsOpen(true);
    setError('');
    setNotice('');
    setAboutError('');
    setAboutAssetUploadTarget(field);

    try {
      const uploaded = await uploadAboutAsset(file);
      updateAboutField(field, uploaded.url);
      setNotice(field === 'portraitImageUrl'
        ? '头像已上传，记得保存个人页。'
        : '微信二维码已上传，记得保存个人页。');
    } catch (uploadError) {
      setAboutError(uploadError instanceof Error ? uploadError.message : '图片上传失败。');
    } finally {
      setAboutAssetUploadTarget(null);
      input.value = '';
    }
  };

  const updateAboutProfileDetail = (
    index: number,
    field: keyof AboutProfileDetail,
    value: string | boolean
  ) => {
    setAboutContent((current) => ({
      ...current,
      profileDetails: current.profileDetails.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  };

  const addAboutProfileDetail = () => {
    setIsAboutProfileOpen(true);
    setAboutContent((current) => ({
      ...current,
      profileDetails: [...current.profileDetails, emptyAboutProfileDetail()],
    }));
  };

  const removeAboutProfileDetail = (index: number) => {
    setAboutContent((current) => ({
      ...current,
      profileDetails: current.profileDetails.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const updateAboutResumeEntry = (
    index: number,
    field: keyof AboutResumeEntry,
    value: string | number | string[] | AboutResumeHighlight[]
  ) => {
    setAboutContent((current) => ({
      ...current,
      resumeEntries: current.resumeEntries.map((entry, itemIndex) => (
        itemIndex === index ? { ...entry, [field]: value } : entry
      )),
    }));
  };

  const addAboutResumeEntry = () => {
    setIsAboutResumeOpen(true);
    setAboutContent((current) => ({
      ...current,
      resumeEntries: [
        ...current.resumeEntries,
        emptyAboutResumeEntry(current.resumeEntries.length + 1),
      ],
    }));
  };

  const removeAboutResumeEntry = (index: number) => {
    setAboutContent((current) => ({
      ...current,
      resumeEntries: current.resumeEntries.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const updateAboutContactItem = (
    index: number,
    field: keyof AboutContactItem,
    value: string
  ) => {
    setAboutContent((current) => ({
      ...current,
      contactItems: current.contactItems.map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  };

  const addAboutContactItem = () => {
    setIsAboutContactOpen(true);
    setAboutContent((current) => ({
      ...current,
      contactItems: [...current.contactItems, emptyAboutContactItem()],
    }));
  };

  const removeAboutContactItem = (index: number) => {
    setAboutContent((current) => ({
      ...current,
      contactItems: current.contactItems.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const insertMediaAsset = (asset: MediaAssetRecord) => {
    const markdown = `![[${asset.fileName}|640]]`;

    setForm((current) => ({
      ...current,
      contentMarkdown: `${current.contentMarkdown.trimEnd()}\n\n${markdown}\n`,
    }));
    setEditorMode('edit');
    setNotice('图片已插入正文，修改 | 后面的数字可以调整宽度。');
  };

  const setCoverImageFromAsset = (asset: MediaAssetRecord) => {
    setForm((current) => ({
      ...current,
      coverImageUrl: asset.url,
    }));
    setNotice('已设为首页博客卡片封面。');
  };

  const handleMediaUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    setMediaError('');
    setNotice('');

    if (!activeBlogPostId) {
      setMediaError('请先保存草稿，再上传这个博客的图片。');
      input.value = '';
      return;
    }

    setIsUploadingMedia(true);

    try {
      const uploaded = await uploadMediaAsset(file, activeBlogPostId);
      setMediaAssets((current) => [uploaded, ...current.filter((asset) => asset.id !== uploaded.id)]);
      setNotice('图片已上传，需要时可点击图片卡片里的“插入正文”。');
    } catch (uploadError) {
      setMediaError(uploadError instanceof Error ? uploadError.message : '图片上传失败。');
    } finally {
      setIsUploadingMedia(false);
      input.value = '';
    }
  };

  const handleCoverImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    setMediaError('');
    setNotice('');

    if (!activeBlogPostId) {
      setMediaError('请先保存草稿，再上传首页封面。');
      input.value = '';
      return;
    }

    setIsUploadingMedia(true);

    try {
      const uploaded = await uploadMediaAsset(file, activeBlogPostId);
      setMediaAssets((current) => [uploaded, ...current.filter((asset) => asset.id !== uploaded.id)]);
      setForm((current) => ({
        ...current,
        coverImageUrl: uploaded.url,
      }));
      setNotice('首页封面已上传并设置，请保存后生效。');
    } catch (uploadError) {
      setMediaError(uploadError instanceof Error ? uploadError.message : '首页封面上传失败。');
    } finally {
      setIsUploadingMedia(false);
      input.value = '';
    }
  };

  const deleteCurrentMediaAsset = async (asset: MediaAssetRecord) => {
    const confirmed = window.confirm(`确定删除图片「${asset.fileName}」吗？如果文章里已经插入了这张图，图片链接会失效。`);
    if (!confirmed) return;

    setMediaError('');
    setNotice('');
    setMediaActionId(asset.id);

    try {
      await deleteMediaAsset(asset.id);
      setMediaAssets((current) => current.filter((item) => item.id !== asset.id));
      setNotice('图片已删除。');
    } catch (deleteError) {
      setMediaError(deleteError instanceof Error ? deleteError.message : '图片删除失败。');
    } finally {
      setMediaActionId(null);
    }
  };

  const selectProject = (project: ProjectRecord) => {
    setError('');
    setNotice('');
    setSelectedType('project');
    setContentTab('project');
    setSelectedProjectId(project.id);
    setSelectedBlogId(null);
    setSelectedGalleryPhotoId(null);
    setIsCreatingNew(false);
    setIsCreateMenuOpen(false);
    setEditorMode('edit');
    setProjectForm(formFromProject(project));
    setForm((current) => ({ ...current, projectId: project.id }));
  };

  const createNewProject = () => {
    setError('');
    setNotice('');
    setSelectedType('project');
    setContentTab('project');
    setSelectedProjectId(null);
    setSelectedBlogId(null);
    setSelectedGalleryPhotoId(null);
    setIsCreatingNew(true);
    setIsCreateMenuOpen(false);
    setEditorMode('edit');
    setProjectForm(emptyProjectForm());
  };

  const selectPost = (post: BlogPostRecord) => {
    setError('');
    setNotice('');
    setSelectedType('blog');
    setContentTab('blog');
    setSelectedBlogId(post.id);
    setSelectedProjectId(post.projectId);
    setSelectedGalleryPhotoId(null);
    setIsCreatingNew(false);
    setIsCreateMenuOpen(false);
    setEditorMode('preview');
    setForm(formFromPost(post));
  };

  const createNewPost = () => {
    const nextProjectId = selectedProjectId || form.projectId || projects[0]?.id || '';

    setError('');
    setNotice('');
    setMediaError('');
    setMediaAssets([]);
    setSelectedType('blog');
    setContentTab('blog');
    setSelectedBlogId(null);
    setSelectedProjectId(nextProjectId || null);
    setSelectedGalleryPhotoId(null);
    setIsCreatingNew(true);
    setIsCreateMenuOpen(false);
    setEditorMode('edit');
    setForm(emptyForm(nextProjectId, nextBlogOrderForProject(posts, nextProjectId)));
  };

  const showGalleryManagement = () => {
    setError('');
    setNotice('');
    setGalleryError('');
    setSelectedType('gallery');
    setContentTab('gallery');
    setSelectedBlogId(null);
    setSelectedProjectId(null);
    setIsCreatingNew(false);
    setIsCreateMenuOpen(false);
  };

  const createNewGalleryPhoto = () => {
    setError('');
    setNotice('');
    setGalleryError('');
    setSelectedType('gallery');
    setContentTab('gallery');
    setSelectedGalleryPhotoId(null);
    setSelectedBlogId(null);
    setSelectedProjectId(null);
    setIsCreatingNew(true);
    setIsCreateMenuOpen(false);
    setGalleryForm(emptyGalleryPhotoForm());
  };

  const selectGalleryPhoto = (photo: GalleryPhotoRecord) => {
    setError('');
    setNotice('');
    setGalleryError('');
    setSelectedType('gallery');
    setContentTab('gallery');
    setSelectedGalleryPhotoId(photo.id);
    setSelectedBlogId(null);
    setSelectedProjectId(null);
    setIsCreatingNew(false);
    setIsCreateMenuOpen(false);
    setGalleryForm(formFromGalleryPhoto(photo));
  };

  const showCommentManagement = () => {
    setError('');
    setNotice('');
    setSelectedType('comment');
    setContentTab('comment');
    setSelectedBlogId(null);
    setSelectedGalleryPhotoId(null);
    setIsCreatingNew(false);
    setIsCreateMenuOpen(false);
  };

  const showAboutManagement = () => {
    setError('');
    setNotice('');
    setAboutError('');
    setSelectedType('about');
    setContentTab('about');
    setSelectedBlogId(null);
    setSelectedProjectId(null);
    setSelectedGalleryPhotoId(null);
    setIsCreatingNew(false);
    setIsCreateMenuOpen(false);
  };

  const handleGalleryPhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    setError('');
    setNotice('');
    setGalleryError('');

    if (!galleryForm.title.trim()) {
      setGalleryError('请先填写图片标题，再上传。');
      input.value = '';
      return;
    }

    setIsUploadingGalleryPhoto(true);

    try {
      const uploaded = await uploadGalleryPhoto(file, toGalleryPhotoPayload(galleryForm));
      setGalleryPhotos((current) => [uploaded, ...current.filter((photo) => photo.id !== uploaded.id)]);
      setGalleryForm(formFromGalleryPhoto(uploaded));
      setSelectedType('gallery');
      setContentTab('gallery');
      setSelectedGalleryPhotoId(uploaded.id);
      setIsCreatingNew(false);
      setNotice(uploaded.status === 'published' ? '图册图片已上传，并会展示在摄影作品页。' : '图册图片已上传，发布后会展示在摄影作品页。');
      await refreshContent();
    } catch (uploadError) {
      setGalleryError(uploadError instanceof Error ? uploadError.message : '图册图片上传失败。');
    } finally {
      setIsUploadingGalleryPhoto(false);
      input.value = '';
    }
  };

  const saveGalleryPhoto = async (status = galleryForm.status) => {
    setError('');
    setNotice('');
    setGalleryError('');

    if (!galleryForm.id) {
      setGalleryError('请先上传图片，再保存信息。');
      return;
    }

    if (!galleryForm.title.trim()) {
      setGalleryError('图片标题需要填写。');
      return;
    }

    setIsSavingGalleryPhoto(true);

    try {
      const saved = await updateGalleryPhoto(galleryForm.id, toGalleryPhotoPayload(galleryForm, status));
      setGalleryPhotos((current) => current.map((photo) => (photo.id === saved.id ? saved : photo)));
      setGalleryForm(formFromGalleryPhoto(saved));
      setSelectedType('gallery');
      setContentTab('gallery');
      setSelectedGalleryPhotoId(saved.id);
      setNotice(status === 'published' ? '图册图片已发布。' : '图册图片信息已保存。');
      await refreshContent();
    } catch (saveError) {
      setGalleryError(saveError instanceof Error ? saveError.message : '图册图片保存失败。');
    } finally {
      setIsSavingGalleryPhoto(false);
    }
  };

  const deleteCurrentGalleryPhoto = async (photo = galleryPhotos.find((item) => item.id === galleryForm.id)) => {
    if (!photo) return;

    const confirmed = window.confirm(`确定删除图册图片「${photo.title}」吗？文件会一起删除，这个操作不能撤销。`);
    if (!confirmed) return;

    setError('');
    setNotice('');
    setGalleryError('');
    setGalleryActionId(photo.id);

    try {
      await deleteGalleryPhoto(photo.id);
      setGalleryPhotos((current) => current.filter((item) => item.id !== photo.id));
      setGalleryForm(emptyGalleryPhotoForm());
      setSelectedType('gallery');
      setContentTab('gallery');
      setSelectedGalleryPhotoId(null);
      setIsCreatingNew(true);
      setNotice('图册图片已删除。');
      await refreshContent();
    } catch (deleteError) {
      setGalleryError(deleteError instanceof Error ? deleteError.message : '图册图片删除失败。');
    } finally {
      setGalleryActionId(null);
    }
  };

  const handleResumeUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    setIsAboutResumeVersionsOpen(true);
    setError('');
    setNotice('');
    setResumeError('');

    const resolvedLabel = file.name.replace(/\.[^/.]+$/, '').trim() || file.name;

    setIsUploadingResume(true);

    try {
      const uploaded = await uploadResumeVersion(file, resolvedLabel);
      setResumeVersions((current) => [uploaded, ...current.filter((version) => version.id !== uploaded.id)]);
      setSelectedType('about');
      setContentTab('about');
      setNotice(uploaded.active ? '简历已上传，并已选中。' : '简历已上传，可在版本列表中选择。');
      await refreshContent();
    } catch (uploadError) {
      setResumeError(uploadError instanceof Error ? uploadError.message : '简历上传失败。');
    } finally {
      setIsUploadingResume(false);
      input.value = '';
    }
  };

  const activateResume = async (version: ResumeVersionRecord) => {
    setError('');
    setNotice('');
    setResumeError('');
    setResumeActionId(version.id);

    try {
      const activated = await activateResumeVersion(version.id);
      setResumeVersions((current) => current.map((item) => ({
        ...item,
        active: item.id === activated.id,
      })));
      setNotice(`已将「${activated.label}」展示在前端下载键。`);
      await refreshContent();
    } catch (caughtError) {
      setResumeError(caughtError instanceof Error ? caughtError.message : '简历版本切换失败。');
    } finally {
      setResumeActionId(null);
    }
  };

  const deleteResume = async (version: ResumeVersionRecord) => {
    const confirmed = window.confirm(`确定删除简历版本「${version.label}」吗？文件会一起删除，这个操作不能撤销。`);
    if (!confirmed) return;

    setError('');
    setNotice('');
    setResumeError('');
    setResumeActionId(version.id);

    try {
      await deleteResumeVersion(version.id);
      setResumeVersions((current) => current.filter((item) => item.id !== version.id));
      setNotice('简历版本已删除。');
      await refreshContent();
    } catch (caughtError) {
      setResumeError(caughtError instanceof Error ? caughtError.message : '简历版本删除失败。');
    } finally {
      setResumeActionId(null);
    }
  };

  const saveAboutContent = async () => {
    setError('');
    setNotice('');
    setAboutError('');

    const payload = aboutContentToPayload(aboutContent);

    if (payload.profileDetails.length === 0) {
      setAboutError('请至少保留一条个人信息。');
      return;
    }

    setIsSavingAbout(true);

    try {
      const saved = await updateAdminAboutContent(payload);
      setAboutContent(saved);
      setSelectedType('about');
      setContentTab('about');
      setNotice('个人主页内容已保存，前台刷新后会展示最新内容。');
    } catch (caughtError) {
      setAboutError(caughtError instanceof Error ? caughtError.message : '个人主页内容保存失败。');
    } finally {
      setIsSavingAbout(false);
    }
  };

  const updateCommentStatus = async (comment: CommentRecord, status: Exclude<CommentStatus, 'pending'>) => {
    setError('');
    setNotice('');
    setCommentActionId(comment.id);

    try {
      if (status === 'approved') {
        await approveAdminComment(comment.id);
        setNotice('评论已通过。');
      } else {
        await hideAdminComment(comment.id);
        setNotice('评论已隐藏。');
      }

      await refreshContent();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '评论状态更新失败。');
    } finally {
      setCommentActionId(null);
    }
  };

  const deleteComment = async (comment: CommentRecord) => {
    const confirmed = window.confirm(comment.parentId ? '确定删除这条回复吗？' : '确定删除这条评论及其回复吗？');
    if (!confirmed) return;

    setError('');
    setNotice('');
    setCommentActionId(comment.id);

    try {
      await deleteAdminComment(comment.id);
      setNotice('评论已删除。');
      await refreshContent();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '评论删除失败。');
    } finally {
      setCommentActionId(null);
    }
  };

  const saveProject = async (status: ContentStatus) => {
    setError('');
    setNotice('');

    if (!projectForm.title.trim() || !projectForm.summary.trim()) {
      setError('项目名称和项目简介都需要填写。');
      return;
    }

    setIsSavingProject(true);

    try {
      const payload = toProjectPayload(projectForm, status);
      const saved = projectForm.id
        ? await updateProject(projectForm.id, payload)
        : await createProject(payload);

      setProjectForm(formFromProject(saved));
      setForm((current) => ({ ...current, projectId: saved.id }));
      setSelectedType('project');
      setContentTab('project');
      setSelectedProjectId(saved.id);
      setSelectedBlogId(null);
      setIsCreatingNew(false);
      setNotice(status === 'published' ? '项目笔记已发布，可以在前台看到。' : '项目草稿已保存。');
      await refreshContent();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '项目保存失败。');
    } finally {
      setIsSavingProject(false);
    }
  };

  const deleteCurrentProject = async () => {
    if (!projectForm.id) return;

    const confirmed = window.confirm('确定删除这个项目笔记吗？项目下的博客也会一起删除，这个操作不能撤销。');
    if (!confirmed) return;

    setError('');
    setNotice('');
    setIsSavingProject(true);

    try {
      await deleteProject(projectForm.id);
      setProjectForm(emptyProjectForm());
      setForm(emptyForm(projects.find((project) => project.id !== projectForm.id)?.id ?? ''));
      setSelectedType('project');
      setContentTab('project');
      setSelectedProjectId(null);
      setSelectedBlogId(null);
      setIsCreatingNew(true);
      setNotice('项目笔记已删除。');
      await refreshContent();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '项目删除失败。');
    } finally {
      setIsSavingProject(false);
    }
  };

  const save = async (status: ContentStatus) => {
    setError('');
    setNotice('');

    if (!form.projectId) {
      setError('请先选择所属项目。');
      return;
    }

    if (!form.title.trim() || !form.summary.trim()) {
      setError('标题和摘要都需要填写。');
      return;
    }

    setIsSaving(true);

    try {
      const resolvedSlug = getUniqueBlogSlug(form, posts);
      const payload = toPayload(form, status, resolvedSlug);
      const saved = form.id
        ? await updateBlogPost(form.id, payload)
        : await createBlogPost(payload);

      setForm(formFromPost(saved));
      setSelectedType('blog');
      setContentTab('blog');
      setSelectedBlogId(saved.id);
      setSelectedProjectId(saved.projectId);
      setIsCreatingNew(false);
      setNotice(status === 'published' ? '已发布，可以查看预览效果。' : '草稿已保存。');
      setEditorMode(status === 'published' ? 'preview' : 'edit');
      await refreshContent();
    } catch (saveError) {
      setError(formatBlogSaveError(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCurrentPost = async () => {
    if (!form.id) return;

    const confirmed = window.confirm('确定删除这篇博客吗？这个操作不能撤销。');
    if (!confirmed) return;

    setError('');
    setNotice('');
    setIsSaving(true);

    try {
      await deleteBlogPost(form.id);
      const nextProjectId = form.projectId || projects[0]?.id || '';
      const remainingPosts = posts.filter((post) => post.id !== form.id);
      setForm(emptyForm(nextProjectId, nextBlogOrderForProject(remainingPosts, nextProjectId)));
      setSelectedType('blog');
      setContentTab('blog');
      setSelectedBlogId(null);
      setSelectedProjectId(nextProjectId || null);
      setIsCreatingNew(true);
      setNotice('博客已删除。');
      await refreshContent();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '删除失败。');
    } finally {
      setIsSaving(false);
    }
  };

  if (authState === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="mr-3 h-5 w-5 animate-spin text-slate-950" />
        正在检查登录状态
      </div>
    );
  }

  if (authState === 'anonymous') {
    return (
      <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-950">
        <div className="pointer-events-none min-h-screen select-none opacity-60 blur-[1px]">
          <header className="border-b border-slate-200 bg-white px-4 py-4">
            <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Admin Console</p>
                <h1 className="text-xl font-black tracking-tight">站主后台</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-10 w-20 rounded-md border border-slate-200 bg-white" />
                <div className="h-10 w-16 rounded-md bg-slate-100" />
              </div>
            </div>
          </header>

          <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="min-h-[420px] rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-300">Posts</p>
                  <div className="mt-2 h-5 w-24 rounded bg-slate-100" />
                </div>
                <div className="h-9 w-20 rounded-md bg-[#FFFF00]" />
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2 rounded-md bg-slate-100 p-1">
                <div className="h-8 rounded bg-white" />
                <div className="h-8 rounded bg-slate-200/60" />
              </div>
              <div className="space-y-3">
                <div className="h-20 rounded-md border border-slate-100 bg-slate-50" />
                <div className="h-20 rounded-md border border-slate-100 bg-slate-50" />
                <div className="h-20 rounded-md border border-slate-100 bg-slate-50" />
              </div>
            </aside>

            <section className="min-h-[520px] rounded-lg border border-slate-200 bg-white p-5">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="h-3 w-28 rounded bg-slate-100" />
                  <div className="mt-3 h-6 w-32 rounded bg-slate-200" />
                </div>
                <div className="flex gap-2">
                  <div className="h-10 w-24 rounded-md border border-slate-200 bg-white" />
                  <div className="h-10 w-24 rounded-md bg-slate-950" />
                </div>
              </div>
              <div className="grid gap-3 xl:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]">
                <div className="h-10 rounded-md border border-slate-200 bg-white" />
                <div className="h-10 rounded-md border border-slate-200 bg-white" />
              </div>
              <div className="mt-4 h-24 rounded-md border border-slate-200 bg-white" />
              <div className="mt-4 h-64 rounded-md bg-slate-950" />
            </section>
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/10 px-4 py-8 backdrop-blur-sm">
          <form
            onSubmit={handleLogin}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-login-title"
            className="w-full max-w-[360px] rounded-lg border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.75)]"
          >
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Admin</p>
              <h1 id="admin-login-title" className="mt-2 text-xl font-black tracking-tight text-slate-950">站主登录</h1>
            </div>

            <label className="mb-4 block">
              <span className="mb-2 block text-sm font-bold text-slate-600">邮箱</span>
              <Input
                value={email}
                type="email"
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="mb-5 block">
              <span className="mb-2 block text-sm font-bold text-slate-600">密码</span>
              <Input
                value={password}
                type="password"
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}

            <Button type="submit" className="w-full bg-slate-950 text-white hover:bg-slate-800">
              登录
            </Button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Admin Console</p>
            <h1 className="text-xl font-black tracking-tight">站主后台</h1>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-sm font-bold text-slate-500 sm:inline">{user?.email}</span>
            <Button
              type="button"
              variant="outline"
              className={adminHeaderButtonClass}
              disabled={isLoadingContent}
              onClick={() => void refreshCurrentContent()}
            >
              <RefreshCw className={cn('h-4 w-4', isLoadingContent && 'animate-spin')} />
              刷新
            </Button>
            <Button type="button" variant="outline" className={adminHeaderButtonClass} onClick={handleReturnToFrontend}>
              <ArrowLeft className="h-4 w-4" />
              返回前台
            </Button>
            <Button type="button" variant="outline" className={adminHeaderDangerButtonClass} onClick={() => void handleLogoutAdmin()}>
              <LogOut className="h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>
      </header>

      {notice && (
        <div className="pointer-events-none fixed left-1/2 top-3 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2" aria-live="polite">
          <div className="mx-auto flex items-center gap-2 rounded-b-xl rounded-t-md border border-emerald-100 bg-white px-3 py-2 text-sm font-black text-emerald-700 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.65)]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="min-w-0 leading-5 sm:whitespace-nowrap">{notice}</span>
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-4 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="min-h-[420px] rounded-lg border border-slate-200 bg-white lg:sticky lg:top-4 lg:max-h-[calc(100dvh-32px)]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Posts</p>
              <h2 className="font-black">内容管理</h2>
            </div>
            <div className="relative">
              <Button
                type="button"
                size="sm"
                className="gap-2 bg-[#FFFF00] text-black hover:bg-yellow-300"
                onClick={() => setIsCreateMenuOpen((current) => !current)}
                aria-expanded={isCreateMenuOpen}
              >
                <Plus className="h-4 w-4" />
                新建
                <ChevronDown className={cn('h-4 w-4 transition', isCreateMenuOpen && 'rotate-180')} />
              </Button>
              {isCreateMenuOpen && (
                <div className="absolute right-0 top-11 z-30 w-40 overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.55)]">
                  <button
                    type="button"
                    onClick={createNewProject}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <FolderKanban className="h-4 w-4 text-slate-400" />
                    新建项目
                  </button>
                  <button
                    type="button"
                    onClick={createNewPost}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <FileText className="h-4 w-4 text-slate-400" />
                    新建博客
                  </button>
                  <button
                    type="button"
                    onClick={createNewGalleryPhoto}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <ImageIcon className="h-4 w-4 text-slate-400" />
                    上传图册
                  </button>
                  <button
                    type="button"
                    onClick={showAboutManagement}
                    className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <UserRound className="h-4 w-4 text-slate-400" />
                    管理个人
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="border-b border-slate-100 p-2">
            <div className="grid grid-cols-3 gap-1 rounded-md bg-slate-100 p-1 sm:grid-cols-5">
              <button
                type="button"
                onClick={() => setContentTab('project')}
                className={cn(
                  'rounded px-3 py-2 text-sm font-black transition',
                  contentTab === 'project'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                项目
              </button>
              <button
                type="button"
                onClick={() => setContentTab('blog')}
                className={cn(
                  'rounded px-3 py-2 text-sm font-black transition',
                  contentTab === 'blog'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                博客
              </button>
              <button
                type="button"
                onClick={showGalleryManagement}
                className={cn(
                  'rounded px-3 py-2 text-sm font-black transition',
                  contentTab === 'gallery'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                图册
              </button>
              <button
                type="button"
                onClick={showCommentManagement}
                className={cn(
                  'rounded px-3 py-2 text-sm font-black transition',
                  contentTab === 'comment'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                评论
              </button>
              <button
                type="button"
                onClick={showAboutManagement}
                className={cn(
                  'rounded px-3 py-2 text-sm font-black transition',
                  contentTab === 'about'
                    ? 'bg-white text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                个人
              </button>
            </div>
          </div>

          <div className="max-h-[calc(100dvh-194px)] overflow-y-auto p-2">
            {contentTab === 'project' ? (
              projects.length === 0 ? (
                <div className="px-3 py-10 text-center text-sm font-bold text-slate-400">
                  暂无项目，点击新建项目开始
                </div>
              ) : (
                projects.map((project) => {
                  const isSelected = selectedType === 'project' && selectedProjectId === project.id;

                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => selectProject(project)}
                      className={cn(
                        'mb-2 w-full rounded-md border px-3 py-3 text-left transition',
                        isSelected
                          ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                          : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="line-clamp-2 text-sm font-black leading-5">{project.title}</span>
                        <StatusBadge status={project.status} />
                      </div>
                      <div className={cn('flex items-center gap-2 text-xs font-bold', isSelected ? 'text-slate-300' : 'text-slate-400')}>
                        <FolderKanban className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{project.slug}</span>
                      </div>
                    </button>
                  );
                })
              )
            ) : contentTab === 'blog' ? (
              posts.length === 0 ? (
                <div className="px-3 py-10 text-center text-sm font-bold text-slate-400">
                  暂无博客，点击新建博客开始
                </div>
              ) : (
                posts.map((post) => {
                  const isSelected = selectedType === 'blog' && selectedBlogId === post.id;

                  return (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => selectPost(post)}
                      className={cn(
                        'mb-2 w-full rounded-md border px-3 py-3 text-left transition',
                        isSelected
                          ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                          : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="line-clamp-2 text-sm font-black leading-5">{post.title}</span>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <StatusBadge status={post.status} />
                          {post.featuredOnHome && (
                            <Badge className="border-none bg-emerald-50 text-[10px] font-black text-emerald-700">
                              首页
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className={cn('space-y-1 text-xs font-bold', isSelected ? 'text-slate-300' : 'text-slate-400')}>
                        <div className="flex items-center gap-2">
                          <FolderKanban className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{post.projectTitle}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{post.category || DEFAULT_BLOG_CATEGORY} / 博客{post.blogOrder || '-'}</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )
            ) : contentTab === 'gallery' ? (
              galleryPhotos.length === 0 ? (
                <div className="px-3 py-10 text-center text-sm font-bold text-slate-400">
                  暂无图册图片，点击上传图册开始
                </div>
              ) : (
                galleryPhotos.map((photo) => {
                  const isSelected = selectedType === 'gallery' && selectedGalleryPhotoId === photo.id;

                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => selectGalleryPhoto(photo)}
                      className={cn(
                        'mb-2 w-full rounded-md border px-3 py-3 text-left transition',
                        isSelected
                          ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                          : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <img src={photo.url} alt={photo.title} className="h-14 w-16 shrink-0 rounded object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <span className="line-clamp-2 text-sm font-black leading-5">{photo.title}</span>
                            <StatusBadge status={photo.status} />
                          </div>
                          <div className={cn('space-y-1 text-xs font-bold', isSelected ? 'text-slate-300' : 'text-slate-400')}>
                            <div className="truncate">{photo.location || '未填写地点'} / {photo.takenAt || '未填写日期'}</div>
                            <div>排序 {photo.sortOrder}</div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )
            ) : contentTab === 'comment' ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={showCommentManagement}
                  className={cn(
                    'w-full rounded-md border px-3 py-3 text-left transition',
                    selectedType === 'comment'
                      ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                      : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="line-clamp-2 text-sm font-black leading-5">评论管理</span>
                    <Badge className="shrink-0 border-none bg-[#FFFF00] text-[11px] font-black text-black">
                      {commentStats.pending} 待审
                    </Badge>
                  </div>
                  <div className={cn('space-y-1 text-xs font-bold', selectedType === 'comment' ? 'text-slate-300' : 'text-slate-400')}>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>全部 {commentStats.all} 条</span>
                    </div>
                    <div>已通过 {commentStats.approved} · 已隐藏 {commentStats.hidden}</div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={showAboutManagement}
                  className={cn(
                    'w-full rounded-md border px-3 py-3 text-left transition',
                    selectedType === 'about'
                      ? 'border-slate-950 bg-slate-950 text-white shadow-sm'
                      : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                  )}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="line-clamp-2 text-sm font-black leading-5">个人主页内容</span>
                    <Badge className="shrink-0 border-none bg-[#FFFF00] text-[11px] font-black text-black">
                      可编辑
                    </Badge>
                  </div>
                  <div className={cn('space-y-1 text-xs font-bold', selectedType === 'about' ? 'text-slate-300' : 'text-slate-400')}>
                    <div className="flex items-center gap-2">
                      <UserRound className="h-3.5 w-3.5 shrink-0" />
                      <span>{aboutContent.profileDetails.length} 条个人信息</span>
                    </div>
                    <div>{aboutContent.resumeEntries.length} 条项目/论文简历</div>
                    <div className="flex items-center gap-2">
                      <Download className="h-3.5 w-3.5 shrink-0" />
                      <span>{resumeVersions.length} 个下载简历版本</span>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0">
          {selectedType === null ? (
            <section className="flex min-h-[520px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
              <div className="max-w-md">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                  <FileText className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-black text-slate-950">还没有选择内容</h2>
                <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
                  从左侧选择项目、博客、图册、评论或个人内容，或者点击新建开始编辑。
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Button type="button" className="gap-2 bg-slate-950 text-white hover:bg-slate-800" onClick={createNewProject}>
                    <FolderKanban className="h-4 w-4" />
                    新建项目
                  </Button>
                  <Button type="button" variant="outline" className="gap-2" onClick={createNewPost}>
                    <FileText className="h-4 w-4" />
                    新建博客
                  </Button>
                  <Button type="button" variant="outline" className="gap-2" onClick={createNewGalleryPhoto}>
                    <ImageIcon className="h-4 w-4" />
                    上传图册
                  </Button>
                  <Button type="button" variant="outline" className="gap-2" onClick={showCommentManagement}>
                    <MessageCircle className="h-4 w-4" />
                    管理评论
                  </Button>
                  <Button type="button" variant="outline" className="gap-2" onClick={showAboutManagement}>
                    <UserRound className="h-4 w-4" />
                    管理个人
                  </Button>
                </div>
              </div>
            </section>
          ) : selectedType === 'about' ? (
            <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">About Content</p>
                    <h2 className="font-black">个人主页内容</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                      <span>{aboutContent.profileDetails.length} 条个人信息</span>
                      <span>{aboutContent.resumeEntries.length} 条项目/论文简历</span>
                      <span>{resumeVersions.length} 个下载简历版本</span>
                      <span>{aboutContent.contactItems.length} 条联系信息</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2">
                    <Button type="button" variant="outline" className="gap-2" onClick={() => void refreshContent()}>
                      <RefreshCw className={cn('h-4 w-4', isLoadingContent && 'animate-spin')} />
                      刷新
                    </Button>
                    <Button
                      type="button"
                      className="gap-2 bg-slate-950 text-white hover:bg-slate-800"
                      disabled={isSavingAbout}
                      onClick={() => void saveAboutContent()}
                    >
                      {isSavingAbout ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      保存个人页
                    </Button>
                  </div>
                </div>
              </div>

              {aboutError && <p className="mx-4 mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{aboutError}</p>}
              {resumeError && <p className="mx-4 mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{resumeError}</p>}
              {error && <p className="mx-4 mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}

              <div className="space-y-5 p-4 md:p-5">
                <section className="rounded-md border border-slate-200 bg-white p-3">
                  <div className={cn('flex flex-wrap items-center justify-between gap-3', isAboutAssetsOpen && 'mb-3')}>
                    <button
                      type="button"
                      className="flex min-w-0 items-center gap-2 rounded-md text-left transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                      onClick={() => setIsAboutAssetsOpen((current) => !current)}
                      aria-expanded={isAboutAssetsOpen}
                      aria-controls="about-basic-assets"
                    >
                      <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition', !isAboutAssetsOpen && '-rotate-90')} />
                      <p className="text-sm font-black text-slate-700">基础资源</p>
                    </button>
                  </div>
                  {isAboutAssetsOpen && (
                    <div id="about-basic-assets" className="grid gap-3 md:grid-cols-2 xl:max-w-3xl">
                    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-2.5">
                      {aboutContent.portraitImageUrl ? (
                        <img
                          src={getApiUrl(aboutContent.portraitImageUrl)}
                          alt="头像预览"
                          className="h-14 w-14 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-200 bg-white text-slate-300">
                          <UserRound className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-700">头像图片</p>
                        <p className="truncate text-xs font-bold text-slate-400">{aboutContent.portraitImageUrl ? '已上传头像' : '未上传头像'}</p>
                      </div>
                      <label className={cn(
                        'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-100',
                        aboutAssetUploadTarget && 'pointer-events-none opacity-70'
                      )}>
                        {aboutAssetUploadTarget === 'portraitImageUrl' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        从本地上传
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/gif,image/webp"
                          className="sr-only"
                          disabled={Boolean(aboutAssetUploadTarget)}
                          onChange={(event) => void handleAboutAssetUpload('portraitImageUrl')(event)}
                        />
                      </label>
                    </div>
                    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-2.5">
                      {aboutContent.wechatQrImageUrl ? (
                        <img
                          src={getApiUrl(aboutContent.wechatQrImageUrl)}
                          alt="微信二维码预览"
                          className="h-14 w-14 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-slate-200 bg-white text-slate-300">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-700">微信二维码</p>
                        <p className="truncate text-xs font-bold text-slate-400">{aboutContent.wechatQrImageUrl ? '已上传二维码' : '未上传二维码'}</p>
                      </div>
                      <label className={cn(
                        'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-100',
                        aboutAssetUploadTarget && 'pointer-events-none opacity-70'
                      )}>
                        {aboutAssetUploadTarget === 'wechatQrImageUrl' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        从本地上传
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/gif,image/webp"
                          className="sr-only"
                          disabled={Boolean(aboutAssetUploadTarget)}
                          onChange={(event) => void handleAboutAssetUpload('wechatQrImageUrl')(event)}
                        />
                      </label>
                    </div>
                    </div>
                  )}
                </section>

                <section className="rounded-md border border-slate-200 bg-white p-3">
                  <div className={cn('flex flex-wrap items-center justify-between gap-3', isAboutResumeVersionsOpen && 'mb-3')}>
                    <button
                      type="button"
                      className="flex min-w-0 items-center gap-2 rounded-md text-left transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                      onClick={() => setIsAboutResumeVersionsOpen((current) => !current)}
                      aria-expanded={isAboutResumeVersionsOpen}
                      aria-controls="about-resume-versions"
                    >
                      <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition', !isAboutResumeVersionsOpen && '-rotate-90')} />
                      <p className="text-sm font-black text-slate-700">简历</p>
                    </button>
                    <Badge className={cn(
                      'border-none font-black',
                      activeResumeVersion ? 'bg-[#FFFF00] text-black' : 'bg-slate-100 text-slate-500'
                    )}>
                      {activeResumeVersion ? `当前：${activeResumeVersion.label}` : '未选择'}
                    </Badge>
                  </div>

                  {isAboutResumeVersionsOpen && (
                    <div id="about-resume-versions" className="grid gap-3 xl:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                      <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700">
                        <Upload className="h-4 w-4" />
                        上传新版本
                      </div>
                      <div className="grid gap-2">
                        <label className={cn(
                          'inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-100',
                          isUploadingResume && 'pointer-events-none opacity-70'
                        )}>
                          {isUploadingResume ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          上传文件
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            className="sr-only"
                            disabled={isUploadingResume}
                            onChange={(event) => void handleResumeUpload(event)}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="mb-3">
                        <p className="text-sm font-black text-slate-700">版本列表</p>
                      </div>

                      {resumeVersions.length === 0 ? (
                        <div className="rounded-md border border-dashed border-slate-200 px-3 py-6 text-center">
                          <Download className="mx-auto h-6 w-6 text-slate-300" />
                          <p className="mt-2 text-sm font-bold text-slate-400">暂无简历版本。</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {resumeVersions.map((version) => {
                            const isActionBusy = resumeActionId === version.id;

                            return (
                              <article
                                key={version.id}
                                className={cn(
                                  'rounded-md border p-3 transition',
                                  version.active ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white'
                                )}
                              >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div className="flex min-w-0 items-start gap-2">
                                    <label className={cn(
                                      'mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border transition',
                                      version.active
                                        ? 'border-[#FFFF00] bg-[#FFFF00] text-black'
                                        : 'border-slate-300 bg-white text-slate-400 hover:border-slate-500'
                                    )}>
                                      <input
                                        type="radio"
                                        name="active-resume-version"
                                        checked={version.active}
                                        disabled={Boolean(resumeActionId)}
                                        onChange={() => {
                                          if (!version.active) void activateResume(version);
                                        }}
                                        aria-label={`选择 ${version.label} 用于前端下载键`}
                                        className="sr-only"
                                      />
                                      {isActionBusy ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <span className={cn(
                                          'h-2.5 w-2.5 rounded-full',
                                          version.active ? 'bg-black' : 'bg-transparent'
                                        )} />
                                      )}
                                    </label>
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-black">{version.label}</h3>
                                        {version.active && (
                                          <Badge className="border-none bg-[#FFFF00] text-[11px] font-black text-black">
                                            当前
                                          </Badge>
                                        )}
                                      </div>
                                      <div className={cn('mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold', version.active ? 'text-slate-300' : 'text-slate-400')}>
                                        <span>{version.fileName}</span>
                                        <span>{formatFileSize(version.sizeBytes)}</span>
                                        <span>{formatAdminDate(version.createdAt)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap justify-end gap-2">
                                    <a
                                      href={getApiUrl(version.url)}
                                      download={version.fileName}
                                      className={cn(
                                        'inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-black transition',
                                        version.active
                                          ? 'border-white/20 bg-white/10 text-white hover:bg-white/15'
                                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                      )}
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                      下载
                                    </a>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                      disabled={Boolean(resumeActionId)}
                                      onClick={() => void deleteResume(version)}
                                    >
                                      {isActionBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                      删除
                                    </Button>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    </div>
                  )}
                </section>

                <section className="rounded-md border border-slate-200 bg-white p-4">
                  <div className={cn('flex flex-wrap items-center justify-between gap-3', isAboutProfileOpen && 'mb-4')}>
                    <button
                      type="button"
                      className="flex min-w-0 items-center gap-2 rounded-md text-left transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                      onClick={() => setIsAboutProfileOpen((current) => !current)}
                      aria-expanded={isAboutProfileOpen}
                      aria-controls="about-profile-details"
                    >
                      <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition', !isAboutProfileOpen && '-rotate-90')} />
                      <div className="min-w-0">
                        <p className="text-sm font-black text-slate-700">个人信息</p>
                      </div>
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" variant="outline" className="gap-2" onClick={addAboutProfileDetail}>
                        <Plus className="h-4 w-4" />
                        添加信息
                      </Button>
                    </div>
                  </div>

                  {isAboutProfileOpen && (
                    <div id="about-profile-details" className="space-y-3">
                      {aboutContent.profileDetails.map((detail, index) => (
                        <div key={`${detail.label}-${index}`} className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <div className="grid gap-3 xl:grid-cols-[1fr_2fr_150px_2fr_auto]">
                            <label>
                              <span className="mb-2 block text-xs font-black text-slate-500">标签</span>
                              <Input value={detail.label} onChange={(event) => updateAboutProfileDetail(index, 'label', event.target.value)} />
                            </label>
                            <label>
                              <span className="mb-2 block text-xs font-black text-slate-500">内容</span>
                              <Input value={detail.value} onChange={(event) => updateAboutProfileDetail(index, 'value', event.target.value)} />
                            </label>
                            <label>
                              <span className="mb-2 block text-xs font-black text-slate-500">图标</span>
                              <Input value={detail.icon || ''} onChange={(event) => updateAboutProfileDetail(index, 'icon', event.target.value)} />
                            </label>
                            <label>
                              <span className="mb-2 block text-xs font-black text-slate-500">双击复制值</span>
                              <Input value={detail.copyValue || ''} onChange={(event) => updateAboutProfileDetail(index, 'copyValue', event.target.value)} placeholder="不需要复制可留空" />
                            </label>
                            <div className="flex items-end gap-2">
                              <label className="mb-2 inline-flex items-center gap-2 whitespace-nowrap text-xs font-black text-slate-500">
                                <input
                                  type="checkbox"
                                  checked={Boolean(detail.wide)}
                                  onChange={(event) => updateAboutProfileDetail(index, 'wide', event.target.checked)}
                                  className="h-4 w-4 rounded border-slate-300 accent-[#FFFF00]"
                                />
                                独占一行
                              </label>
                              <Button type="button" variant="outline" size="sm" className="mb-1 border-red-200 text-red-700 hover:bg-red-50" onClick={() => removeAboutProfileDetail(index)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-md border border-slate-200 bg-white p-4">
                  <div className={cn('flex flex-wrap items-center justify-between gap-3', isAboutResumeOpen && 'mb-4')}>
                    <button
                      type="button"
                      className="flex min-w-0 items-center gap-2 rounded-md text-left transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                      onClick={() => setIsAboutResumeOpen((current) => !current)}
                      aria-expanded={isAboutResumeOpen}
                      aria-controls="about-resume-entries"
                    >
                      <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition', !isAboutResumeOpen && '-rotate-90')} />
                      <p className="text-sm font-black text-slate-700">项目 / 论文</p>
                    </button>
                    <Button type="button" variant="outline" className="gap-2" onClick={addAboutResumeEntry}>
                      <Plus className="h-4 w-4" />
                      添加项目 / 论文
                    </Button>
                  </div>

                  {isAboutResumeOpen && (
                    <div id="about-resume-entries" className="space-y-4">
                      {aboutContent.resumeEntries.map((entry, index) => (
                        <article key={`${entry.title}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-slate-800">{entry.title || '未命名项目简历'}</p>
                            <p className="mt-1 text-xs font-bold text-slate-400">排序 {entry.sortOrder ?? index + 1}</p>
                          </div>
                          <Button type="button" variant="outline" size="sm" className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50" onClick={() => removeAboutResumeEntry(index)}>
                            <Trash2 className="h-3.5 w-3.5" />
                            删除
                          </Button>
                        </div>

                        <div className="grid gap-3 xl:grid-cols-[180px_minmax(0,1fr)_180px_120px]">
                          <label>
                            <span className="mb-2 block text-xs font-black text-slate-500">分类</span>
                            <Input value={entry.category || ''} onChange={(event) => updateAboutResumeEntry(index, 'category', event.target.value)} placeholder="Project Resume" />
                          </label>
                          <label>
                            <span className="mb-2 block text-xs font-black text-slate-500">标题</span>
                            <Input value={entry.title} onChange={(event) => updateAboutResumeEntry(index, 'title', event.target.value)} />
                          </label>
                          <label>
                            <span className="mb-2 block text-xs font-black text-slate-500">时间</span>
                            <Input value={entry.period || ''} onChange={(event) => updateAboutResumeEntry(index, 'period', event.target.value)} placeholder="2026.XX – 至今" />
                          </label>
                          <label>
                            <span className="mb-2 block text-xs font-black text-slate-500">排序</span>
                            <Input type="number" value={entry.sortOrder ?? index + 1} onChange={(event) => updateAboutResumeEntry(index, 'sortOrder', Number(event.target.value))} />
                          </label>
                        </div>

                        <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(240px,360px)_minmax(0,1fr)]">
                          <label>
                            <span className="mb-2 block text-xs font-black text-slate-500">副信息</span>
                            <Input value={entry.meta || ''} onChange={(event) => updateAboutResumeEntry(index, 'meta', event.target.value)} placeholder="独立开发 / 第一作者等" />
                          </label>
                          <label>
                            <span className="mb-2 block text-xs font-black text-slate-500">技术栈 / 研究方向</span>
                            <Input value={listToText(entry.techStack)} onChange={(event) => updateAboutResumeEntry(index, 'techStack', textToList(event.target.value))} placeholder="Python、FastAPI、RAG" />
                          </label>
                        </div>

                        <div className="mt-3 grid gap-3 xl:grid-cols-[180px_minmax(0,1fr)]">
                          <label>
                            <span className="mb-2 block text-xs font-black text-slate-500">描述标签</span>
                            <Input value={entry.descriptionLabel || ''} onChange={(event) => updateAboutResumeEntry(index, 'descriptionLabel', event.target.value)} placeholder="项目描述" />
                          </label>
                          <label>
                            <span className="mb-2 block text-xs font-black text-slate-500">描述内容</span>
                            <textarea
                              value={entry.description || ''}
                              onChange={(event) => updateAboutResumeEntry(index, 'description', event.target.value)}
                              rows={3}
                              className="w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm font-medium leading-6 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-950"
                            />
                          </label>
                        </div>

                        <div className="mt-3 grid gap-3 xl:grid-cols-[180px_minmax(0,1fr)]">
                          <label>
                            <span className="mb-2 block text-xs font-black text-slate-500">亮点标签</span>
                            <Input value={entry.highlightsLabel || ''} onChange={(event) => updateAboutResumeEntry(index, 'highlightsLabel', event.target.value)} placeholder="项目亮点" />
                          </label>
                          <label>
                            <span className="mb-2 block text-xs font-black text-slate-500">亮点列表</span>
                            <textarea
                              value={highlightsToText(entry.highlights)}
                              onChange={(event) => updateAboutResumeEntry(index, 'highlights', textToHighlights(event.target.value))}
                              rows={6}
                              className="w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm font-medium leading-6 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-950"
                              placeholder="Agent 链路编排：将请求拆为多个可观测节点。"
                            />
                          </label>
                        </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>

                <div className="grid gap-5">
                  <section className="rounded-md border border-slate-200 bg-white p-4">
                    <div className={cn('flex flex-wrap items-center justify-between gap-3', isAboutContactOpen && 'mb-4')}>
                      <button
                        type="button"
                        className="flex min-w-0 items-center gap-2 rounded-md text-left transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                        onClick={() => setIsAboutContactOpen((current) => !current)}
                        aria-expanded={isAboutContactOpen}
                        aria-controls="about-contact-items"
                      >
                        <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition', !isAboutContactOpen && '-rotate-90')} />
                        <p className="text-sm font-black text-slate-700">联系信息</p>
                      </button>
                      <Button type="button" variant="outline" className="gap-2" onClick={addAboutContactItem}>
                        <Plus className="h-4 w-4" />
                        添加
                      </Button>
                    </div>
                    {isAboutContactOpen && (
                      <div id="about-contact-items" className="space-y-3">
                        {aboutContent.contactItems.map((item, index) => (
                          <div key={`${item.label}-${index}`} className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 xl:grid-cols-[1fr_1fr_120px_auto]">
                            <Input value={item.label} onChange={(event) => updateAboutContactItem(index, 'label', event.target.value)} placeholder="Email Me" />
                            <Input value={item.value} onChange={(event) => updateAboutContactItem(index, 'value', event.target.value)} placeholder="lgj425425@126.com" />
                            <Input value={item.icon || ''} onChange={(event) => updateAboutContactItem(index, 'icon', event.target.value)} placeholder="mail" />
                            <Button type="button" variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => removeAboutContactItem(index)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                </div>
              </div>
            </section>
          ) : selectedType === 'gallery' ? (
            <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Gallery Photos</p>
                    <h2 className="font-black">{galleryForm.id ? '编辑图册图片' : '上传图册图片'}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                      <span>全部 {galleryStats.all}</span>
                      <span>已发布 {galleryStats.published}</span>
                      <span>草稿 {galleryStats.draft}</span>
                      <span>隐藏 {galleryStats.hidden}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2">
                    <Button type="button" variant="outline" className="gap-2" onClick={createNewGalleryPhoto}>
                      <Plus className="h-4 w-4" />
                      新图片
                    </Button>
                    <Button type="button" variant="outline" className="gap-2" onClick={() => void refreshContent()}>
                      <RefreshCw className={cn('h-4 w-4', isLoadingContent && 'animate-spin')} />
                      刷新图册
                    </Button>
                  </div>
                </div>
              </div>

              {galleryError && <p className="mx-4 mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{galleryError}</p>}
              {error && <p className="mx-4 mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}

              <div className="grid gap-5 p-4 md:p-5 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
                <section className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  {galleryForm.url ? (
                    <div className="overflow-hidden rounded-md bg-white">
                      <img src={galleryForm.url} alt={galleryForm.title || '图册图片预览'} className="aspect-[4/5] w-full object-cover" />
                      <div className="border-t border-slate-100 p-3">
                        <p className="truncate text-sm font-black text-slate-700">{galleryForm.fileName}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">{galleryForm.url}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-white px-4 text-center">
                      <ImageIcon className="h-9 w-9 text-slate-300" />
                      <p className="mt-3 text-sm font-bold text-slate-400">先填写信息，再选择本地图片上传。</p>
                    </div>
                  )}
                </section>

                <section className="space-y-5 rounded-md border border-slate-200 bg-white p-4">
                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_140px]">
                    <label>
                      <span className="mb-2 block text-sm font-bold text-slate-600">图片标题</span>
                      <Input value={galleryForm.title} onChange={handleGalleryInput('title')} placeholder="例如：屋檐小太阳" />
                    </label>
                    <label>
                      <span className="mb-2 block text-sm font-bold text-slate-600">排序</span>
                      <Input type="number" value={galleryForm.sortOrder} onChange={handleGalleryInput('sortOrder')} />
                    </label>
                  </div>

                  <div className="grid gap-3 xl:grid-cols-3">
                    <label>
                      <span className="mb-2 block text-sm font-bold text-slate-600">地点</span>
                      <Input value={galleryForm.location} onChange={handleGalleryInput('location')} placeholder="生活图册" />
                    </label>
                    <label>
                      <span className="mb-2 block text-sm font-bold text-slate-600">日期</span>
                      <Input value={galleryForm.takenAt} onChange={handleGalleryInput('takenAt')} placeholder="2024 或 2024-05" />
                    </label>
                    <label>
                      <span className="mb-2 block text-sm font-bold text-slate-600">状态</span>
                      <select
                        value={galleryForm.status}
                        onChange={handleGalleryInput('status')}
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-950"
                      >
                        <option value="draft">草稿</option>
                        <option value="published">已发布</option>
                        <option value="hidden">隐藏</option>
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-bold text-slate-600">描述</span>
                    <textarea
                      value={galleryForm.description}
                      onChange={handleGalleryInput('description')}
                      rows={4}
                      className="w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm font-medium leading-6 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-950"
                      placeholder="写一句照片背后的心情或故事。"
                    />
                  </label>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    {!galleryForm.id ? (
                      <label className={cn(
                        'inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800',
                        isUploadingGalleryPhoto && 'pointer-events-none opacity-70'
                      )}>
                        {isUploadingGalleryPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        选择图片上传
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/gif,image/webp"
                          className="sr-only"
                          disabled={isUploadingGalleryPhoto}
                          onChange={(event) => void handleGalleryPhotoUpload(event)}
                        />
                      </label>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" className="gap-2" disabled={isSavingGalleryPhoto} onClick={() => void saveGalleryPhoto(galleryForm.status)}>
                          {isSavingGalleryPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          保存信息
                        </Button>
                        <Button type="button" className="gap-2 bg-slate-950 text-white hover:bg-slate-800" disabled={isSavingGalleryPhoto} onClick={() => void saveGalleryPhoto('published')}>
                          <Send className="h-4 w-4" />
                          发布展示
                        </Button>
                      </div>
                    )}

                    {galleryForm.id && (
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                        disabled={Boolean(galleryActionId)}
                        onClick={() => void deleteCurrentGalleryPhoto()}
                      >
                        {galleryActionId === galleryForm.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        删除图片
                      </Button>
                    )}
                  </div>
                </section>
              </div>
            </section>
          ) : selectedType === 'comment' ? (
            <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Comments</p>
                    <h2 className="font-black">评论管理</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                      <span>全部 {commentStats.all}</span>
                      <span>待审核 {commentStats.pending}</span>
                      <span>已通过 {commentStats.approved}</span>
                      <span>已隐藏 {commentStats.hidden}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2">
                    <Button type="button" variant="outline" className="gap-2" onClick={() => void refreshContent()}>
                      <RefreshCw className={cn('h-4 w-4', isLoadingContent && 'animate-spin')} />
                      刷新评论
                    </Button>
                  </div>
                </div>
              </div>

              {error && <p className="mx-4 mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}

              <div className="space-y-4 p-4 md:p-5">
                <div className="flex flex-wrap gap-2">
                  {([
                    { value: 'all', label: '全部', count: commentStats.all },
                    { value: 'pending', label: '待审核', count: commentStats.pending },
                    { value: 'approved', label: '已通过', count: commentStats.approved },
                    { value: 'hidden', label: '已隐藏', count: commentStats.hidden },
                  ] as Array<{ value: CommentStatus | 'all'; label: string; count: number }>).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCommentFilter(option.value)}
                      className={cn(
                        'rounded-full px-4 py-2 text-xs font-black transition',
                        commentFilter === option.value
                          ? 'bg-slate-950 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                      )}
                    >
                      {option.label} {option.count}
                    </button>
                  ))}
                </div>

                {isLoadingContent && (
                  <div className="rounded-md bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-400">
                    正在加载评论...
                  </div>
                )}

                {!isLoadingContent && filteredComments.length === 0 && (
                  <div className="rounded-md border border-dashed border-slate-200 px-4 py-12 text-center">
                    <MessageCircle className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="mt-3 text-sm font-bold text-slate-400">暂无评论。</p>
                  </div>
                )}

                {!isLoadingContent && filteredComments.length > 0 && (
                  <div className="space-y-3">
                    {filteredComments.map((comment) => {
                      const isActionBusy = commentActionId === comment.id;

                      return (
                        <article key={comment.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-black text-slate-950">{comment.authorName}</span>
                                <CommentStatusBadge status={comment.status} />
                                {comment.parentId && (
                                  <Badge variant="secondary" className="border-none bg-slate-100 font-black text-slate-500">
                                    回复
                                  </Badge>
                                )}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                                <span>{comment.targetType === 'blog' ? '博客评论' : '留言板'}</span>
                                <span>/</span>
                                <span>{commentTargetLabel(comment, posts)}</span>
                                <span>/</span>
                                <span>{formatCommentDate(comment.createdAt)}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap justify-end gap-2">
                              {comment.status !== 'approved' && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                  disabled={Boolean(commentActionId)}
                                  onClick={() => void updateCommentStatus(comment, 'approved')}
                                >
                                  {isActionBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                  通过
                                </Button>
                              )}
                              {comment.status !== 'hidden' && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                                  disabled={Boolean(commentActionId)}
                                  onClick={() => void updateCommentStatus(comment, 'hidden')}
                                >
                                  {isActionBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <EyeOff className="h-3.5 w-3.5" />}
                                  隐藏
                                </Button>
                              )}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-1.5 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                disabled={Boolean(commentActionId)}
                                onClick={() => void deleteComment(comment)}
                              >
                                {isActionBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                删除
                              </Button>
                            </div>
                          </div>

                          <p className="mt-4 whitespace-pre-wrap rounded-md bg-slate-50 px-4 py-3 text-sm font-medium leading-6 text-slate-700">
                            {comment.content}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          ) : selectedType === 'project' ? (
            <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Project Editor</p>
                    <h2 className="font-black">{isCreatingNew || !projectForm.id ? '新建项目' : '编辑项目'}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={projectForm.status} />
                      <Badge variant="secondary" className="border-none bg-slate-100 font-black text-slate-600">
                        {projectForm.slug || editingProject?.slug || '未设置 slug'}
                      </Badge>
                      <span className="text-xs font-bold text-slate-400">
                        {projectForm.id ? '正在编辑项目笔记' : '新的项目草稿'}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2">
                    {projectForm.id && (
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                        disabled={isSavingProject}
                        onClick={() => void deleteCurrentProject()}
                      >
                        <Trash2 className="h-4 w-4" />
                        删除项目
                      </Button>
                    )}
                    <Button type="button" variant="outline" className="gap-2" disabled={isSavingProject} onClick={() => void saveProject('draft')}>
                      {isSavingProject ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      保存草稿
                    </Button>
                    <Button type="button" className="gap-2 bg-slate-950 text-white hover:bg-slate-800" disabled={isSavingProject} onClick={() => void saveProject('published')}>
                      <Send className="h-4 w-4" />
                      发布项目
                    </Button>
                  </div>
                </div>
              </div>

              {error && <p className="mx-4 mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}

              <div className="space-y-5 p-4 md:p-5">
                <div className="grid gap-3 xl:grid-cols-[minmax(0,4fr)_minmax(0,3fr)_120px]">
                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-600">项目名称</span>
                    <Input value={projectForm.title} onChange={handleProjectInput('title')} placeholder="例如：多模态智能客服 Agent" />
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-600">项目 Slug</span>
                    <Input value={projectForm.slug} onChange={handleProjectInput('slug')} placeholder="mmcsa" />
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-600">排序</span>
                    <Input type="number" value={projectForm.sortOrder} onChange={handleProjectInput('sortOrder')} />
                  </label>
                </div>

                <section className="rounded-md border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-700">项目图标</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">显示在项目卡片左上角。</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFFF00] text-black shadow-sm shadow-[#FFFF00]/30">
                      <ProjectIconGlyph value={projectForm.projectIcon} className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-5 xl:grid-cols-10">
                    {projectIconOptions.map((option) => {
                      const selectedIcon = projectForm.projectIcon || 'folder';
                      const isSelected = selectedIcon === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={isSelected}
                          title={option.label}
                          onClick={() => updateProjectField('projectIcon', option.value)}
                          className={cn(
                            'flex h-16 flex-col items-center justify-center gap-1 rounded-md border text-xs font-black transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#FFFF00]',
                            isSelected
                              ? 'border-[#FFFF00] bg-[#FFFF00]/25 text-slate-950 shadow-sm shadow-[#FFFF00]/30'
                              : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-white'
                          )}
                        >
                          <ProjectIconGlyph value={option.value} className="h-5 w-5" />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <div className="grid gap-3 xl:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]">
                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-600">技术栈</span>
                    <Input value={projectForm.techStackText} onChange={handleProjectInput('techStackText')} placeholder="React, Spring Boot, PostgreSQL" />
                  </label>
                  <label>
                    <span className="mb-2 block text-sm font-bold text-slate-600">项目简介</span>
                    <Input value={projectForm.summary} onChange={handleProjectInput('summary')} placeholder="前台项目卡片和项目笔记页会显示这里" />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-600">项目说明 Markdown</span>
                  <textarea
                    value={projectForm.descriptionMarkdown}
                    onChange={handleProjectInput('descriptionMarkdown')}
                    rows={12}
                    className="min-h-[280px] w-full resize-y rounded-md border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FFFF00]"
                    placeholder="可以写项目背景、功能说明、技术亮点。"
                    spellCheck={false}
                  />
                </label>
              </div>
            </section>
          ) : (
            <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {editorMode === 'preview' ? 'Preview' : 'Blog Editor'}
                    </p>
                    <h2 className="font-black">{editorMode === 'preview' ? '预览博客' : isCreatingNew || !form.id ? '新建博客' : '编辑博客'}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge className="border-none bg-[#FFFF00] font-black text-black">
                        {selectedProject?.title || activePost?.projectTitle || '未选择项目'}
                      </Badge>
                      <Badge variant="secondary" className="border-none bg-slate-100 font-black text-slate-600">
                        {form.category || DEFAULT_BLOG_CATEGORY}
                      </Badge>
                      <StatusBadge status={form.status} />
                      <span className="text-xs font-bold text-slate-400">
                        {form.id ? `博客 ${form.blogOrder || '-'}` : '新的博客草稿'}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2">
                    {editorMode === 'preview' ? (
                      <Button type="button" variant="outline" className="gap-2" onClick={() => setEditorMode('edit')}>
                        <PencilLine className="h-4 w-4" />
                        继续编辑
                      </Button>
                    ) : (
                      <>
                        <Button type="button" variant="outline" className="gap-2" onClick={() => setEditorMode('preview')}>
                          <Eye className="h-4 w-4" />
                          查看预览
                        </Button>
                        <Button type="button" variant="outline" className="gap-2" disabled={isSaving} onClick={() => void save('draft')}>
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          保存草稿
                        </Button>
                      </>
                    )}
                    {form.id && (
                      <Button
                        key="delete-blog"
                        type="button"
                        variant="outline"
                        className="gap-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                        disabled={isSaving}
                        onClick={() => void deleteCurrentPost()}
                      >
                        <Trash2 className="h-4 w-4" />
                        删除博客
                      </Button>
                    )}
                    <Button
                      key="publish-blog"
                      type="button"
                      className="gap-2 bg-slate-950 text-white hover:bg-slate-800"
                      disabled={isSaving}
                      onClick={() => void save('published')}
                    >
                      <Send className="h-4 w-4" />
                      发布
                    </Button>
                  </div>
                </div>
              </div>

              {error && <p className="mx-4 mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p>}

              {editorMode === 'preview' ? (
                <div className="p-4 md:p-5">
                  <article className="mx-auto max-w-4xl rounded-md border border-slate-200 bg-white px-6 py-7 md:px-10 md:py-9">
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                      <Badge className="border-none bg-[#FFFF00] px-3 py-1 font-black text-black">
                        {selectedProject?.title || activePost?.projectTitle || '未选择项目'}
                      </Badge>
                      {form.category && (
                        <Badge variant="secondary" className="border-none bg-slate-100 px-3 py-1 font-black text-slate-600">
                          {form.category}
                        </Badge>
                      )}
                      <Badge className={cn('border-none px-3 py-1 font-black', statusClassName[form.status])}>
                        {statusLabel[form.status]}
                      </Badge>
                    </div>

                    <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-5xl">
                      {form.title || '未命名博客'}
                    </h1>
                    <div className="mt-9 space-y-6 border-t border-slate-100 pt-8">
                      {renderMarkdown(form.contentMarkdown || '')}
                    </div>
                  </article>
                </div>
              ) : (
                <div className="p-4 md:p-5">
                  <div className="space-y-5">
                    <div className="grid gap-3 xl:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]">
                      <label>
                        <span className="mb-2 block text-sm font-bold text-slate-600">博客序号</span>
                        <Input type="number" value={form.blogOrder} onChange={handleInput('blogOrder')} />
                      </label>
                      <label>
                        <span className="mb-2 block text-sm font-bold text-slate-600">标题</span>
                        <Input value={form.title} onChange={handleInput('title')} />
                      </label>
                    </div>

                    <div className="grid gap-3 xl:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]">
                      <label>
                        <span className="mb-2 block text-sm font-bold text-slate-600">博客标签</span>
                        <Input
                          value={form.category}
                          onChange={handleInput('category')}
                          placeholder={DEFAULT_BLOG_CATEGORY}
                        />
                      </label>
                      <label>
                        <span className="mb-2 block text-sm font-bold text-slate-600">所属项目</span>
                        <div className="relative">
                          <select
                            value={form.projectId}
                            onChange={handleInput('projectId')}
                            className="h-10 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-14 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-950"
                          >
                            <option value="">选择项目</option>
                            {projects.map((project) => (
                              <option key={project.id} value={project.id}>{project.title}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-1 right-1 flex w-10 items-center justify-center rounded border-l border-slate-100 bg-white text-slate-500">
                            <ChevronDown className="h-4 w-4" />
                          </div>
                        </div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-md border border-slate-200 bg-white px-4 py-3">
                      <label className="inline-flex cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          checked={form.featuredOnHome}
                          onChange={handleCheckboxInput('featuredOnHome')}
                          className="h-4 w-4 rounded border-slate-300 accent-[#FFFF00]"
                        />
                        <span className="text-sm font-black text-slate-800">展示在首页</span>
                      </label>
                      {form.featuredOnHome && (
                        <Badge className="border-none bg-emerald-50 text-[11px] font-black text-emerald-700">
                          已展示
                        </Badge>
                      )}
                    </div>

                    <section className="rounded-md border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-700">首页卡片封面</p>
                          <p className="mt-1 text-xs font-bold text-slate-400">从本地文件夹选择图片，上传后用于首页博客卡片。</p>
                        </div>
                        <label className={cn(
                          'inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50',
                          !canUploadMedia && 'pointer-events-none opacity-60'
                        )}>
                          {isUploadingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          从本地上传
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/gif,image/webp"
                            className="sr-only"
                            disabled={!canUploadMedia}
                            onChange={(event) => void handleCoverImageUpload(event)}
                          />
                        </label>
                      </div>

                      {!activeBlogPostId ? (
                        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">
                          请先保存草稿，保存后才能从本地上传首页封面。
                        </p>
                      ) : form.coverImageUrl ? (
                        <div className="mt-3 flex items-center gap-3 rounded-md bg-slate-50 p-2">
                          <img
                            src={form.coverImageUrl}
                            alt="首页卡片封面预览"
                            className="h-16 w-24 shrink-0 rounded object-cover"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-700">已设置封面</p>
                            <p className="truncate text-xs font-bold text-slate-400">{form.coverImageUrl}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm font-bold text-slate-400">
                          暂未设置封面，上传后会自动填入当前博客。
                        </p>
                      )}
                    </section>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-slate-600">摘要</span>
                      <textarea
                        value={form.summary}
                        onChange={handleInput('summary')}
                        rows={3}
                        className="w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-sm font-medium leading-6 text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-950"
                      />
                    </label>

                    <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4 text-slate-500" />
                          <span className="text-sm font-black text-slate-700">图片</span>
                        </div>
                        <label className={cn(
                          'inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-100',
                          !canUploadMedia && 'pointer-events-none opacity-60'
                        )}>
                          {isUploadingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          上传图片
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/gif,image/webp"
                            className="sr-only"
                            disabled={!canUploadMedia}
                            onChange={(event) => void handleMediaUpload(event)}
                          />
                        </label>
                      </div>

                      {!activeBlogPostId && (
                        <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700">
                          请先保存草稿，保存后上传的图片会只属于这篇博客。
                        </p>
                      )}

                      {mediaError && (
                        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{mediaError}</p>
                      )}

                      {mediaAssets.length > 0 ? (
                        <div className="grid max-h-64 gap-3 overflow-y-auto sm:grid-cols-2 xl:grid-cols-4">
                          {mediaAssets.slice(0, 12).map((asset) => (
                            <article
                              key={asset.id}
                              className="group overflow-hidden rounded-md border border-slate-200 bg-white transition hover:border-slate-950"
                            >
                              <div className="relative">
                                <img src={asset.url} alt={asset.fileName} className="aspect-video w-full bg-slate-100 object-cover" />
                                <button
                                  type="button"
                                  className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/95 text-slate-500 shadow-sm transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                  title="删除图片"
                                  disabled={mediaActionId === asset.id}
                                  onClick={() => void deleteCurrentMediaAsset(asset)}
                                >
                                  {mediaActionId === asset.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </button>
                              </div>
                              <div className="p-2">
                                <p className="truncate text-xs font-black text-slate-700">{asset.fileName}</p>
                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                  <button
                                    type="button"
                                    className="text-[11px] font-bold text-slate-400 transition hover:text-slate-950"
                                    onClick={() => insertMediaAsset(asset)}
                                  >
                                    插入正文
                                  </button>
                                  <button
                                    type="button"
                                    className="text-[11px] font-bold text-slate-400 transition hover:text-slate-950"
                                    onClick={() => setCoverImageFromAsset(asset)}
                                  >
                                    设为封面
                                  </button>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-slate-400">暂无已上传图片。</p>
                      )}
                    </section>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-slate-600">Markdown 正文</span>
                      <textarea
                        value={form.contentMarkdown}
                        onChange={handleInput('contentMarkdown')}
                        rows={18}
                        className="min-h-[460px] w-full resize-y rounded-md border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#FFFF00]"
                        spellCheck={false}
                      />
                    </label>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
};

export default Admin;
