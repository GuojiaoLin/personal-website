import { useEffect, useState } from 'react';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useSiteAdmin } from '../lib/siteAdmin';
import { cn } from '../lib/utils';
import {
  type CommentRecord,
  createBlogComment,
  fetchBlogComments,
  deleteAdminComment,
  formatCommentDate,
} from '../lib/commentsApi';

interface CommentsProps {
  title?: string;
  description?: string;
  postSlug?: string;
  postProjectSlug?: string;
  postId?: string;
  term?: string;
  className?: string;
}

const getInitial = (name: string) => name.trim().charAt(0).toUpperCase() || 'U';
const ownerReplyName = 'LGj';

const renderInlineMarkdown = (content: string) =>
  content.split('**').map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={`strong-${index}`}>{part}</strong>;
    }

    return part.split('`').map((subPart, subIndex) => (
      subIndex % 2 === 1
        ? <code key={`code-${index}-${subIndex}`} className="rounded bg-slate-100 px-1 py-0.5 text-sm">{subPart}</code>
        : <span key={`text-${index}-${subIndex}`}>{subPart}</span>
    ));
  });

export const Comments = ({
  title = '评论',
  description = '欢迎留下想法，提交后进入后台审核，通过后公开显示。',
  postSlug,
  postProjectSlug,
  postId,
  term,
  className,
}: CommentsProps) => {
  const resolvedPostSlug = postSlug ?? term ?? 'default';
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const { isOwner } = useSiteAdmin();

  useEffect(() => {
    let isCurrent = true;

    const loadComments = async () => {
      setIsLoading(true);
      setError('');

      try {
        const nextComments = await fetchBlogComments(resolvedPostSlug, postProjectSlug);
        if (isCurrent) setComments(nextComments);
      } catch (caughtError) {
        if (isCurrent) {
          setError(caughtError instanceof Error ? caughtError.message : '评论加载失败。');
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadComments();

    return () => {
      isCurrent = false;
    };
  }, [postProjectSlug, resolvedPostSlug]);

  const totalCount = comments.reduce((sum, comment) => sum + 1 + comment.replies.length, 0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice('');
    setError('');

    if (!postId) {
      setError('这篇博客暂时不能提交评论。');
      return;
    }

    setIsSubmitting(true);

    try {
      const createdComment = await createBlogComment({
        postId,
        authorName,
        content,
      });
      setAuthorName('');
      setContent('');
      setComments(await fetchBlogComments(resolvedPostSlug, postProjectSlug));
      setNotice(createdComment.status === 'approved' ? '评论已发布。' : '评论已提交，审核通过后会公开显示。');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '评论提交失败。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (event: React.FormEvent, parentId: string) => {
    event.preventDefault();
    setNotice('');
    setError('');

    if (!postId) {
      setError('这篇博客暂时不能提交回复。');
      return;
    }

    setIsSubmitting(true);

    try {
      const createdReply = await createBlogComment({
        postId,
        parentId,
        authorName: ownerReplyName,
        content: replyContent,
      });
      setReplyingTo(null);
      setReplyContent('');
      setComments(await fetchBlogComments(resolvedPostSlug, postProjectSlug));
      setNotice(createdReply.status === 'approved' ? '回复已发布。' : '回复已提交，审核通过后会公开显示。');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '回复提交失败。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, isRootComment = false) => {
    const confirmed = window.confirm(isRootComment ? '确定删除这条评论及其回复吗？' : '确定删除这条回复吗？');
    if (!confirmed) return;

    setNotice('');
    setError('');
    setIsSubmitting(true);

    try {
      await deleteAdminComment(id);
      setComments(await fetchBlogComments(resolvedPostSlug, postProjectSlug));
      setNotice('内容已删除。');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '删除失败。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={cn('w-full max-w-4xl mx-auto space-y-8 py-12', className)}>
      <div className="border-b border-slate-100 pb-5">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight text-slate-900">
            {title}
            <span className="text-lg font-medium text-slate-400">({totalCount})</span>
          </h2>
          {description && (
            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">{description}</p>
          )}
        </div>
      </div>

      {!postId && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          这篇博客还没有数据库 ID，暂时不能提交评论。
        </div>
      )}

      {(notice || error) && (
        <div className={cn(
          'rounded-2xl border px-4 py-3 text-sm font-bold',
          error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        )}>
          {error || notice}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-4">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-[#FFFF00] font-black text-black">
            {getInitial(authorName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-3">
          <Input
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            placeholder="昵称"
            maxLength={80}
            className="h-11 rounded-xl border-slate-200 font-medium focus-visible:ring-[#FFFF00]"
            disabled={!postId || isSubmitting}
            required
          />
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="写下你的评论..."
            maxLength={2000}
            className="min-h-[104px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#FFFF00] focus:ring-2 focus:ring-[#FFFF00]/30 disabled:cursor-not-allowed disabled:bg-slate-50"
            disabled={!postId || isSubmitting}
            required
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-slate-400">提交后进入后台审核，通过后公开显示。</p>
            <Button
              type="submit"
              disabled={!postId || isSubmitting}
              className="rounded-xl bg-[#FFFF00] px-6 font-black text-black hover:bg-[#FFE000]"
            >
              {isSubmitting ? '提交中...' : '提交评论'}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>

      <div className="space-y-7">
        {isLoading && (
          <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-400">
            正在加载评论...
          </p>
        )}

        {!isLoading && comments.length === 0 && (
          <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-400">
            暂无评论。
          </p>
        )}

        {comments.map((comment) => (
          <article key={comment.id} className="space-y-4">
            <div className="flex gap-4">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-slate-100 font-bold text-slate-900">
                  {getInitial(comment.authorName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold text-slate-900">{comment.authorName}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-medium text-slate-400">
                      {formatCommentDate(comment.createdAt)}
                    </span>
                    {isOwner && (
                      <button
                        type="button"
                        aria-label="删除评论"
                        className="rounded-lg p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isSubmitting}
                        onClick={() => handleDelete(comment.id, true)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-slate-700">
                  {renderInlineMarkdown(comment.content)}
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setReplyingTo((current) => current === comment.id ? null : comment.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-400 transition hover:text-slate-900"
                    disabled={!postId}
                  >
                    <MessageCircle className="h-4 w-4" />
                    回复
                  </button>
                )}

                {isOwner && replyingTo === comment.id && (
                  <form
                    onSubmit={(event) => handleReplySubmit(event, comment.id)}
                    className="mt-4 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Avatar className="h-7 w-7 border border-slate-100">
                        <AvatarFallback className="bg-[#FFFF00] text-[10px] font-black text-black">
                      {getInitial(ownerReplyName)}
                        </AvatarFallback>
                      </Avatar>
                      <span>以 {ownerReplyName} 回复</span>
                    </div>
                    <textarea
                      value={replyContent}
                      onChange={(event) => setReplyContent(event.target.value)}
                      placeholder="写下你的回复..."
                      maxLength={2000}
                      className="min-h-[88px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none transition focus:border-[#FFFF00] focus:ring-2 focus:ring-[#FFFF00]/30"
                      disabled={!postId || isSubmitting}
                      required
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-xl"
                        onClick={() => setReplyingTo(null)}
                      >
                        取消
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-xl bg-slate-900 text-white hover:bg-black"
                      >
                        提交回复
                      </Button>
                    </div>
                  </form>
                )}

                {comment.replies.length > 0 && (
                  <div className="mt-4 space-y-4 border-l-2 border-slate-100 pl-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-slate-50 text-[10px] font-black text-slate-700">
                            {getInitial(reply.authorName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-sm font-bold text-slate-900">{reply.authorName}</span>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-[10px] font-medium text-slate-400">
                                {formatCommentDate(reply.createdAt)}
                              </span>
                              {isOwner && (
                                <button
                                  type="button"
                                  aria-label="删除回复"
                                  className="rounded-lg p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                                  disabled={isSubmitting}
                                  onClick={() => handleDelete(reply.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-500">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
