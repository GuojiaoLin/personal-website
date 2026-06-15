import { requestJson } from './siteApi';

export type CommentTargetType = 'blog' | 'guestbook';
export type CommentStatus = 'pending' | 'approved' | 'hidden';

interface ListResponse<T> {
  items: T[];
}

export interface CommentRecord {
  id: string;
  targetType: CommentTargetType;
  targetId: string | null;
  parentId: string | null;
  authorName: string;
  content: string;
  status: CommentStatus;
  createdAt: string;
  replies: CommentRecord[];
}

interface BlogCommentInput {
  postId: string;
  parentId?: string | null;
  authorName: string;
  content: string;
}

interface GuestbookCommentInput {
  parentId?: string | null;
  authorName: string;
  content: string;
}

export const fetchBlogComments = async (postSlug: string, projectSlug?: string) => {
  const path = projectSlug
    ? `/api/projects/${encodeURIComponent(projectSlug)}/blog-posts/${encodeURIComponent(postSlug)}/comments`
    : `/api/blog-posts/${encodeURIComponent(postSlug)}/comments`;

  return (await requestJson<ListResponse<CommentRecord>>(path)).items;
};

export const fetchGuestbookMessages = async () => (
  await requestJson<ListResponse<CommentRecord>>('/api/comments/guestbook')
).items;

export const createBlogComment = ({
  postId,
  parentId = null,
  authorName,
  content,
}: BlogCommentInput) => requestJson<CommentRecord>('/api/comments', {
  method: 'POST',
  body: JSON.stringify({
    targetType: 'blog',
    targetId: postId,
    parentId,
    authorName,
    content,
  }),
});

export const createGuestbookComment = ({
  parentId = null,
  authorName,
  content,
}: GuestbookCommentInput) => requestJson<CommentRecord>('/api/comments', {
  method: 'POST',
  body: JSON.stringify({
    targetType: 'guestbook',
    targetId: null,
    parentId,
    authorName,
    content,
  }),
});

export const listAdminComments = async () => (
  await requestJson<ListResponse<CommentRecord>>('/api/admin/comments')
).items;

export const approveAdminComment = (id: string) => requestJson<CommentRecord>(`/api/admin/comments/${id}/approve`, {
  method: 'PUT',
});

export const hideAdminComment = (id: string) => requestJson<CommentRecord>(`/api/admin/comments/${id}/hide`, {
  method: 'PUT',
});

export const deleteAdminComment = (id: string) => requestJson<void>(`/api/admin/comments/${id}`, {
  method: 'DELETE',
});

export const formatCommentDate = (date: string) => {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
};
