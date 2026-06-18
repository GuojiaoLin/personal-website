import React from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { ExternalLink, Globe, Code, Zap, ArrowRight, MessageCircle, FolderHeart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Project {
  id: number;
  title: string;
  description: string;
  longDescription: string;
  tags: string[];
  image: string;
  logo?: string;
  path: string;
  github: string;
  icon: React.ElementType;
  color: string;
}

const momoOverviewImage = new URL('../../docs/images/项目/墨墨知AI/项目总览-1.png', import.meta.url).href;
const momoLogoImage = new URL('../../docs/images/项目/墨墨知AI/momozhi_cat.png', import.meta.url).href;
const multimodalCustomerServiceImage = new URL('../../docs/images/项目/多模态智能客服/界面1.png', import.meta.url).href;
const multimodalCustomerServiceLogoImage = new URL('../../docs/images/项目/多模态智能客服/logo.png', import.meta.url).href;

const projects: Project[] = [
  {
    id: 1,
    title: '墨墨知AI 论文辅助阅读助手',
    description: '一个面向科研学习者的 AI 论文解析、知识沉淀与研究规划平台。',
    longDescription: '该项目旨在帮助用户更高效地阅读和管理学术论文。用户可以通过 arXiv ID 或论文标题提交单篇/批量解析，获得结构化论文解读、通俗摘要、引用依据和解析记录；同时支持论文收藏、点赞、评论、原创内容发布和个人论文库管理。系统内置 AI 实验室，可基于用户论文库进行科研问答、灵感生成、研究计划拆解，并结合解析、收藏、点赞和评论行为生成科研画像，帮助用户持续沉淀研究方向和阅读偏好。',
    tags: ['Next.js', 'React Native', 'FastAPI', 'Agentic RAG', 'LangGraph'],
    image: momoOverviewImage,
    logo: momoLogoImage,
    path: '/project/momo-ai',
    github: 'https://github.com/GuojiaoLin/momozhi.git',
    icon: Zap,
    color: 'bg-[#FFFF00]'
  },
  {
    id: 2,
    title: '多模态电商客服智能体',
    description: '面向电商售后、产品手册问答和图文故障咨询的 AI 客服 Agent 平台。',
    longDescription: '系统支持用户通过文字、图片或文件上传咨询问题，可自动识别故障图、订单/物流截图、产品型号图和手册插图，提取品牌、型号、订单号、物流状态、故障现象等关键信息。结合中英文产品手册知识库，平台通过多路检索与重排序召回可靠依据，并生成带 <PIC> 图片引用的客服回复。项目内置意图识别、产品确认、问题拆解、幻觉检测、质量自检、会话记忆和指标监控能力，支持多轮问答、批量评测、流式响应和服务端 API 接入。',
    tags: ['Agentic RAG', '多模态视觉理解', 'Hybrid Retrieval & Reranking'],
    image: multimodalCustomerServiceImage,
    logo: multimodalCustomerServiceLogoImage,
    path: '/project/mmcsa',
    github: 'https://github.com/GuojiaoLin/multimodal-customer-service-agent.git',
    icon: Globe,
    color: 'bg-indigo-500'
  }
];

const Projects = () => {
  return (
    <Layout>
      <section className="pt-16 pb-4 px-4 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-32 md:mb-40">
            <div className="h-10 mb-5 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center space-x-2 rounded-full bg-[#FFFF00] px-3.5 py-1.5 text-black shadow-sm shadow-[#FFFF00]/20"
              >
                <FolderHeart className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Project Work</span>
              </motion.div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">把想法慢慢写进代码里</h1>
            <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
              <span className="block">我喜欢把脑子里冒出来的小想法，一点点变成真实可用的软件。</span>
              <span className="mt-3 block">它们不一定是很大的项目，但每一个都藏着我对生活细节的观察：这个需求是不是真实存在？体验还能不能再温柔一点？它能不能在某个时刻，刚好帮到需要它的人。</span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-32 md:gap-40">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-8 lg:gap-12 items-center group/item transition-all duration-500`}
              >
                <div className="relative group w-full lg:basis-[46%] lg:max-w-[460px]">
                  <div className="overflow-hidden rounded-[24px] border-[3px] border-white shadow-lg relative transition-all duration-500">
                    <img
                      src={project.image}
                      alt={project.title}
                      loading="lazy"
                      className="aspect-[16/9] w-full h-auto object-cover origin-center transition-transform duration-1000 group-hover/item:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="w-full space-y-5 lg:basis-[48%] lg:max-w-[520px]">
                  <div className={cn(
                    'rounded-[16px] flex items-center justify-center shadow-lg transition-all group-hover/item:-translate-y-1 group-hover/item:rotate-6 group-hover/item:scale-105',
                    project.logo ? 'w-16 h-16 overflow-hidden bg-white' : `w-12 h-12 ${project.color}`
                  )}>
                    {project.logo ? (
                      <img src={project.logo} alt={`${project.title} logo`} className="w-full h-full object-cover" />
                    ) : (
                      <project.icon className={cn("w-6 h-6", project.color === 'bg-[#FFFF00]' ? 'text-black' : 'text-white')} />
                    )}
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight tracking-tight transition-colors">
                      {project.title}
                    </h2>
                    <p className="text-base md:text-lg text-[#854D0E] font-black italic leading-snug">
                      {project.description}
                    </p>
                  </div>
                  <p className="text-sm md:text-base text-slate-500 leading-relaxed font-medium">
                    {project.longDescription}
                  </p>
                  
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {project.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-slate-100 border-none text-slate-600 px-3 py-1 rounded-full font-bold text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4">
                    <Link to={project.path}>
                      <Button className="bg-[#FFFF00] hover:bg-black hover:text-[#FFFF00] text-black font-black rounded-lg px-5 py-4 text-sm shadow-md shadow-[#FFFF00]/20 transition-all active:scale-95">
                        查看完整案例 <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                    <Button asChild variant="outline" className="border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg px-5 py-4 text-sm font-black transition-all">
                      <a href={project.github} target="_blank" rel="noopener noreferrer">
                        <Code className="mr-2 w-4 h-4" /> 获取源码
                      </a>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-48 md:mt-[12.5rem] mb-6 mx-auto max-w-4xl p-8 md:p-10 lg:p-12 bg-slate-900 rounded-[28px] text-center text-white relative overflow-hidden group">
            <h2 className="text-2xl md:text-4xl font-black mb-4 tracking-tight">你也对我做的事好奇嘛？</h2>
            <p className="text-slate-400 mb-7 text-sm md:text-base max-w-xl mx-auto font-medium leading-relaxed">
              <span className="block">我一直想找一群同频、有趣、真诚的小伙伴儿，</span>
              <span className="block">一起做点有意思的项目，快来和我互动吧~</span>
            </p>
            <Link to="/conversation">
              <Button className="bg-[#FFFF00] hover:bg-white text-black rounded-lg px-7 py-5 text-base font-black shadow-lg shadow-[#FFFF00]/20 transition-all hover:scale-105 active:scale-95">
                <MessageCircle className="mr-2.5 w-5 h-5" />
                立即开始对话
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};
export default Projects;
