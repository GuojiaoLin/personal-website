import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, Shield, X } from 'lucide-react';
import { loginAdmin } from '../lib/adminApi';
import { signOutSiteAdmin } from '../lib/siteAdmin';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface SiteAdminControlsProps {
  isAuthReady: boolean;
  isOwner: boolean;
  adminHref?: string;
  ownerEmail?: string;
  onError: (message: string) => void;
  onNotice: (message: string) => void;
  onSignedIn?: () => void | Promise<void>;
  onSignedOut?: () => void | Promise<void>;
}

export const SiteAdminControls = ({
  isAuthReady,
  isOwner,
  adminHref = '/admin',
  ownerEmail,
  onError,
  onNotice,
  onSignedIn,
  onSignedOut,
}: SiteAdminControlsProps) => {
  const location = useLocation();
  const [isBusy, setIsBusy] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signedOutNotice, setSignedOutNotice] = useState(false);

  const adminHrefWithReturnTo = useMemo(() => {
    if (adminHref.includes('returnTo=')) return adminHref;

    const returnTo = `${location.pathname}${location.search}`;
    if (!returnTo || returnTo === '/admin' || returnTo.startsWith('/admin?')) return adminHref;

    const separator = adminHref.includes('?') ? '&' : '?';
    return `${adminHref}${separator}returnTo=${encodeURIComponent(returnTo)}`;
  }, [adminHref, location.pathname, location.search]);

  const handleSignOut = async () => {
    setIsBusy(true);
    setSignedOutNotice(false);
    onError('');
    onNotice('');

    try {
      await signOutSiteAdmin();
      setSignedOutNotice(true);
      await onSignedOut?.();
    } catch (caughtError) {
      onError(caughtError instanceof Error ? caughtError.message : '退出失败。');
    } finally {
      setIsBusy(false);
    }
  };

  const openLogin = () => {
    setLoginError('');
    setSignedOutNotice(false);
    onError('');
    onNotice('');
    setIsLoginOpen(true);
  };

  const closeLogin = () => {
    if (isLoginSubmitting) return;
    setIsLoginOpen(false);
    setPassword('');
    setLoginError('');
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoginSubmitting(true);
    setLoginError('');
    onError('');
    onNotice('');

    try {
      await loginAdmin(email, password);
      setPassword('');
      setIsLoginOpen(false);
      await onSignedIn?.();
    } catch (caughtError) {
      setLoginError(caughtError instanceof Error ? caughtError.message : '登录失败。');
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      setSignedOutNotice(false);
      setIsLoginOpen(false);
    }
  }, [isOwner]);

  if (!isAuthReady) return null;

  if (isOwner) {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-bold text-emerald-700 sm:flex-nowrap">
        <Shield className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">站主模式</span>
        {ownerEmail && (
          <span className="hidden max-w-[160px] truncate text-slate-400 md:inline-block">
            {ownerEmail}
          </span>
        )}
        <Button
          asChild
          type="button"
          variant="outline"
          size="sm"
          className="h-7 shrink-0 rounded-xl px-3 text-xs text-slate-600 hover:text-slate-950"
        >
          <Link to={adminHrefWithReturnTo}>进入后台</Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 rounded-xl px-3 text-xs text-slate-500 hover:text-slate-900"
          disabled={isBusy}
          onClick={() => void handleSignOut()}
        >
          退出
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 rounded-lg px-2 text-xs font-bold text-slate-400 hover:text-slate-900"
        onClick={openLogin}
      >
        <LogIn className="mr-1.5 h-3.5 w-3.5" />
        站主登录
      </Button>
      {signedOutNotice && (
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
          站主已退出。
        </span>
      )}
      {isLoginOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 px-4 py-8 backdrop-blur-sm"
          onClick={closeLogin}
        >
          <form
            onSubmit={(event) => void handleLogin(event)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-admin-login-title"
            className="relative w-full max-w-[360px] rounded-lg border border-slate-200 bg-white p-5 text-left shadow-[0_24px_80px_-48px_rgba(15,23,42,0.75)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="关闭登录"
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-50 hover:text-slate-950 disabled:pointer-events-none disabled:opacity-50"
              disabled={isLoginSubmitting}
              onClick={closeLogin}
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-5">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Admin</p>
              <h1 id="site-admin-login-title" className="mt-2 text-xl font-black tracking-tight text-slate-950">
                站主登录
              </h1>
            </div>

            <label className="mb-4 block">
              <span className="mb-2 block text-sm font-bold text-slate-600">邮箱</span>
              <Input
                value={email}
                type="email"
                autoComplete="email"
                disabled={isLoginSubmitting}
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
                disabled={isLoginSubmitting}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {loginError && (
              <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                {loginError}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-slate-950 text-white hover:bg-slate-800"
              disabled={isLoginSubmitting}
            >
              {isLoginSubmitting ? '登录中...' : '登录'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
