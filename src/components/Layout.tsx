import React, { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Camera, BookOpen, User, FolderHeart, Home, Menu, X, Download, Sparkles, CheckCircle2, MessageCircle, Loader2, LogIn, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { loginAdmin } from '../lib/adminApi';
import { getActiveResumeVersion } from '../lib/resumeApi';
import { useSiteAdmin } from '../lib/siteAdmin';
import { getApiUrl } from '../lib/siteApi';
import { cn } from '../lib/utils';

type DownloadDialogState = {
  status: 'success' | 'error';
  title: string;
  message: string;
};

const Navigation = ({ onDownload, isDownloading }: { onDownload: () => void; isDownloading: boolean }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = React.useState(false);
  const [isAdminLoginSubmitting, setIsAdminLoginSubmitting] = React.useState(false);
  const [adminEmail, setAdminEmail] = React.useState('');
  const [adminPassword, setAdminPassword] = React.useState('');
  const [adminLoginError, setAdminLoginError] = React.useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { isOwner, refreshAdmin } = useSiteAdmin();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: '首页', path: '/', icon: Home },
    { name: '项目经历', path: '/projects', icon: FolderHeart },
    { name: '技术博客', path: '/blog', icon: BookOpen },
    { name: '摄影作品', path: '/photography', icon: Camera },
    { name: '留言', path: '/conversation', icon: MessageCircle },
    { name: '关于我', path: '/about', icon: User },
    { name: isOwner ? '进入后台' : '站主登录', path: '/admin', icon: isOwner ? Shield : LogIn, requiresLogin: true },
  ];

  const getAdminPathWithReturn = () => {
    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    const returnTo = currentPath === '/admin' || currentPath.startsWith('/admin?') ? '/' : currentPath;

    return `/admin?returnTo=${encodeURIComponent(returnTo)}`;
  };

  const openAdminLogin = () => {
    setIsOpen(false);

    if (isOwner) {
      navigate(getAdminPathWithReturn());
      return;
    }

    setAdminLoginError('');
    setIsAdminLoginOpen(true);
  };

  const closeAdminLogin = () => {
    if (isAdminLoginSubmitting) return;
    setIsAdminLoginOpen(false);
    setAdminPassword('');
    setAdminLoginError('');
  };

  const handleAdminLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsAdminLoginSubmitting(true);
    setAdminLoginError('');

    try {
      await loginAdmin(adminEmail, adminPassword);
      await refreshAdmin();
      setAdminPassword('');
      setIsAdminLoginOpen(false);
      navigate(getAdminPathWithReturn());
    } catch (caughtError) {
      setAdminLoginError(caughtError instanceof Error ? caughtError.message : '登录失败。');
    } finally {
      setIsAdminLoginSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isOwner) return;

    setIsAdminLoginOpen(false);
    setAdminPassword('');
    setAdminLoginError('');
  }, [isOwner]);

  return (
    <nav className={cn(
      "sticky top-0 z-50 transition-all duration-300",
      scrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-2" : "bg-transparent py-4"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between lg:justify-center lg:gap-10 lg:translate-x-2 h-16 items-center">
          <Link to="/" className="flex items-center space-x-4 group">
            <div className="w-12 h-12 bg-[#FFFF00] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FFFF00]/30 group-hover:rotate-12 transition-transform duration-300">
              <span className="text-black font-black text-base">LGj</span>
            </div>
            <div className="h-12 flex flex-col justify-center">
              <span className="text-xl font-bold text-slate-900 tracking-tight leading-none">林国娇</span>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">Portfolio 2026</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-1.5 bg-slate-100/50 p-2 rounded-full backdrop-blur-sm">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const itemClassName = cn(
                "rounded-full transition-all duration-300 px-5 text-base",
                isActive
                  ? "!bg-[#FFFF00] hover:!bg-[#FFFF00] active:!bg-[#FFFF00] focus:!bg-[#FFFF00] !text-black hover:!text-black active:!text-black focus:!text-black font-bold shadow-md shadow-[#FFFF00]/25 !ring-0 !border-0 focus-visible:!ring-0 focus-visible:!ring-offset-0"
                  : "text-slate-600 hover:bg-white/70 hover:text-slate-900 hover:shadow-sm"
              );

              if (item.requiresLogin) {
                return (
                  <Button
                    key={item.path}
                    type="button"
                    variant="ghost"
                    aria-haspopup={isOwner ? undefined : 'dialog'}
                    className={itemClassName}
                    onClick={openAdminLogin}
                  >
                    <item.icon className="w-[18px] h-[18px] mr-2" />
                    {item.name}
                  </Button>
                );
              }

              return (
                <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  className={itemClassName}
                >
                  <item.icon className="w-[18px] h-[18px] mr-2" />
                  {item.name}
                </Button>
              </Link>
              );
            })}
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <Button 
              onClick={onDownload}
              disabled={isDownloading}
              className="bg-slate-900 hover:bg-black text-white rounded-full font-bold px-6 text-base group"
            >
              {isDownloading ? (
                <Loader2 className="w-[18px] h-[18px] mr-2 animate-spin" />
              ) : (
                <Download className="w-[18px] h-[18px] mr-2 group-hover:translate-y-0.5 transition-transform" />
              )}
              简历
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="text-slate-900 rounded-full bg-slate-100">
              {isOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white/95 backdrop-blur-lg border-b border-slate-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navItems.map((item) => {
                const itemClassName = cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-2xl text-base font-bold transition-all",
                  location.pathname === item.path
                      ? "!bg-[#FFFF00] hover:!bg-[#FFFF00] active:!bg-[#FFFF00] focus:!bg-[#FFFF00] !text-black hover:!text-black active:!text-black focus:!text-black shadow-md shadow-[#FFFF00]/25 !ring-0 !border-0" 
                      : "text-slate-600 hover:bg-slate-50"
                );

                if (item.requiresLogin) {
                  return (
                    <button
                      key={item.path}
                      type="button"
                      aria-haspopup={isOwner ? undefined : 'dialog'}
                      className={cn(itemClassName, 'w-full text-left')}
                      onClick={openAdminLogin}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className={itemClassName}>
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                </Link>
                );
              })}
              <div className="pt-4">
                <Button 
                  onClick={() => {
                    setIsOpen(false);
                    onDownload();
                  }}
                  disabled={isDownloading}
                  className="w-full bg-black text-white rounded-2xl py-6 font-bold text-lg"
                >
                  {isDownloading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                  下载简历
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdminLoginOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/20 px-4 py-8 backdrop-blur-sm"
            onClick={closeAdminLogin}
          >
            <motion.form
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              onSubmit={(event) => void handleAdminLogin(event)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="nav-admin-login-title"
              className="relative w-full max-w-[360px] rounded-lg border border-slate-200 bg-white p-5 text-left shadow-[0_24px_80px_-48px_rgba(15,23,42,0.75)]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="关闭登录"
                className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-50 hover:text-slate-950 disabled:pointer-events-none disabled:opacity-50"
                disabled={isAdminLoginSubmitting}
                onClick={closeAdminLogin}
              >
                <X className="h-4 w-4" />
              </button>
              <div className="mb-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Admin</p>
                <h1 id="nav-admin-login-title" className="mt-2 text-xl font-black tracking-tight text-slate-950">
                  站主登录
                </h1>
              </div>

              <label className="mb-4 block">
                <span className="mb-2 block text-sm font-bold text-slate-600">邮箱</span>
                <Input
                  value={adminEmail}
                  type="email"
                  autoComplete="email"
                  disabled={isAdminLoginSubmitting}
                  onChange={(event) => setAdminEmail(event.target.value)}
                  required
                />
              </label>

              <label className="mb-5 block">
                <span className="mb-2 block text-sm font-bold text-slate-600">密码</span>
                <Input
                  value={adminPassword}
                  type="password"
                  autoComplete="current-password"
                  disabled={isAdminLoginSubmitting}
                  onChange={(event) => setAdminPassword(event.target.value)}
                  required
                />
              </label>

              {adminLoginError && (
                <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                  {adminLoginError}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-slate-950 text-white hover:bg-slate-800"
                disabled={isAdminLoginSubmitting}
              >
                {isAdminLoginSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                {isAdminLoginSubmitting ? '登录中...' : '登录并进入后台'}
              </Button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-white py-20 mt-20 relative overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 relative z-10">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 bg-[#FFFF00] rounded-2xl flex items-center justify-center shadow-lg mb-8">
          <Sparkles className="text-black w-6 h-6" />
        </div>
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          {[
            { label: 'github', href: 'https://github.com/GuojiaoLin?tab=repositories' },
            { label: 'github-old', href: 'https://github.com/NanGongNingYi/GUME' },
            { label: '小红书', href: 'https://www.xiaohongshu.com/user/profile/5e1747b4000000000100b821' },
          ].map(link => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-black transition-all font-bold tracking-tight hover:-translate-y-1 block">
              {link.label}
            </a>
          ))}
        </div>
        <p className="text-slate-400 text-sm font-medium">© 2026 林国娇个人作品集 · Keep life long learning</p>
        <div className="mt-8">
          <Badge variant="outline" className="border-slate-200 text-slate-400 rounded-full px-4 py-1">
            Stay Hungry, Stay Foolish
          </Badge>
        </div>
      </div>
    </div>
  </footer>
);

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const [downloadDialog, setDownloadDialog] = useState<DownloadDialogState | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);

    try {
      const resume = await getActiveResumeVersion();
      const link = document.createElement('a');
      link.href = getApiUrl(resume.url);
      link.download = resume.fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      setDownloadDialog({
        status: 'success',
        title: '简历下载已开始',
        message: `正在下载「${resume.label}」。如果浏览器没有自动开始，请再次点击简历按钮。`,
      });
    } catch {
      setDownloadDialog({
        status: 'error',
        title: '暂时没有可下载简历',
        message: '站主还没有在后台选择简历版本，或者后台服务暂时不可用。',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-green-100 selection:text-slate-900 relative overflow-x-hidden">
      <Navigation onDownload={handleDownload} isDownloading={isDownloading} />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative z-10"
        >
          <main>{children}</main>
        </motion.div>
      </AnimatePresence>

      <Footer />

      {/* 简历下载反馈弹窗 */}
      <AnimatePresence>
        {downloadDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setDownloadDialog(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[32px] p-10 max-w-sm w-full shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="relative z-10 text-center">
                <div className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg',
                  downloadDialog.status === 'success'
                    ? 'bg-[#FFFF00] text-black shadow-[#FFFF00]/20'
                    : 'bg-red-50 text-red-700 shadow-red-100'
                )}>
                  {downloadDialog.status === 'success' ? (
                    <CheckCircle2 className="w-10 h-10" />
                  ) : (
                    <AlertCircle className="w-10 h-10" />
                  )}
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">{downloadDialog.title}</h3>
                <p className="text-slate-500 font-medium mb-8">
                  {downloadDialog.message}
                </p>
                <Button 
                  onClick={() => setDownloadDialog(null)}
                  className="w-full bg-black text-white hover:bg-slate-800 rounded-2xl py-6 font-bold text-lg"
                >
                  太棒了，知道了
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
