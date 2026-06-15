import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowRight, Sparkles, Briefcase, Camera, Heart, Code2, UserRound, Footprints, PersonStanding, Cat, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { requestJson } from '../lib/siteApi';

const lifeLensImage = new URL('../../docs/images/微信图片_20260509190424.jpg', import.meta.url).href;
const resumeSceneImage = new URL('../../docs/images/微信图片_20260529165600.jpg', import.meta.url).href;
const resumeCardImage = new URL('../../docs/images/微信图片_20260608142513_56_360.jpg', import.meta.url).href;
const catPortraitImage = new URL('../../docs/images/图册/微信图片_20260529170441.jpg', import.meta.url).href;
const aboutTags = [
  { label: '撸猫', Icon: Cat },
  { label: '散步', Icon: Footprints },
  { label: '逛公园', Icon: PersonStanding },
  { label: '晒太阳', Icon: Sun },
];

interface ListResponse<T> {
  items: T[];
}

interface HomeBlogPostRecord {
  id: string;
  projectSlug: string;
  title: string;
  slug: string;
  category: string;
  coverImageUrl?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const formatHomeBlogDate = (value?: string | null) => {
  if (!value) return '';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);

  return parsed.toISOString().slice(0, 10);
};

const Home = () => {
  const [homeBlogPosts, setHomeBlogPosts] = useState<HomeBlogPostRecord[]>([]);
  const [isLoadingHomeBlogPosts, setIsLoadingHomeBlogPosts] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    const loadHomeBlogPosts = async () => {
      try {
        const response = await requestJson<ListResponse<HomeBlogPostRecord>>('/api/blog-posts/home-featured');
        if (isCurrent) setHomeBlogPosts(response.items);
      } catch {
        if (isCurrent) setHomeBlogPosts([]);
      } finally {
        if (isCurrent) setIsLoadingHomeBlogPosts(false);
      }
    };

    void loadHomeBlogPosts();

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden pt-16 pb-24 px-4">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_14%,#fffef7_32%,#ffffff_68%,#ffffff_100%)]" />
          <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_50%_68%,rgba(255,253,210,0.58)_0%,rgba(255,255,255,0)_64%)]" />
          <div className="absolute left-8 top-24 hidden h-24 w-36 rotate-[-8deg] rounded-[48%_52%_44%_56%/58%_46%_54%_42%] bg-[#fff6a8]/65 lg:block" />
          <div className="absolute right-12 top-28 hidden h-28 w-44 rotate-[10deg] rounded-[42%_58%_46%_54%/46%_52%_48%_54%] bg-[#fff3c7]/70 lg:block" />
          <div className="absolute bottom-10 left-1/2 hidden h-px w-[68rem] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#FFFF00]/35 to-transparent lg:block" />

          <div className="absolute left-[7%] top-72 hidden h-24 w-20 rotate-[-12deg] border-l-2 border-t-2 border-[#facc15]/60 lg:block" />
          <div className="absolute right-[8%] top-64 hidden h-20 w-20 rounded-full border-2 border-[#facc15]/70 lg:block" />
          <div className="absolute left-[31%] top-56 hidden h-16 w-28 rounded-full border-b-2 border-dashed border-[#facc15]/70 lg:block" />
          <div className="absolute right-[18%] top-48 hidden grid-cols-4 gap-2 opacity-60 lg:grid">
            {Array.from({ length: 16 }).map((_, index) => (
              <span key={index} className="h-1.5 w-1.5 rounded-full bg-[#facc15]" />
            ))}
          </div>

          <motion.div
            animate={{ y: [0, -8, 0], rotate: [-7, -4, -7] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="absolute left-[7%] top-56 hidden w-64 rotate-[-7deg] rounded-[24px] border-[10px] border-white bg-white shadow-[0_22px_50px_rgba(15,23,42,0.12)] lg:block"
          >
            <img
              src={resumeSceneImage}
              alt=""
              className="h-44 w-full rounded-[16px] object-cover object-[58%_38%]"
            />
            <div className="flex items-center justify-between px-3 py-3 text-sm font-semibold text-slate-500">
              <span className="font-serif italic">Capture life</span>
              <Heart className="h-4 w-4 text-[#facc15]" />
            </div>
          </motion.div>

          <motion.div
            animate={{ y: [0, 10, 0], rotate: [7, 4, 7] }}
            transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
            className="absolute right-[3%] top-64 hidden w-64 rotate-[7deg] rounded-[24px] border-[8px] border-white bg-slate-900 p-5 shadow-[0_22px_50px_rgba(15,23,42,0.16)] xl:block"
          >
            <div className="mb-4 flex items-center justify-between text-[#FFFF00]">
              <Code2 className="h-5 w-5" />
              <span className="text-xs font-black tracking-[0.28em]">CODE</span>
            </div>
            <div className="space-y-3">
              {['w-3/5 bg-rose-300', 'w-4/5 bg-emerald-300', 'w-2/5 bg-[#FFFF00]', 'w-3/4 bg-sky-300', 'w-1/2 bg-orange-300'].map((line) => (
                <div key={line} className={`h-2 rounded-full ${line}`} />
              ))}
            </div>
          </motion.div>

          <div className="absolute right-[18%] top-[25rem] hidden rotate-[-8deg] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_18px_38px_rgba(15,23,42,0.12)] lg:flex">
            <Camera className="h-5 w-5 text-slate-900" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-700">Lens</span>
          </div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 bg-white border border-slate-100 px-4 py-1.5 rounded-full mb-10 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-[#FFFF00]" />
            <span className="text-sm font-medium text-slate-600">2026年个人作品集</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative isolate mx-auto mb-8 max-w-4xl text-slate-900"
          >
            <Sparkles className="absolute -left-4 top-2 hidden h-8 w-8 rotate-[-16deg] text-[#facc15] sm:block" />
            <Heart className="absolute -right-8 top-20 hidden h-6 w-6 rotate-[18deg] text-[#facc15] xl:block" />
            <span className="block text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-[3.5rem] lg:text-6xl">
              <span className="inline-block -rotate-2 rounded-[1.4rem] px-1">你好呀</span>
              <span className="mx-2 inline-block translate-y-1 rotate-1">，我是</span>
              <span className="relative mx-1 inline-block cursor-default -rotate-1 rounded-[1.6rem] bg-[#FFFF00] px-3 py-1 text-black shadow-lg shadow-[#FFFF00]/20">
                林国娇
                <span className="absolute -bottom-2 left-4 right-4 h-1.5 rounded-full bg-[#facc15]" />
                <span className="absolute -right-4 -top-4 hidden h-6 w-2 rotate-[28deg] rounded-full bg-[#facc15] md:block" />
                <span className="absolute -right-7 top-2 hidden h-2 w-7 rotate-[18deg] rounded-full bg-[#facc15] md:block" />
              </span>
            </span>
            <span className="mt-2 block text-5xl font-black leading-tight tracking-tight sm:text-[3.4rem] md:text-6xl lg:text-7xl">
              <span className="relative inline-block -rotate-1">
                写代码
                <span className="absolute -bottom-1 left-2 right-2 -z-10 h-4 rounded-full bg-[#FFFF00]/45" />
                <Code2 className="absolute -left-8 top-2 hidden h-6 w-6 rotate-[-10deg] text-[#facc15] md:block" />
              </span>
              <span className="mx-1 inline-block rotate-2">，</span>
              <span className="relative inline-block rotate-1">
                也拍人像
                <span className="absolute -bottom-1 left-3 right-3 -z-10 h-4 rounded-full bg-[#fff199]" />
                <Camera className="absolute -right-12 bottom-3 hidden h-6 w-6 rotate-[10deg] text-[#facc15] xl:block" />
              </span>
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-slate-500 max-w-3xl mx-auto mb-10 leading-relaxed font-medium"
          >
            <span className="block">平时做开发、折腾项目，也喜欢用镜头记录让我心动的瞬间。</span>
            <span className="block">这里有我的作品、思考，还有我眼里的生活。</span>
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-5"
          >
            <Link to="/projects">
              <Button className="bg-[#FFFF00] hover:bg-[#FFE000] text-black rounded-xl px-7 py-5 text-base font-bold shadow-lg shadow-[#FFFF00]/30 transition-all hover:scale-105 active:scale-95 group">
                看看我的项目 <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/photography">
              <Button variant="outline" className="border-slate-200 bg-white/50 backdrop-blur-sm text-slate-700 hover:bg-white rounded-xl px-7 py-5 text-base font-bold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95">
                <Camera className="mr-2 w-5 h-5" /> 去看我的照片
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Highlights Grid */}
      <section className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Work & Edu */}
          <motion.div
            whileHover={{ 
              y: -8,
              boxShadow: "0 8px 24px rgba(255, 255, 0, 0.16)",
            }}
            className="relative overflow-hidden h-full p-8 bg-white rounded-[28px] border border-slate-100 shadow-[0_18px_56px_rgba(15,23,42,0.06)] group transition-all duration-300 flex flex-col"
          >
            <div className="absolute -left-20 top-16 h-44 w-44 rounded-full bg-[#FFFF00]/10 blur-3xl" />
            <div className="absolute left-0 top-10 bottom-10 w-1 bg-slate-900 rounded-r-full" />
            <div className="relative z-10 flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-[#FFFF00] rounded-xl flex items-center justify-center shadow-md shadow-[#FFFF00]/20 group-hover:-translate-y-1 transition-transform">
                <Briefcase className="text-black w-6 h-6" />
              </div>
              <Badge className="bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-widest">
                Resume
              </Badge>
            </div>
            <h3 className="relative z-10 text-2xl font-black text-slate-900 mb-5 transition-colors">履历与背景</h3>
            <div className="relative z-10 space-y-5">
              <div className="relative pl-6 border-l-2 border-[#FFFF00] transition-colors">
                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">2022 - 2025</p>
                <p className="font-bold text-slate-800">中国科学院大学 · 计算机技术</p>
              </div>
              <div className="relative pl-6 border-l-2 border-slate-200 transition-colors">
                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">2018 - 2022</p>
                <p className="font-bold text-slate-800">山东科技大学 · 软件工程</p>
              </div>
            </div>
            <div className="relative z-10 mt-8 mb-6 overflow-hidden rounded-3xl border border-slate-100 shadow-md">
              <img
                src={resumeCardImage}
                alt="展柜前生活照"
                className="w-full aspect-[16/9] object-cover object-[58%_46%] transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
            <Link to="/about" className="relative z-10 inline-flex items-center self-start bg-white/90 border border-slate-200 text-slate-900 mt-auto rounded-2xl px-5 py-3 hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-colors font-black text-sm uppercase tracking-wider shadow-sm">
              了解更多详情 <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </motion.div>

          {/* Project Snippet */}
          <motion.div
            whileHover={{ 
              y: -8,
              boxShadow: "0 8px 24px rgba(255, 255, 0, 0.16)",
            }}
            className="relative overflow-hidden h-full p-8 bg-white rounded-[28px] border border-slate-100 shadow-[0_18px_56px_rgba(15,23,42,0.07)] group transition-all duration-300 flex flex-col"
          >
            <div className="absolute inset-x-10 top-0 h-1 bg-slate-900" />
            <div className="absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-[#FFFF00]/10 blur-3xl" />
            <div className="relative z-10 flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-[#FFFF00] rounded-xl flex items-center justify-center shadow-md shadow-[#FFFF00]/20 group-hover:scale-105 transition-transform">
                <Sparkles className="text-black w-6 h-6" />
              </div>
              <Badge className="bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-widest">
                Featured
              </Badge>
            </div>
            <h3 className="relative z-10 text-2xl font-black text-slate-900 mb-4 transition-colors">精选项目</h3>
            <div className="relative z-10 text-slate-500 mb-6 leading-relaxed font-medium space-y-3">
              <p>多模态客服 Agent：面向产品售后场景的多模态智能客服系统，支持文本与图片输入，通过产品手册 RAG 检索生成可追溯的客服回复，并自动处理配图引用、幻觉检测、质量门禁和批量评测提交。</p>
              <p>墨墨知 AI 学术阅读平台：构建论文解析、用户解读、内容社区、搜索推荐的一体化系统，支撑用户对 arXiv 论文进行结构化阅读、个性化分析和知识沉淀。</p>
            </div>
            <div className="relative z-10 grid grid-cols-3 gap-3 mb-6">
              {['AI Agent', 'RAG', 'LangGraph'].map((tag) => (
                <div key={tag} className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-center">
                  <p className="text-slate-900 text-xs font-black">{tag}</p>
                </div>
              ))}
            </div>
            <Link to="/projects" className="relative z-10 inline-flex items-center self-start bg-slate-900 text-white rounded-2xl px-5 py-3 hover:bg-black transition-colors font-black text-sm uppercase tracking-wider shadow-lg shadow-slate-900/10 mt-auto">
              查看全部项目案例 <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </motion.div>

          {/* Photography Preview */}
          <motion.div
            whileHover={{ 
              y: -8,
              boxShadow: "0 8px 24px rgba(255, 255, 0, 0.16)",
            }}
            className="relative overflow-hidden h-full p-8 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] rounded-[28px] border border-slate-100 shadow-[0_18px_56px_rgba(15,23,42,0.07)] group transition-all duration-300 flex flex-col"
          >
            <div className="absolute -right-16 top-12 h-44 w-44 rounded-full bg-[#FFFF00]/10 blur-3xl" />
            <div className="absolute right-10 top-0 h-16 w-1 bg-slate-900 rounded-b-full" />
            <div className="relative z-10 flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-[#FFFF00] rounded-xl flex items-center justify-center shadow-md shadow-[#FFFF00]/20 group-hover:-translate-y-1 transition-transform">
                <Camera className="text-black w-6 h-6" />
              </div>
              <Badge className="bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-widest">
                Lens
              </Badge>
            </div>
            <h3 className="relative z-10 text-2xl font-black text-slate-900 mb-5 transition-colors">生活与快门</h3>
            <p className="relative z-10 text-slate-500 mb-6 leading-relaxed font-medium">
              摄影是记录生活的一种方式，我喜欢靠近大自然和小动物，感受纯粹的爱意互动与捕捉充满生命力的微小瞬间。
            </p>
            <div className="relative z-10 mb-6">
              <img
                src={lifeLensImage}
                alt="小动物相伴的生活摄影"
                className="rounded-3xl w-full aspect-[16/9] object-cover shadow-md ring-2 ring-slate-100 hover:scale-[1.02] transition-transform"
              />
            </div>
            <Link to="/photography" className="relative z-10 inline-flex items-center self-start bg-white/90 border border-slate-200 text-slate-900 rounded-2xl px-5 py-3 hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-colors font-black text-sm uppercase tracking-wider shadow-sm mt-auto">
              进入个人摄影展 <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </motion.div>

        </div>
      </section>

      {/* Blog Preview Section */}
      <section className="px-4 pt-20 pb-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">最近在想什么？</h2>
              <p className="text-slate-500 text-base">分享技术、设计与生活中的点滴思考</p>
            </div>
            <Link to="/blog" className="hidden md:block">
              <Button variant="outline" className="rounded-full border-slate-200 text-slate-700 hover:bg-slate-50">
                查看全部博客 <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {(isLoadingHomeBlogPosts || homeBlogPosts.length > 0) && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {isLoadingHomeBlogPosts ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={`home-blog-skeleton-${index}`} className="animate-pulse">
                    <div className="mb-5 aspect-[4/3] rounded-[24px] bg-slate-100" />
                    <div className="mb-3 h-5 w-4/5 rounded bg-slate-100" />
                    <div className="h-4 w-28 rounded bg-slate-100" />
                  </div>
                ))
              ) : (
                homeBlogPosts.map((post, i) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{
                      y: -8,
                    }}
                    className="group"
                  >
                    <Link to={`/blog?project=${encodeURIComponent(post.projectSlug)}&post=${encodeURIComponent(post.slug)}`} className="block">
                      <div className="relative mb-5 aspect-[4/3] overflow-hidden rounded-[24px] transition-all duration-500">
                        {post.coverImageUrl ? (
                          <img
                            src={post.coverImageUrl}
                            alt={post.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="relative h-full w-full overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#fffef0_52%,#eef6ff_100%)]">
                            <div className="absolute left-6 top-7 h-2 w-28 rounded-full bg-slate-900" />
                            <div className="absolute left-6 top-14 h-2 w-44 rounded-full bg-[#FFFF00]" />
                            <div className="absolute bottom-8 right-8 grid grid-cols-5 gap-2 opacity-60">
                              {Array.from({ length: 25 }).map((_, dotIndex) => (
                                <span key={dotIndex} className="h-1.5 w-1.5 rounded-full bg-[#e8d900]" />
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="absolute top-4 left-4">
                          <Badge className="border-none bg-[#FFFF00] text-black backdrop-blur-sm font-bold shadow-lg shadow-[#FFFF00]/20">
                            {post.category}
                          </Badge>
                        </div>
                        <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <h3 className="mb-2 text-lg font-black leading-snug text-slate-900 transition-colors group-hover:text-[#f7df19]">
                        {post.title}
                      </h3>
                      <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                        {formatHomeBlogDate(post.publishedAt || post.updatedAt || post.createdAt)}
                      </p>
                    </Link>
                  </motion.div>
                ))
              )}
            </div>
          )}

          <div className="mt-12 md:hidden">
            <Link to="/blog">
              <Button className="w-full bg-[#FFFF00] text-black rounded-xl py-6 font-black shadow-lg shadow-[#FFFF00]/20">阅读更多精彩文章</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Life Preview */}
      <section id="about-life" className="relative isolate -mb-20 overflow-hidden bg-white px-4 pt-28 pb-24 md:pt-36 md:pb-[6.25rem]">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_42%,#fffef7_58%,#fbfcff_74%,#fffdf8_88%,#ffffff_100%)]" />
          <div className="absolute inset-x-0 top-0 h-[26rem] bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_48%,rgba(255,253,244,0.58)_74%,rgba(255,255,255,0)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-80 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,253,248,0.84)_54%,#ffffff_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_31%,rgba(255,246,178,0.24)_0%,rgba(255,255,255,0)_28%),radial-gradient(circle_at_88%_31%,rgba(238,246,255,0.50)_0%,rgba(255,255,255,0)_28%)]" />
          <div className="absolute -left-36 bottom-[-14rem] h-72 w-[34rem] rounded-[52%_48%_54%_46%/56%_48%_52%_44%] bg-[#fff9dd]/18" />
          <div className="absolute bottom-[-16rem] left-[32%] h-72 w-[34rem] rotate-[8deg] rounded-[48%_52%_50%_50%/48%_46%_54%_52%] bg-[#f8fbff]/70" />
          <div className="absolute right-[-7rem] bottom-[-8rem] h-80 w-80 rounded-full border border-[#efd97d]/25" />
          <div className="absolute right-12 top-10 hidden grid-cols-5 gap-5 opacity-35 lg:grid">
            {Array.from({ length: 25 }).map((_, index) => (
              <span key={`about-dot-top-${index}`} className="h-1.5 w-1.5 rounded-full bg-[#efd86f]" />
            ))}
          </div>
          <div className="absolute bottom-14 left-[73%] hidden grid-cols-6 gap-4 opacity-20 lg:grid">
            {Array.from({ length: 36 }).map((_, index) => (
              <span key={`about-dot-bottom-${index}`} className="h-1.5 w-1.5 rounded-full bg-[#efd86f]" />
            ))}
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:min-h-[560px] lg:grid-cols-[0.95fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative z-10"
          >
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-[#efdca6] bg-white/70 px-5 py-2.5 text-slate-900 shadow-[0_8px_28px_rgba(214,162,55,0.08)] backdrop-blur">
              <UserRound className="h-5 w-5 text-[#f1bd14]" />
              <span className="text-base font-semibold">About me</span>
            </div>

            <h2 className="relative max-w-[560px] text-4xl font-black leading-[0.98] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl xl:text-[4.2rem]">
              <span className="relative inline-block">
                不仅仅是代码
                <span className="absolute -bottom-2 left-0 right-5 -z-10 h-3 -rotate-[4deg] rounded-full bg-[#FFFF00]" />
                <span className="absolute -right-8 -top-5 hidden h-8 w-2 rotate-[28deg] rounded-full bg-[#FFFF00] lg:block" />
                <span className="absolute -right-13 top-1 hidden h-2 w-8 rotate-[20deg] rounded-full bg-[#FFFF00] lg:block" />
              </span>
            </h2>

            <div className="relative mt-7 max-w-xl pl-10 text-base font-semibold leading-relaxed text-slate-600 md:text-lg">
              <span className="absolute left-0 top-0 font-serif text-5xl leading-none text-[#FFFF00]">“</span>
              <p>
                工作之外，我还是两只小猫的铲屎官。
                <br className="hidden sm:block" />
                平时喜欢撸猫、散步、接触大自然，
                <br className="hidden sm:block" />
                这让我感到放松，也能给我带来新的灵感。
              </p>
              <span className="absolute bottom-[-1.2rem] right-10 font-serif text-5xl leading-none text-[#FFFF00]">”</span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {aboutTags.map(({ label, Icon }) => (
                <div key={label} className="inline-flex h-10 items-center gap-2.5 rounded-full border border-[#eedda9] bg-white/70 px-4 text-slate-800 shadow-[0_8px_22px_rgba(214,162,55,0.07)]">
                  <Icon className="h-4 w-4 text-[#efba12]" />
                  <span className="text-sm font-bold">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center">
              <Link to="/about">
                <Button className="group h-14 rounded-[20px] border-[5px] border-white bg-[#FFFF00] px-7 text-base font-black text-black shadow-[0_14px_32px_rgba(255,255,0,0.20)] transition-all hover:-translate-y-1 hover:bg-[#f3f900] active:translate-y-0">
                  阅读我的故事
                  <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1.5" />
                </Button>
              </Link>

              <div className="relative hidden min-w-40 rotate-[-8deg] pl-10 text-sm font-medium leading-snug text-[#c5a45d] sm:block">
                <span className="absolute left-0 top-2 h-9 w-9 rounded-bl-full border-b-2 border-l-2 border-[#d7bb72]" />
                <span className="block">一起认识</span>
                <span className="block">更真实的我</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="relative z-10 mx-auto w-full max-w-[460px]"
          >
            <Sparkles className="absolute -right-10 top-12 hidden h-7 w-7 text-[#e8c33b] lg:block" />
            <Sparkles className="absolute -right-14 top-22 hidden h-9 w-9 text-[#e8c33b] lg:block" />
            <div className="absolute inset-0 translate-x-3 translate-y-3 rotate-[-3deg] rounded-[32px] bg-[#f6df78]/58" />
            <motion.div
              animate={{ y: [0, -7, 0], rotate: [1.2, -0.5, 1.2] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="relative"
            >
              <img
                src={catPortraitImage}
                alt="我和小猫合影"
                className="aspect-[1.08/1] w-full rounded-[32px] border-[5px] border-white object-cover object-center shadow-[0_18px_36px_rgba(15,23,42,0.13)]"
              />
              <div className="absolute -bottom-4 -left-5 flex h-14 w-14 items-center justify-center rounded-full border-[6px] border-white bg-white shadow-[0_14px_28px_rgba(15,23,42,0.12)]">
                <Heart className="h-7 w-7 text-[#f0c016]" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

    </Layout>
  );
};

export default Home;
