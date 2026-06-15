import { useEffect, useState } from 'react';
import { Clock, MessageCircle, Send, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useSiteAdmin } from '../lib/siteAdmin';
import { cn } from '../lib/utils';
import {
  type CommentRecord,
  createGuestbookComment,
  deleteAdminComment,
  fetchGuestbookMessages,
  formatCommentDate,
} from '../lib/commentsApi';

const getInitial = (name: string) => name.trim().charAt(0).toUpperCase() || 'U';
const ownerReplyName = 'LGj';

export const GuestbookBoard = () => {
  const [messages, setMessages] = useState<CommentRecord[]>([]);
  const [name, setName] = useState('');
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

    const loadMessages = async () => {
      setIsLoading(true);
      setError('');

      try {
        const nextMessages = await fetchGuestbookMessages();
        if (isCurrent) setMessages(nextMessages);
      } catch (caughtError) {
        if (isCurrent) {
          setError(caughtError instanceof Error ? caughtError.message : '留言加载失败。');
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    loadMessages();

    return () => {
      isCurrent = false;
    };
  }, []);

  const totalCount = messages.reduce((sum, message) => sum + 1 + message.replies.length, 0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice('');
    setError('');
    setIsSubmitting(true);

    try {
      const createdMessage = await createGuestbookComment({
        authorName: name,
        content,
      });
      setName('');
      setContent('');
      setMessages(await fetchGuestbookMessages());
      setNotice(createdMessage.status === 'approved' ? '留言已发布。' : '留言已提交，审核通过后会公开显示。');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '留言提交失败。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (event: React.FormEvent, parentId: string) => {
    event.preventDefault();
    setNotice('');
    setError('');
    setIsSubmitting(true);

    try {
      const createdReply = await createGuestbookComment({
        parentId,
        authorName: ownerReplyName,
        content: replyContent,
      });
      setReplyingTo(null);
      setReplyContent('');
      setMessages(await fetchGuestbookMessages());
      setNotice(createdReply.status === 'approved' ? '回复已发布。' : '回复已提交，审核通过后会公开显示。');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '回复提交失败。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, isRootMessage = false) => {
    const confirmed = window.confirm(isRootMessage ? '确定删除这条留言及其回复吗？' : '确定删除这条回复吗？');
    if (!confirmed) return;

    setNotice('');
    setError('');
    setIsSubmitting(true);

    try {
      await deleteAdminComment(id);
      setMessages(await fetchGuestbookMessages());
      setNotice('内容已删除。');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '删除失败。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-14">
      <div className="space-y-6">
        <div className="text-center">
          <div className="mb-5 flex h-10 items-center justify-center">
            <Badge className="gap-2 border-none bg-[#FFFF00] px-3.5 py-1.5 text-black shadow-sm shadow-[#FFFF00]/20">
              <MessageCircle className="h-4 w-4" />
              <span className="font-black tracking-widest uppercase text-[10px]">Guestbook</span>
            </Badge>
          </div>
          <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl">留言板</h1>
          <p className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-slate-500 md:text-lg">
            写下你的想法，提交后进入后台审核，通过后公开显示。
          </p>
        </div>

        {(notice || error) && (
          <div className={cn(
            'rounded-2xl border px-4 py-3 text-sm font-bold',
            error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          )}>
            {error || notice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md md:p-6">
          <div className="space-y-4">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="写下你的留言..."
              maxLength={2000}
              className="min-h-[124px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#FFFF00] focus:ring-2 focus:ring-[#FFFF00]/30 disabled:cursor-not-allowed disabled:bg-slate-50"
              disabled={isSubmitting}
              required
            />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="昵称"
                maxLength={80}
                className="h-11 rounded-xl border-slate-200 font-medium focus-visible:ring-[#FFFF00] sm:w-64"
                disabled={isSubmitting}
                required
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-[#FFFF00] px-8 font-black text-black hover:bg-[#FFE000]"
              >
                {isSubmitting ? '提交中...' : '提交留言'}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-900">
            最新留言
            <span className="text-sm font-medium text-slate-400">({totalCount})</span>
          </h2>
        </div>

        <div className="space-y-4">
          {isLoading && (
            <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-400">
              正在加载留言...
            </p>
          )}

          {!isLoading && messages.length === 0 && (
            <p className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-400">
              暂无留言。
            </p>
          )}

          {messages.map((message) => (
            <article key={message.id} className="group relative overflow-hidden rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="absolute bottom-0 left-0 top-0 w-1 bg-[#FFFF00] opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="flex gap-4">
                <Avatar className="h-10 w-10 border border-slate-100">
                  <AvatarFallback className="bg-[#FFFF00]/15 font-black text-[#854D0E]">
                    {getInitial(message.authorName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-black text-slate-900">{message.authorName}</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                        <Clock className="h-3 w-3" />
                        {formatCommentDate(message.createdAt)}
                      </span>
                      {isOwner && (
                        <button
                          type="button"
                          aria-label="删除留言"
                          className="rounded-lg p-1 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isSubmitting}
                          onClick={() => handleDelete(message.id, true)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{message.content}</p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setReplyingTo((current) => current === message.id ? null : message.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-400 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      <MessageCircle className="h-4 w-4" />
                      回复
                    </button>
                  )}

                  {isOwner && replyingTo === message.id && (
                    <form
                      onSubmit={(event) => handleReplySubmit(event, message.id)}
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
                        disabled={isSubmitting}
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
                          {isSubmitting ? '提交中...' : '提交回复'}
                        </Button>
                      </div>
                    </form>
                  )}

                  {message.replies.length > 0 && (
                    <div className="mt-4 space-y-4 border-l-2 border-slate-100 pl-4">
                      {message.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <Avatar className="h-8 w-8 shrink-0 border border-slate-100">
                            <AvatarFallback className="bg-[#FFFF00]/10 text-[10px] font-black text-[#854D0E]">
                              {getInitial(reply.authorName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <span className="text-sm font-bold text-slate-900">{reply.authorName}</span>
                              <div className="flex items-center gap-2">
                                <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                                  <Clock className="h-3 w-3" />
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
                            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
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
      </div>
    </div>
  );
};
