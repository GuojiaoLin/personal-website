import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileImage,
  Languages,
  Maximize2,
  MessageSquareText,
  ShieldCheck,
  Workflow,
  Wrench,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { BackToTopButton } from '../components/BackToTopButton';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const heroImage = new URL('../../docs/images/项目/多模态智能客服/界面1.png', import.meta.url).href;
const customerServiceLogoImage = new URL('../../docs/images/项目/多模态智能客服/logo.png', import.meta.url).href;
const textImageMouse = new URL('../../docs/images/项目/多模态智能客服/图文输入-1.png', import.meta.url).href;
const textImageAfterSales = new URL('../../docs/images/项目/多模态智能客服/图文输入-3.png', import.meta.url).href;
const manualQuestionImage = new URL('../../docs/images/项目/多模态智能客服/产品手册题1.png', import.meta.url).href;
const englishQuestionImage = new URL('../../docs/images/项目/多模态智能客服/英文题-1.png', import.meta.url).href;
const policyQuestionImage = new URL('../../docs/images/项目/多模态智能客服/通用政策题3.png', import.meta.url).href;
const policyLogisticsImage = new URL('../../docs/images/项目/多模态智能客服/通用政策题2.png', import.meta.url).href;
const manualLibraryImage = new URL('../../docs/images/项目/多模态智能客服/手册页面-1.png', import.meta.url).href;
const manualLibraryChunkImage = new URL('../../docs/images/项目/多模态智能客服/手册页面-2.png', import.meta.url).href;
const manualLibraryPicImage = new URL('../../docs/images/项目/多模态智能客服/手册页面-3.png', import.meta.url).href;
const manualLibraryImageIdImage = new URL('../../docs/images/项目/多模态智能客服/手册页面-4.png', import.meta.url).href;
const manualLibraryRawImage = new URL('../../docs/images/项目/多模态智能客服/手册页面-5.png', import.meta.url).href;
const imageLibraryImage = new URL('../../docs/images/项目/多模态智能客服/界面3.png', import.meta.url).href;
const imageLibraryPageOneImage = new URL('../../docs/images/项目/多模态智能客服/图片页面-1.png', import.meta.url).href;
const imageLibraryPageTwoImage = new URL('../../docs/images/项目/多模态智能客服/图片页面-2.png', import.meta.url).href;
const imagePreviewImage = new URL('../../docs/images/项目/多模态智能客服/图片展示-1.png', import.meta.url).href;
const imagePreviewSecondImage = new URL('../../docs/images/项目/多模态智能客服/图片展示-2.png', import.meta.url).href;
const imagePreviewThirdImage = new URL('../../docs/images/项目/多模态智能客服/图片展示-3.png', import.meta.url).href;

interface ProjectImagePreview {
  title: string;
  description: string;
  image: string;
  gallery?: ProjectImagePreview[];
}

const techStack = [
  'FastAPI',
  'Pydantic v2',
  'OpenAI-compatible API',
  'Qwen-VL',
  'Agentic RAG',
  'SentenceTransformers',
  'FAISS',
  'BM25 + jieba',
  'RRF Fusion',
  'BGE Reranker',
  'HyDE Query Expansion',
  'Redis Session',
  'Trace & Metrics',
  'Quality Guardrails',
];

const featureCards = [
  {
    icon: MessageSquareText,
    title: '多模态客服工作台',
    description: '统一承载文字咨询和图片上传，支持新建会话、历史检索、快捷问题和本地会话清理，方便演示完整客服流程。',
  },
  {
    icon: Wrench,
    title: '图文问题理解',
    description: '对故障图、截图和产品图做分类，提取型号、订单物流、故障现象等线索，用于增强检索和后续回答。',
  },
  {
    icon: BookOpen,
    title: '手册证据问答',
    description: '基于中文和英文产品手册，回答安装、清洁、参数、部件、操作和故障排查问题，让答案尽量有据可查。',
  },
  {
    icon: ShieldCheck,
    title: '复合售后辅助',
    description: '针对退换货、补发、发票、物流异常等问题，先拆分诉求再给处理建议，避免直接承诺赔付结果。',
  },
  {
    icon: FileImage,
    title: '配图引用核验',
    description: '需要图示时，回答正文使用 <PIC> 占位并返回对应图片 ID；前端可预览图片，便于核对引用是否真实存在。',
  },
  {
    icon: CheckCircle2,
    title: '质量检查与观测',
    description: '展示候选 chunk、意图、流水线状态和质量分，并校验事实、图片 ID、语言和风险话术，便于演示和验收。',
  },
];

const workflowSteps = [
  '图像理解：分类故障图、截图或产品图，提取型号、订单、故障描述等线索。',
  '查询增强：把图片线索、会话上下文和用户问题合并成更完整的检索 query。',
  '意图分类：判断产品手册、通用售后或需要澄清的问题类型。',
  '混合检索：融合向量检索、BM25、图片 caption 和 reranker 召回候选依据。',
  '回答生成：结合手册 chunk、候选图片和最近会话生成客服回复。',
  '幻觉与质量检查：校验事实、图片 ID、语言和风险话术，必要时重生成。',
];

const caseImages: ProjectImagePreview[] = [
  {
    title: '图文故障排查',
    description: '上传鼠标实拍图并描述“移动鼠标没反应”后，系统结合图片线索和问题内容，给出电池、接收器、环境干扰、传感器等排查建议。',
    image: textImageMouse,
  },
  {
    title: '多轮售后承接',
    description: '前一轮已咨询随身 WiFi 无信号，后续提出退货诉求时，系统可继承会话上下文，将问题自然转入售后处理流程。',
    image: textImageAfterSales,
  },
  {
    title: '产品手册配图问答',
    description: '针对人体工学椅部件等手册类问题，系统可依据手册内容生成回答，并插入图片占位与可核查的 Manual 图片 ID。',
    image: manualQuestionImage,
  },
  {
    title: '英文手册问答',
    description: '面对英文问题，系统优先检索英文手册，并在回答中保留图片引用和对应图片 ID，便于后续核查。',
    image: englishQuestionImage,
  },
];

const manualLibraryGallery: ProjectImagePreview[] = [
  {
    title: '手册资源库总览',
    description: '查看手册列表、章节目录和资源库统计，快速确认当前手册的图片 ID 与 <PIC> 可用率。',
    image: manualLibraryImage,
  },
  {
    title: 'RAG chunk 查看',
    description: '按 chunk 查看手册内容，方便人工理解检索单位和回答依据。',
    image: manualLibraryChunkImage,
  },
  {
    title: '<PIC> 位置核查',
    description: '核对每个 <PIC> 在原文中的位置、附近文本和对应图片 ID。',
    image: manualLibraryPicImage,
  },
  {
    title: '图片 ID 网格',
    description: '按图片 ID 浏览手册配图，并预览图片是否真实存在。',
    image: manualLibraryImageIdImage,
  },
  {
    title: '手册原文查看',
    description: '回到手册原文核查回答依据，确认模型没有偏离手册内容。',
    image: manualLibraryRawImage,
  },
];

const imageLibraryGallery: ProjectImagePreview[] = [
  {
    title: '图片资源库总览',
    description: '按图片 ID、文件名、分类和格式检索配图，支持分页浏览和复制 ID。',
    image: imageLibraryImage,
  },
  {
    title: '图片资源库分页浏览',
    description: '查看完整配图网格，按分页浏览手册配图并复制图片 ID。',
    image: imageLibraryPageOneImage,
  },
  {
    title: '图片资源库单图筛选',
    description: '输入图片 ID 后筛选目标配图，确认筛选结果、分类数和分页状态。',
    image: imageLibraryPageTwoImage,
  },
];

const imagePreviewGallery: ProjectImagePreview[] = [
  {
    title: '图片预览核查',
    description: '点击回答下方的图片 ID 后，可打开手册配图预览卡片，核对图文证据。',
    image: imagePreviewImage,
  },
  {
    title: 'Manual40_2 配图预览',
    description: '切换回答中的图片 ID，查看不同手册配图是否与回答引用一致。',
    image: imagePreviewSecondImage,
  },
  {
    title: 'Manual40_3 配图预览',
    description: '在同一回答中预览多张候选配图，方便核查图片 ID 和图示内容。',
    image: imagePreviewThirdImage,
  },
];

const resourceImages: ProjectImagePreview[] = [
  {
    title: '手册资源库',
    description: '查看手册列表、章节目录、RAG chunk、原文、图片 ID 和配图可用率。',
    image: manualLibraryImage,
    gallery: manualLibraryGallery,
  },
  {
    title: '图片资源库',
    description: '按图片 ID、文件名、分类和格式检索配图，支持分页浏览和复制 ID。',
    image: imageLibraryImage,
    gallery: imageLibraryGallery,
  },
  {
    title: '图片预览核查',
    description: '点击回答下方的图片 ID 后，可打开手册配图预览卡片，核对图文证据。',
    image: imagePreviewImage,
    gallery: imagePreviewGallery,
  },
];

const ProjectWeb3 = () => {
  const [selectedImage, setSelectedImage] = useState<ProjectImagePreview | null>(null);
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0);
  const activeGallery = selectedImage?.gallery;
  const activeImage = activeGallery ? activeGallery[selectedGalleryIndex] : selectedImage;

  const openImagePreview = (image: ProjectImagePreview) => {
    setSelectedImage(image);
    setSelectedGalleryIndex(0);
  };

  const closeImagePreview = () => {
    setSelectedImage(null);
    setSelectedGalleryIndex(0);
  };

  return (
    <Layout>
      <section className="pt-16 pb-8 px-4">
        <div className="max-w-5xl mx-auto">
          <Link to="/projects">
            <Button variant="ghost" className="mb-6 text-slate-600 hover:bg-slate-100 -ml-4 rounded-full">
              <ArrowLeft className="mr-2 w-4 h-4" /> 返回项目列表
            </Button>
          </Link>

          <div className="mb-10">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shadow-md mb-5 shadow-slate-200">
              <img src={customerServiceLogoImage} alt="多模态电商客服智能体 logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-5 tracking-tight leading-tight">
              多模态电商客服<span className="text-indigo-500">智能体</span>
            </h1>
            <p className="text-base md:text-lg text-slate-500 leading-relaxed mb-6 font-medium max-w-4xl">
              面向电商售前、售后和产品手册问答场景的多模态客服智能体，支持文本咨询、商品图片、故障图片和订单截图等输入。系统通过图片理解、意图分类、查询增强、中文/英文手册检索、混合召回与精排生成客服回复，并对配图引用、事实依据和风险话术进行质量检查。前端将会话、图文输入、资源核查、检索质量、流水线状态和配图预览集中在同一个工作台，便于演示、调试和人工验收。
            </p>
            <div className="flex flex-wrap gap-3">
              {techStack.map((tech) => (
                <Badge key={tech} className="bg-indigo-50 text-indigo-600 border-none px-4 py-1.5 rounded-full font-bold text-sm">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="relative block w-full rounded-[32px] overflow-hidden border-[3px] border-white shadow-xl mb-16 bg-slate-50 group cursor-zoom-in text-left"
            onClick={() => openImagePreview({
              title: '工作台总览',
              description: '客服工作台将会话记录、图文输入、快捷问题、检索与质量面板、手册和图片入口整合在同一界面，方便客服完成咨询处理、问题排查和结果核验。',
              image: heroImage,
            })}
          >
            <img
              src={heroImage}
              className="aspect-[16/9] w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-[1.02]"
              alt="多模态电商客服 Agent 工作台总览"
            />
            <span className="absolute top-5 right-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-slate-900 shadow-lg opacity-0 transition-all group-hover:opacity-100 group-hover:scale-105">
              <Maximize2 className="h-5 w-5" />
            </span>
          </button>

          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Workflow className="w-7 h-7 text-indigo-500" />
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">核心能力</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featureCards.map(({ icon: Icon, title, description }) => (
                <div key={title} className="bg-slate-50 p-6 rounded-[24px] border border-slate-100">
                  <Icon className="w-7 h-7 text-indigo-500 mb-4" />
                  <h3 className="text-lg font-black text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquareText className="w-7 h-7 text-indigo-500" />
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">真实客服场景</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {caseImages.map((item) => (
                <div key={item.title} className="rounded-[24px] border border-slate-100 bg-white overflow-hidden shadow-sm">
                  <button
                    type="button"
                    className="relative block w-full bg-slate-50 aspect-video cursor-zoom-in group/preview"
                    onClick={() => openImagePreview(item)}
                  >
                    <img src={item.image} alt={item.title} loading="lazy" className="w-full h-full object-contain" />
                    <span className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-slate-900 shadow-md opacity-0 transition-all group-hover/preview:opacity-100 group-hover/preview:scale-105">
                      <Maximize2 className="h-5 w-5" />
                    </span>
                  </button>
                  <div className="p-5">
                    <h3 className="text-lg font-black text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-16 grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-8 items-start lg:items-stretch">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <CheckCircle2 className="w-7 h-7 text-indigo-500" />
                <h2 className="text-2xl md:text-3xl font-black text-slate-900">检索与质量链路</h2>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed mb-5">
                右侧质量面板会把 Agent 的关键步骤显示出来，让演示和调试都能看到依据从哪里来、回答是否经过检查。
              </p>
              <div className="space-y-3">
                {workflowSteps.map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-sm font-black flex items-center justify-center">
                      {index + 1}
                    </span>
                    <p className="text-slate-600 font-medium leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6 lg:flex lg:flex-col lg:justify-between lg:space-y-0 lg:pt-14">
              <button
                type="button"
                className="relative block w-full rounded-[28px] overflow-hidden border-[3px] border-white shadow-xl bg-slate-50 group/preview cursor-zoom-in text-left"
                onClick={() => openImagePreview({
                  title: '复杂售后问题拆解',
                  description: '复合售后问题会拆成质量、少发和发票等子问题，并在右侧质量面板展示处理链路。',
                  image: policyQuestionImage,
                })}
              >
                <img src={policyQuestionImage} alt="复杂售后问题拆解与质量面板" loading="lazy" className="aspect-[16/9] w-full h-auto object-cover" />
                <span className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-slate-900 shadow-md opacity-0 transition-all group-hover/preview:opacity-100 group-hover/preview:scale-105">
                  <Maximize2 className="h-5 w-5" />
                </span>
              </button>

              <button
                type="button"
                className="relative block w-full rounded-[28px] overflow-hidden border-[3px] border-white shadow-xl bg-slate-50 group/preview cursor-zoom-in text-left"
                onClick={() => openImagePreview({
                  title: '物流售后处理',
                  description: '针对快递丢失、赔偿和补发等问题，系统会结合售后政策生成处理建议，并在右侧质量面板展示处理链路。',
                  image: policyLogisticsImage,
                })}
              >
                <img src={policyLogisticsImage} alt="物流售后处理与质量面板" loading="lazy" className="aspect-[16/9] w-full h-auto object-cover" />
                <span className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-slate-900 shadow-md opacity-0 transition-all group-hover/preview:opacity-100 group-hover/preview:scale-105">
                  <Maximize2 className="h-5 w-5" />
                </span>
              </button>
            </div>
          </div>

          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <FileImage className="w-7 h-7 text-indigo-500" />
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">手册与图片资源库</h2>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {resourceImages.map((item, index) => (
                <div
                  key={item.title}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center"
                >
                  <button
                    type="button"
                    className={`relative block w-full rounded-[28px] overflow-hidden border-[3px] border-white shadow-xl bg-slate-50 group/preview cursor-zoom-in text-left ${index % 2 === 1 ? 'lg:order-2' : ''}`}
                    onClick={() => openImagePreview(item)}
                  >
                    <img src={item.image} alt={item.title} loading="lazy" className="aspect-[16/9] w-full h-auto object-cover" />
                    <span className="absolute top-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-slate-900 shadow-md opacity-0 transition-all group-hover/preview:opacity-100 group-hover/preview:scale-105">
                      <Maximize2 className="h-5 w-5" />
                    </span>
                  </button>
                  <div className="bg-slate-50 p-6 md:p-8 rounded-[24px] border border-slate-100">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-3">{item.title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative top-16 p-8 md:p-10 bg-indigo-500 rounded-[28px] text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="md:flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Languages className="w-6 h-6" />
                <h2 className="text-2xl font-black">覆盖中英双语、图文咨询与售后服务场景</h2>
              </div>
              <p className="text-indigo-100 font-medium leading-relaxed max-w-4xl">
                这个项目将客服操作台、手册证据库、图片 ID 核验与 Agent 质量检查整合为一套可演示、可核查的工作流，
                完整呈现从真实商品图和自然语言问题输入，到多轮追问、证据检索、配图引用和答案质检的处理链路。
              </p>
            </div>
            <Button asChild className="bg-white text-indigo-600 hover:bg-black hover:text-white rounded-xl px-6 py-5 text-base font-black">
              <Link to="/blog?project=mmcsa">
                查看博客 <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {selectedImage && activeImage && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`${activeImage.title} 图片详情`}
          onClick={closeImagePreview}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-y-auto rounded-[28px] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-slate-900 shadow-lg transition-colors hover:bg-slate-100"
              aria-label="关闭图片详情"
              onClick={closeImagePreview}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative shrink-0 bg-slate-50 px-4 py-4 md:px-6 md:py-6">
              <div className="flex h-[42vh] min-h-[220px] w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-100 md:h-[58vh] md:min-h-[360px]">
                <img
                  key={activeImage.image}
                  src={activeImage.image}
                  alt={activeImage.title}
                  className="h-full w-full object-contain"
                />
              </div>
              {activeGallery && activeGallery.length > 1 && (
                <>
                  <button
                    type="button"
                    className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl bg-white/90 text-slate-900 shadow-lg transition-colors hover:bg-slate-100 md:left-6"
                    aria-label="上一张图片"
                    onClick={() => setSelectedGalleryIndex((current) => (
                      current === 0 ? activeGallery.length - 1 : current - 1
                    ))}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-2xl bg-white/90 text-slate-900 shadow-lg transition-colors hover:bg-slate-100 md:right-6"
                    aria-label="下一张图片"
                    onClick={() => setSelectedGalleryIndex((current) => (
                      current === activeGallery.length - 1 ? 0 : current + 1
                    ))}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            <div className="border-t border-slate-100 p-5 md:p-7">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="mb-2 text-2xl font-black text-slate-900">{activeImage.title}</h3>
                  <p className="text-base font-medium leading-relaxed text-slate-500">{activeImage.description}</p>
                </div>
                {activeGallery && activeGallery.length > 1 && (
                  <div className="flex shrink-0 items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-500">
                    <span>{selectedGalleryIndex + 1}</span>
                    <span>/</span>
                    <span>{activeGallery.length}</span>
                  </div>
                )}
              </div>
              {activeGallery && activeGallery.length > 1 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {activeGallery.map((item, index) => (
                    <button
                      key={item.title}
                      type="button"
                      className={`h-2.5 rounded-full transition-all ${
                        selectedGalleryIndex === index ? 'w-8 bg-indigo-500' : 'w-2.5 bg-slate-200 hover:bg-slate-300'
                      }`}
                      aria-label={`查看${item.title}`}
                      onClick={() => setSelectedGalleryIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <BackToTopButton />
    </Layout>
  );
};

export default ProjectWeb3;
