import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileImage,
  type LucideIcon,
  Maximize2,
  MessageCircle,
  MessageSquareText,
  MonitorSmartphone,
  Search,
  Server,
  Settings,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { BackToTopButton } from '../components/BackToTopButton';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

const momoOverviewImage = new URL('../../docs/images/项目/墨墨知AI/项目总览-1.png', import.meta.url).href;
const momoOverviewSecondImage = new URL('../../docs/images/项目/墨墨知AI/项目总览-2.png', import.meta.url).href;
const momoOverviewThirdImage = new URL('../../docs/images/项目/墨墨知AI/项目总览-3.png', import.meta.url).href;
const momoLogoImage = new URL('../../docs/images/项目/墨墨知AI/momozhi_cat.png', import.meta.url).href;
const searchImage = new URL('../../docs/images/项目/墨墨知AI/搜索-1.png', import.meta.url).href;
const searchSecondImage = new URL('../../docs/images/项目/墨墨知AI/搜索-2.png', import.meta.url).href;
const parseInputImage = new URL('../../docs/images/项目/墨墨知AI/论文解析-1.png', import.meta.url).href;
const parseInputFilledImage = new URL('../../docs/images/项目/墨墨知AI/论文解析-2.png', import.meta.url).href;
const parseRecognizingImage = new URL('../../docs/images/项目/墨墨知AI/论文解析-3.png', import.meta.url).href;
const parseQueueImage = new URL('../../docs/images/项目/墨墨知AI/论文解析-4.png', import.meta.url).href;
const parseTaskListImage = new URL('../../docs/images/项目/墨墨知AI/论文解析-5.png', import.meta.url).href;
const parseResultImage = new URL('../../docs/images/项目/墨墨知AI/论文解析-6.png', import.meta.url).href;
const plainReadImage = new URL('../../docs/images/项目/墨墨知AI/论文详情-通俗1.png', import.meta.url).href;
const plainReadTwoImage = new URL('../../docs/images/项目/墨墨知AI/论文详情-通俗2.png', import.meta.url).href;
const plainReadSecondImage = new URL('../../docs/images/项目/墨墨知AI/论文详情-通俗3.png', import.meta.url).href;
const plainReadFourImage = new URL('../../docs/images/项目/墨墨知AI/论文详情-通俗4.png', import.meta.url).href;
const plainReadFiveImage = new URL('../../docs/images/项目/墨墨知AI/论文详情-通俗5.png', import.meta.url).href;
const deepReadImage = new URL('../../docs/images/项目/墨墨知AI/论文详情-深度1.png', import.meta.url).href;
const deepReadTwoImage = new URL('../../docs/images/项目/墨墨知AI/论文详情-深度2.png', import.meta.url).href;
const deepReadThreeImage = new URL('../../docs/images/项目/墨墨知AI/论文详情-深度3.png', import.meta.url).href;
const deepReadFourImage = new URL('../../docs/images/项目/墨墨知AI/论文详情-深度4.png', import.meta.url).href;
const deepReadSecondImage = new URL('../../docs/images/项目/墨墨知AI/论文详情-深度5.png', import.meta.url).href;
const deepReadSixImage = new URL('../../docs/images/项目/墨墨知AI/论文详情-深度6.png', import.meta.url).href;
const deepReadEightImage = new URL('../../docs/images/项目/墨墨知AI/论文详情-深度8.png', import.meta.url).href;
const paperAiReadingOneImage = new URL('../../docs/images/项目/墨墨知AI/论文详情页AI-1.png', import.meta.url).href;
const paperAiReadingTwoImage = new URL('../../docs/images/项目/墨墨知AI/论文详情页AI-2.png', import.meta.url).href;
const paperAiReadingThreeImage = new URL('../../docs/images/项目/墨墨知AI/论文详情页AI-3.png', import.meta.url).href;
const paperAiReadingFourImage = new URL('../../docs/images/项目/墨墨知AI/论文详情页AI-4.png', import.meta.url).href;
const aiLabOneImage = new URL('../../docs/images/项目/墨墨知AI/AI实验室-1.png', import.meta.url).href;
const aiLabTwoImage = new URL('../../docs/images/项目/墨墨知AI/AI实验室-2.png', import.meta.url).href;
const aiLabThreeImage = new URL('../../docs/images/项目/墨墨知AI/AI实验室-3.png', import.meta.url).href;
const aiLabFourImage = new URL('../../docs/images/项目/墨墨知AI/AI实验室-4.png', import.meta.url).href;
const aiLabFiveImage = new URL('../../docs/images/项目/墨墨知AI/AI-实验室-5.png', import.meta.url).href;
const aiLabImage = new URL('../../docs/images/项目/墨墨知AI/AI实验室-6.png', import.meta.url).href;
const aiLabSevenImage = new URL('../../docs/images/项目/墨墨知AI/AI实验室-7.png', import.meta.url).href;
const aiLabEightImage = new URL('../../docs/images/项目/墨墨知AI/AI实验室-8.png', import.meta.url).href;
const aiLabNineImage = new URL('../../docs/images/项目/墨墨知AI/AI实验室-9.png', import.meta.url).href;
const aiLabReplyOneImage = new URL('../../docs/images/项目/墨墨知AI/AI实验室-回复1.png', import.meta.url).href;
const aiLabReplyImage = new URL('../../docs/images/项目/墨墨知AI/AI实验室-回复2.png', import.meta.url).href;
const aiLabReplyThreeImage = new URL('../../docs/images/项目/墨墨知AI/AI实验室-回复3.png', import.meta.url).href;
const aiLabReplyFourImage = new URL('../../docs/images/项目/墨墨知AI/AI实验室-回复4.png', import.meta.url).href;
const aiLabReplyFiveImage = new URL('../../docs/images/项目/墨墨知AI/AI实验室-回复5.png', import.meta.url).href;
const aiLabReplySixImage = new URL('../../docs/images/项目/墨墨知AI/AI实验室-回复6.png', import.meta.url).href;
const publishOneImage = new URL('../../docs/images/项目/墨墨知AI/发布-1.png', import.meta.url).href;
const publishTwoImage = new URL('../../docs/images/项目/墨墨知AI/发布-2.png', import.meta.url).href;
const publishImage = new URL('../../docs/images/项目/墨墨知AI/发布-3.png', import.meta.url).href;
const publishFourImage = new URL('../../docs/images/项目/墨墨知AI/发布-4.png', import.meta.url).href;
const researchProfileImage = new URL('../../docs/images/项目/墨墨知AI/科研画像-0.png', import.meta.url).href;
const researchProfileOneImage = new URL('../../docs/images/项目/墨墨知AI/科研画像-1.png', import.meta.url).href;
const researchProfileDetailImage = new URL('../../docs/images/项目/墨墨知AI/科研画像-2.png', import.meta.url).href;
const researchProfileThreeImage = new URL('../../docs/images/项目/墨墨知AI/科研画像-3.png', import.meta.url).href;
const personalHomeImage = new URL('../../docs/images/项目/墨墨知AI/我的.png', import.meta.url).href;
const likedRecordImage = new URL('../../docs/images/项目/墨墨知AI/点赞.png', import.meta.url).href;
const collectionImage = new URL('../../docs/images/项目/墨墨知AI/收藏.png', import.meta.url).href;
const commentImage = new URL('../../docs/images/项目/墨墨知AI/评论.png', import.meta.url).href;
const backendAdminOneImage = new URL('../../docs/images/项目/墨墨知AI后台管理系统/Snipaste_2026-06-02_16-52-24.png', import.meta.url).href;
const backendAdminTwoImage = new URL('../../docs/images/项目/墨墨知AI后台管理系统/Snipaste_2026-06-02_16-52-38.png', import.meta.url).href;
const backendAdminThreeImage = new URL('../../docs/images/项目/墨墨知AI后台管理系统/Snipaste_2026-06-02_16-52-50.png', import.meta.url).href;
const backendAdminFourImage = new URL('../../docs/images/项目/墨墨知AI后台管理系统/Snipaste_2026-06-02_16-53-00.png', import.meta.url).href;
const backendAdminFiveImage = new URL('../../docs/images/项目/墨墨知AI后台管理系统/Snipaste_2026-06-02_16-53-11.png', import.meta.url).href;
const backendAdminSixImage = new URL('../../docs/images/项目/墨墨知AI后台管理系统/Snipaste_2026-06-02_16-53-18.png', import.meta.url).href;
const backendAdminSevenImage = new URL('../../docs/images/项目/墨墨知AI后台管理系统/Snipaste_2026-06-02_16-53-26.png', import.meta.url).href;
const mobileAppOneImage = new URL('../../docs/images/项目/墨墨知AI移动端/Screenshot_2026-06-02-16-46-40-640_host.exp.exponent.jpg', import.meta.url).href;
const mobileAppTwoImage = new URL('../../docs/images/项目/墨墨知AI移动端/Screenshot_2026-06-02-16-46-43-388_host.exp.exponent.jpg', import.meta.url).href;
const mobileAppThreeImage = new URL('../../docs/images/项目/墨墨知AI移动端/Screenshot_2026-06-02-17-20-35-673_host.exp.exponent.jpg', import.meta.url).href;
const mobileAppFourImage = new URL('../../docs/images/项目/墨墨知AI移动端/Screenshot_2026-06-02-17-20-41-659_host.exp.exponent.jpg', import.meta.url).href;
const mobileAppFiveImage = new URL('../../docs/images/项目/墨墨知AI移动端/Screenshot_2026-06-02-17-20-50-653_host.exp.exponent.jpg', import.meta.url).href;
const mobileAppSixImage = new URL('../../docs/images/项目/墨墨知AI移动端/Screenshot_2026-06-02-17-21-14-300_host.exp.exponent.jpg', import.meta.url).href;
const mobileAppSevenImage = new URL('../../docs/images/项目/墨墨知AI移动端/Screenshot_2026-06-02-17-21-19-811_host.exp.exponent.jpg', import.meta.url).href;
const mobileAppEightImage = new URL('../../docs/images/项目/墨墨知AI移动端/Screenshot_2026-06-02-17-21-25-458_host.exp.exponent.jpg', import.meta.url).href;
const mobileAppNineImage = new URL('../../docs/images/项目/墨墨知AI移动端/Screenshot_2026-06-02-17-21-29-948_host.exp.exponent.jpg', import.meta.url).href;
const mobileAppTenImage = new URL('../../docs/images/项目/墨墨知AI移动端/Screenshot_2026-06-02-17-21-34-545_host.exp.exponent.jpg', import.meta.url).href;
const mobileAppElevenImage = new URL('../../docs/images/项目/墨墨知AI移动端/Screenshot_2026-06-02-17-21-39-341_host.exp.exponent.jpg', import.meta.url).href;
const mobileAppTwelveImage = new URL('../../docs/images/项目/墨墨知AI移动端/Screenshot_2026-06-02-17-21-45-317_host.exp.exponent.jpg', import.meta.url).href;
const mobileAppThirteenImage = new URL('../../docs/images/项目/墨墨知AI移动端/Screenshot_2026-06-02-17-21-48-795_host.exp.exponent.jpg', import.meta.url).href;

interface ProjectImagePreview {
  title: string;
  description: string;
  image: string;
  gallery?: ProjectImagePreview[];
}

interface ArchitectureItem {
  icon: LucideIcon;
  title: string;
  description: string;
  gallery?: ProjectImagePreview[];
}

const mobileAppGallery: ProjectImagePreview[] = [
  {
    title: '移动端 01',
    description: '移动端截图，展示墨墨知 AI 在手机端的高频使用场景。',
    image: mobileAppOneImage,
  },
  {
    title: '移动端 02',
    description: '移动端截图，展示墨墨知 AI 在手机端的高频使用场景。',
    image: mobileAppTwoImage,
  },
  {
    title: '移动端 03',
    description: '移动端截图，展示墨墨知 AI 在手机端的高频使用场景。',
    image: mobileAppThreeImage,
  },
  {
    title: '移动端 04',
    description: '移动端截图，展示墨墨知 AI 在手机端的高频使用场景。',
    image: mobileAppFourImage,
  },
  {
    title: '移动端 05',
    description: '移动端截图，展示墨墨知 AI 在手机端的高频使用场景。',
    image: mobileAppFiveImage,
  },
  {
    title: '移动端 06',
    description: '移动端截图，展示墨墨知 AI 在手机端的高频使用场景。',
    image: mobileAppSixImage,
  },
  {
    title: '移动端 07',
    description: '移动端截图，展示墨墨知 AI 在手机端的高频使用场景。',
    image: mobileAppSevenImage,
  },
  {
    title: '移动端 08',
    description: '移动端截图，展示墨墨知 AI 在手机端的高频使用场景。',
    image: mobileAppEightImage,
  },
  {
    title: '移动端 09',
    description: '移动端截图，展示墨墨知 AI 在手机端的高频使用场景。',
    image: mobileAppNineImage,
  },
  {
    title: '移动端 10',
    description: '移动端截图，展示墨墨知 AI 在手机端的高频使用场景。',
    image: mobileAppTenImage,
  },
  {
    title: '移动端 11',
    description: '移动端截图，展示墨墨知 AI 在手机端的高频使用场景。',
    image: mobileAppElevenImage,
  },
  {
    title: '移动端 12',
    description: '移动端截图，展示墨墨知 AI 在手机端的高频使用场景。',
    image: mobileAppTwelveImage,
  },
  {
    title: '移动端 13',
    description: '移动端截图，展示墨墨知 AI 在手机端的高频使用场景。',
    image: mobileAppThirteenImage,
  },
];

const backendAdminGallery: ProjectImagePreview[] = [
  {
    title: '后台管理系统 01',
    description: '后台管理系统截图，展示墨墨知 AI 的运营与管理能力。',
    image: backendAdminOneImage,
  },
  {
    title: '后台管理系统 02',
    description: '后台管理系统截图，展示墨墨知 AI 的运营与管理能力。',
    image: backendAdminTwoImage,
  },
  {
    title: '后台管理系统 03',
    description: '后台管理系统截图，展示墨墨知 AI 的运营与管理能力。',
    image: backendAdminThreeImage,
  },
  {
    title: '后台管理系统 04',
    description: '后台管理系统截图，展示墨墨知 AI 的运营与管理能力。',
    image: backendAdminFourImage,
  },
  {
    title: '后台管理系统 05',
    description: '后台管理系统截图，展示墨墨知 AI 的运营与管理能力。',
    image: backendAdminFiveImage,
  },
  {
    title: '后台管理系统 06',
    description: '后台管理系统截图，展示墨墨知 AI 的运营与管理能力。',
    image: backendAdminSixImage,
  },
  {
    title: '后台管理系统 07',
    description: '后台管理系统截图，展示墨墨知 AI 的运营与管理能力。',
    image: backendAdminSevenImage,
  },
];

const techStack = [
  'Next.js',
  'React Native',
  'FastAPI',
  'AI Service',
  'LangGraph',
  'LightRAG',
  'Milvus',
  'MongoDB',
  'MinIO',
  'MySQL',
  'Redis',
  'RabbitMQ',
  'Docker',
  'Nginx',
  'Admin Console',
];

const discoverySearchGallery: ProjectImagePreview[] = [
  {
    title: '首页推荐',
    description: '首页把频道、热门内容、论文卡片和互动数据放在同一视图里，适合长期浏览和持续发现。',
    image: momoOverviewImage,
  },
  {
    title: '全站搜索',
    description: '搜索页覆盖论文、领域、作者和历史搜索，帮助用户快速定位研究主题。',
    image: searchImage,
  },
  {
    title: '搜索结果排序',
    description: '搜索结果按相关性、最新和热门组织，让用户能在不同检索意图之间快速切换。',
    image: searchSecondImage,
  },
];

const publishGallery: ProjectImagePreview[] = [
  {
    title: '写文章',
    description: '用户可以把论文阅读理解整理成文章，并选择频道、标签和配图后发布。',
    image: publishOneImage,
  },
  {
    title: '文章详情',
    description: '发布后的内容会进入社区详情页，支持阅读、分享、点赞、收藏和评论。',
    image: publishTwoImage,
  },
  {
    title: '图文内容',
    description: '社区内容可以承载文字观点和配图，让科研理解有更丰富的表达方式。',
    image: publishImage,
  },
  {
    title: '评论互动',
    description: '内容底部承接评论入口，把个人阅读沉淀转化为可交流的社区反馈。',
    image: publishFourImage,
  },
];

const researchProfileFeatureGallery: ProjectImagePreview[] = [
  {
    title: '科研画像入口',
    description: '个人主页中的科研画像入口会汇总阅读、解析、收藏和评论行为，形成成长反馈。',
    image: researchProfileImage,
  },
  {
    title: '科研画像总览',
    description: '画像页展示研究累积指数、当前画像阶段、置信度和行为轮廓。',
    image: researchProfileOneImage,
  },
  {
    title: '行动建议',
    description: '系统会把画像结论转成可执行的研究建议，帮助用户知道下一步该补什么。',
    image: researchProfileDetailImage,
  },
  {
    title: '行为维度与证据链',
    description: '进一步展开能力维度、研究兴趣、证据链和行为记录，让反馈更可解释。',
    image: researchProfileThreeImage,
  },
];

const personalLibraryGallery: ProjectImagePreview[] = [
  {
    title: '个人主页',
    description: '个人主页汇总已解析笔记、收藏、点赞、科研画像和最近评论，是个人文献库的入口。',
    image: personalHomeImage,
  },
  {
    title: '点赞记录',
    description: '点赞记录保留用户认可过的论文与内容，方便回到当时的阅读线索。',
    image: likedRecordImage,
  },
  {
    title: '最近评论',
    description: '评论列表沉淀讨论过的论文和观点，后续可以继续交流或复盘。',
    image: commentImage,
  },
  {
    title: '收藏文献',
    description: '收藏页把重要论文集中管理，适合做二次阅读、检索和个人笔记整理。',
    image: collectionImage,
  },
];

const knowledgeGraphGallery: ProjectImagePreview[] = [
  {
    title: '论文库证据检索',
    description: 'AI 实验室会从已解析论文中检索可引用证据，把候选资料整理成回答上下文。',
    image: aiLabThreeImage,
  },
  {
    title: '研究资料确认',
    description: '用户可以确认研究问题和资料范围，让后续回答更贴近当前研究目标。',
    image: aiLabFourImage,
  },
  {
    title: '证据驱动回答',
    description: '回答会结合 PDF 证据、论文列表和引用编号，减少只有结论没有依据的情况。',
    image: aiLabFiveImage,
  },
  {
    title: '方法框架拆解',
    description: '系统会把论文方法拆成模块、机制和关键步骤，方便继续追问和复盘。',
    image: aiLabImage,
  },
  {
    title: '跨论文资料关联',
    description: '围绕同一研究问题，把多篇论文的思路、方法和可借鉴点串联起来。',
    image: aiLabSevenImage,
  },
  {
    title: '知识图谱式整理',
    description: '把已有回答进一步展开成架构、模块和方法细节，帮助用户发现研究线索。',
    image: aiLabEightImage,
  },
  {
    title: '阅读模式详情',
    description: '长回答可以进入阅读模式，在更宽的视图里查看完整结构和引用内容。',
    image: aiLabNineImage,
  },
  {
    title: '回复详情总览',
    description: 'AI 回复详情保留完整上下文，适合继续阅读、检查证据和沉淀笔记。',
    image: aiLabReplyOneImage,
  },
  {
    title: '痛点与记忆切入点',
    description: '进一步拆解知识库、记忆机制和用户兴趣建模的切入点。',
    image: aiLabReplyImage,
  },
  {
    title: '记忆增强方案',
    description: '将跨会话记忆、兴趣状态和知识检索组织成可执行的方案结构。',
    image: aiLabReplyThreeImage,
  },
  {
    title: '写入与检索细节',
    description: '展示记忆写入、存储结构和检索融合逻辑，让方案更接近可实现设计。',
    image: aiLabReplyFourImage,
  },
  {
    title: '存储结构与融合',
    description: '继续展开记忆生命周期、相似度检索和历史偏好融合方式。',
    image: aiLabReplyFiveImage,
  },
  {
    title: '预期收益与研究路线',
    description: '从收益、路线和后续研究方向总结知识库与知识图谱的价值。',
    image: aiLabReplySixImage,
  },
];

const paperAiReadingGallery: ProjectImagePreview[] = [
  {
    title: '论文 AI 伴读入口',
    description: '在论文详情页围绕当前论文直接提问，AI 会自动结合当前论文 PDF 证据组织回答。',
    image: paperAiReadingOneImage,
  },
  {
    title: 'AI 回复阅读模式',
    description: 'AI 回复可以展开成阅读模式，方便查看总结、证据和结构化解释。',
    image: paperAiReadingTwoImage,
  },
  {
    title: '改进方向追问',
    description: '用户可以继续追问论文可能的改进方向，AI 会基于上下文给出分析。',
    image: paperAiReadingThreeImage,
  },
  {
    title: '回复详情展开',
    description: '长回答支持详情展开，适合深入查看方法分析、实验结果和改进建议。',
    image: paperAiReadingFourImage,
  },
];

const featureCards = [
  {
    icon: Search,
    title: '论文发现与智能搜索',
    description: '通过首页频道、热门话题、搜索建议和历史记录，帮助用户快速找到值得阅读的论文与相关内容。',
    gallery: discoverySearchGallery,
  },
  {
    icon: Workflow,
    title: '批量论文解析',
    description: '支持标题、arXiv ID 或论文链接批量提交，自动识别论文并跟踪解析任务进度。',
    galleryKey: 'parse',
  },
  {
    icon: BookOpen,
    title: '通俗 / 深度解读',
    description: '提供快速看懂大意的通俗解读，也支持展开背景、方法、实验、贡献与局限的深度研究。',
    galleryKey: 'reading',
  },
  {
    icon: Bot,
    title: '论文 AI 伴读',
    description: '在论文详情页围绕当前论文继续提问，AI 会结合 PDF 证据回答，帮助用户总结论文、解释方法、分析实验结果，并指出可能的改进方向。',
    gallery: paperAiReadingGallery,
  },
  {
    icon: MessageSquareText,
    title: 'AI 研究实验室',
    description: '围绕论文或研究问题持续追问，结合资料源、RAG、引用证据和知识图谱生成更可靠的回答。',
    galleryKey: 'lab',
  },
  {
    icon: MessageCircle,
    title: '发布与社区互动',
    description: '把阅读理解沉淀成帖子、笔记和观点，并通过点赞、收藏、评论、关注形成持续反馈。',
    gallery: publishGallery,
  },
  {
    icon: CheckCircle2,
    title: '科研画像与成长反馈',
    description: '汇总解析、阅读、收藏、评论和追问行为，生成研究兴趣、能力维度和成长轨迹。',
    gallery: researchProfileFeatureGallery,
  },
  {
    icon: FileImage,
    title: '个人文献库',
    description: '沉淀已解析论文、收藏、阅读历史和个人笔记，方便后续复盘、检索和继续研究。',
    gallery: personalLibraryGallery,
  },
  {
    icon: Server,
    title: '知识库与知识图谱',
    description: '基于 RAG、向量检索和实体关系，支持跨论文问答、资料关联和研究线索发现。',
    gallery: knowledgeGraphGallery,
  },
];

const discoveryGallery: ProjectImagePreview[] = [
  {
    title: '首页推荐',
    description: '首页把频道、热门内容、论文卡片和互动数据放在同一视图里，适合长期浏览和持续发现。',
    image: momoOverviewImage,
  },
  {
    title: '项目总览延展',
    description: '不同内容区块保留一致的侧边导航和顶部搜索入口，降低用户在多个功能间切换的成本。',
    image: momoOverviewSecondImage,
  },
  {
    title: '内容流补充',
    description: '内容流连接论文详情、发布内容和用户互动，让论文阅读不是一次性动作。',
    image: momoOverviewThirdImage,
  },
  {
    title: '搜索结果',
    description: '搜索页覆盖论文、领域、作者和历史搜索，帮助用户快速定位研究主题。',
    image: searchImage,
  },
  {
    title: '搜索建议',
    description: '建议、热门和历史记录让用户不必记住完整标题，也能回到相关论文或话题。',
    image: searchSecondImage,
  },
];

const parseGallery: ProjectImagePreview[] = [
  {
    title: '批量解析入口',
    description: '用户可以把论文标题、arXiv ID 或链接逐行粘贴给 AI，一次生成多个解析任务。',
    image: parseInputImage,
  },
  {
    title: '论文输入示例',
    description: '输入 arXiv ID、论文编号或论文标题后，系统会自动检测可解析的任务数量。',
    image: parseInputFilledImage,
  },
  {
    title: '识别任务进度',
    description: '开始解析后，页面会展示识别进度和任务提交状态。',
    image: parseRecognizingImage,
  },
  {
    title: '任务队列',
    description: '解析任务进入队列后，页面会展示识别结果、处理状态和任务恢复入口。',
    image: parseQueueImage,
  },
  {
    title: '任务列表更新',
    description: '任务队列会持续展示每篇论文的解析状态、进度和操作入口。',
    image: parseTaskListImage,
  },
  {
    title: '任务管理确认',
    description: '解析任务支持删除或终止，并通过确认弹窗避免误操作。',
    image: parseResultImage,
  },
];

const readingGallery: ProjectImagePreview[] = [
  {
    title: '通俗解读入口',
    description: '论文详情页把基础信息、速读要点和深度研究放在同一入口，方便用户先快速判断论文价值。',
    image: plainReadImage,
  },
  {
    title: '秒懂论文',
    description: '通俗解读用更容易读懂的话解释论文动机、核心问题、方法思路和结论。',
    image: plainReadTwoImage,
  },
  {
    title: '通俗解读难点',
    description: '把论文里的关键难点拆成连续段落，帮助用户快速抓住为什么难、怎么解决。',
    image: plainReadSecondImage,
  },
  {
    title: '通俗解读实验',
    description: '继续说明实验设计、核心结果和需要谨慎理解的地方。',
    image: plainReadFourImage,
  },
  {
    title: '通俗解读评估',
    description: '展示解析内容可信度、评论区和读者反馈入口，让阅读结果可以被复盘。',
    image: plainReadFiveImage,
  },
  {
    title: '深度研究入口',
    description: '深度研究从速览切换到更完整的研究结构，适合综述、复现和选题调研。',
    image: deepReadImage,
  },
  {
    title: '研究速览',
    description: '深度模式先给出研究问题、核心方法和关键结论，让用户建立全局框架。',
    image: deepReadTwoImage,
  },
  {
    title: '问题与动机',
    description: '展开论文要解决的问题、研究背景和方法提出的原因。',
    image: deepReadThreeImage,
  },
  {
    title: '核心贡献',
    description: '梳理论文贡献点，把方法价值和适用边界拆开说明。',
    image: deepReadFourImage,
  },
  {
    title: '方法拆解',
    description: '按模块解释方法组成、训练目标和关键设计，更适合深入理解与复现。',
    image: deepReadSecondImage,
  },
  {
    title: '图表解读',
    description: '把论文图表、实验数据和对比结果放到解读里，帮助用户看懂证据链。',
    image: deepReadSixImage,
  },
  {
    title: '读者 takeaway',
    description: '最后沉淀适合借鉴、复现和关注趋势的要点。',
    image: deepReadEightImage,
  },
];

const aiLabFeatureGallery: ProjectImagePreview[] = [
  {
    title: '资料源检索',
    description: '围绕用户论文库自动检索可引用资料，并把可用 PDF 证据组织成结构化上下文。',
    image: aiLabTwoImage,
  },
  {
    title: '对话编辑',
    description: '最近对话支持快速编辑、确认和取消，方便用户调整研究问题。',
    image: aiLabThreeImage,
  },
  {
    title: '研究主题追问',
    description: '用户可以围绕推荐算法、论文思想或具体方法持续追问，让问题逐步变清楚。',
    image: aiLabFourImage,
  },
  {
    title: '深度回答生成',
    description: 'AI 会结合证据、引用和上下文，输出分段解释、方法拆解和后续改进方向。',
    image: aiLabFiveImage,
  },
  {
    title: 'AI 实验室入口',
    description: 'AI 实验室把对话、资料源、用户 Key 模式和研究协作空间放在同一个工作台中。',
    image: aiLabImage,
  },
  {
    title: '历史对话删除确认',
    description: '最近对话支持删除确认，避免误删后影响研究记录。',
    image: aiLabOneImage,
  },
];

const labGallery: ProjectImagePreview[] = [
  {
    title: 'AI 实验室',
    description: 'AI 实验室把研究问题、多轮追问、资料源和结果生成组织在同一个工作台中。',
    image: aiLabImage,
  },
  {
    title: '结构化回复',
    description: '回复结果强调观点、依据和下一步，帮助用户知道答案从哪里来、还能继续读什么。',
    image: aiLabReplyImage,
  },
];

const retainGallery: ProjectImagePreview[] = [
  {
    title: '发布阅读理解',
    description: '用户可以把论文理解、观点或研究笔记整理成文章，并选择频道、标签和配图后发布。',
    image: publishOneImage,
  },
  {
    title: '发布设置',
    description: '发布前可以设置频道、标签和配图，让阅读理解进入可分享的内容流。',
    image: publishTwoImage,
  },
  {
    title: '图文内容详情',
    description: '发布后的内容可以承载文字观点和配图，让阅读沉淀有更完整的表达空间。',
    image: publishImage,
  },
  {
    title: '评论互动入口',
    description: '内容详情承接评论和互动，把个人阅读理解转化为可交流的社区反馈。',
    image: publishFourImage,
  },
  {
    title: '个人主页',
    description: '个人主页汇总笔记、收藏、点赞、科研画像和最近评论，是阅读沉淀内容的总入口。',
    image: personalHomeImage,
  },
  {
    title: '点赞记录',
    description: '点赞记录保留用户认可过的论文和内容，方便回到当时的阅读线索。',
    image: likedRecordImage,
  },
  {
    title: '科研画像入口',
    description: '科研画像从个人中心进入，把解析、点赞、收藏和评论行为沉淀为复盘材料。',
    image: researchProfileImage,
  },
  {
    title: '科研画像总览',
    description: '画像页汇总研究累积指数、当前阶段、置信度和行为轮廓。',
    image: researchProfileOneImage,
  },
  {
    title: '画像维度分析',
    description: '能力维度、平台均值对比和建议共同帮助用户理解自己的研究偏好。',
    image: researchProfileDetailImage,
  },
  {
    title: '行为维度与证据链',
    description: '进一步展开能力维度、研究兴趣、证据链和行为记录，让反馈更可解释。',
    image: researchProfileThreeImage,
  },
  {
    title: '评论互动',
    description: '评论把论文阅读变成可交流、可反馈的内容行为。',
    image: commentImage,
  },
  {
    title: '收藏文献',
    description: '重要论文可以回到个人空间，减少读完就散的情况。',
    image: collectionImage,
  },
];

const productJourney = [
  {
    eyebrow: '01 / Discover',
    title: '先从发现和搜索进入论文世界',
    description: '墨墨知 AI 不是把用户直接扔进输入框，而是用首页推荐、频道、热门话题、搜索建议和历史记录承接“我想找点论文看看”的早期状态。用户可以先阅读平台已有内容，也可以找到其他用户解析过的论文。',
    image: momoOverviewImage,
    gallery: discoveryGallery,
  },
  {
    eyebrow: '02 / Analyze',
    title: '批量解析，把论文变成可读材料',
    description: '当用户有明确论文清单时，可以一次提交多篇论文。系统负责识别标题、arXiv ID 或链接，创建解析任务，持续同步进度，并在完成后恢复解析结果，解决论文阅读里最耗时间的第一步。',
    image: parseInputImage,
    gallery: parseGallery,
  },
  {
    eyebrow: '03 / Read',
    title: '速读要点与深度解读，承载完整阅读对象',
    description: '解析完成后，论文详情页会把论文元信息、AI 解读、点赞、收藏、评论和后续追问放在同一个对象下。快速判断论文是否值得读时看通俗解读；写综述、做复现或比较方法时看深度研究，让用户进入一个可以阅读、互动和继续研究的论文空间。',
    image: deepReadImage,
    gallery: readingGallery,
  },
  {
    eyebrow: '04 / Ask',
    title: 'AI 辅助阅读，在详情页继续追问',
    description: '用户可以围绕当前论文继续提问，让 AI 解释公式、方法、实验结果、图表含义或论文局限。阅读过程从“看 AI 总结”升级为“边读边问、边问边理解”。',
    image: paperAiReadingOneImage,
    gallery: paperAiReadingGallery,
  },
  {
    eyebrow: '05 / Lab',
    title: 'AI 实验室，把单篇阅读扩展成研究探索',
    description: '当问题不再局限于单篇论文，用户可以进入 AI 实验室，围绕多篇资料、个人文献库或一个研究问题持续对话。AI 会组织资料源、引用证据、生成回答，并给出可以继续推进的研究方向和跨领域启发。',
    image: aiLabImage,
    gallery: knowledgeGraphGallery,
  },
  {
    eyebrow: '06 / Retain',
    title: '发布、收藏与科研画像，把阅读沉淀下来',
    description: '阅读后的理解可以发布为帖子、笔记或观点；重要论文可以收藏；长期的解析、阅读、评论和追问行为会进入科研画像。最终形成“发现、解析、阅读、追问、沉淀、复盘”的完整闭环。',
    image: publishOneImage,
    gallery: retainGallery,
  },
];

const architectureItems: ArchitectureItem[] = [
  {
    icon: MonitorSmartphone,
    title: 'Web 与移动端',
    description: 'Web 承接首页推荐、搜索、批量解析、论文详情、AI 实验室、发布和个人中心；移动端覆盖首页、解析、消息、个人中心、设置和科研画像等高频场景。',
    gallery: mobileAppGallery,
  },
  {
    icon: Server,
    title: '业务 API',
    description: '用户、论文、任务、评论、点赞、收藏、关注、消息、订单、搜索和 AI 配置被拆分为独立接口，支撑 Web、移动端和后台稳定调用。',
  },
  {
    icon: Zap,
    title: 'AI 服务',
    description: '论文解析、AI 对话、研究任务、RAG 知识库、知识图谱和安全审批由独立 AI 服务承载，和业务系统分层协作。',
  },
  {
    icon: Settings,
    title: '后台与运营',
    description: '后台覆盖内容管理、用户管理、AI 任务监控、订单计费、运营配置和系统设置，让产品不止能使用，也能被持续管理和运营。',
    gallery: backendAdminGallery,
  },
];

const ProjectSmartHome = () => {
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
      <section className="px-4 pb-8 pt-16">
        <div className="mx-auto max-w-5xl">
          <Link to="/projects">
            <Button variant="ghost" className="-ml-4 mb-6 rounded-full text-slate-600 hover:bg-slate-100">
              <ArrowLeft className="mr-2 h-4 w-4" /> 返回项目列表
            </Button>
          </Link>

          <div className="mb-10">
            <div className="mb-5 h-16 w-16 overflow-hidden rounded-2xl bg-white shadow-md shadow-slate-200">
              <img src={momoLogoImage} alt="墨墨知AI logo" className="h-full w-full object-cover" />
            </div>

            <h1 className="mb-6 text-3xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl">
              墨墨知AI
              <span className="block">
                论文智能阅读与<span className="text-orange-500">科研沉淀平台</span>
              </span>
            </h1>
            <p className="text-base md:text-lg text-slate-500 leading-relaxed mb-6 font-medium max-w-4xl">
              面向论文发现、批量解析、AI 深度阅读与科研交流的产品。它把搜索发现、通俗解读、深度研究、AI 实验室、内容发布、科研画像和个人设置串成一套流程，帮助用户更快读懂论文，并把阅读过程沉淀为可复用的知识资产。
            </p>
          </div>

          <div className="mb-8 flex flex-wrap gap-3">
            {techStack.map((tech) => (
              <Badge key={tech} className="rounded-full border-none bg-orange-50 px-4 py-1.5 text-sm font-bold text-orange-600 shadow-sm shadow-orange-100/70">
                {tech}
              </Badge>
            ))}
          </div>

          <button
            type="button"
            className="group relative mb-16 block w-full cursor-zoom-in overflow-hidden rounded-[32px] border-[3px] border-white bg-slate-50 text-left shadow-xl"
            onClick={() => openImagePreview({
              title: '墨墨知 AI 项目总览',
              description: '主界面由左侧导航、顶部搜索和中间内容流组成，适合论文发现、内容浏览和长期重复使用。',
              image: momoOverviewImage,
            })}
          >
            <img
              src={momoOverviewImage}
              className="aspect-[16/9] h-auto w-full object-cover transition-transform duration-1000 group-hover:scale-[1.02]"
              alt="墨墨知AI 论文辅助阅读助手项目总览"
            />
            <span className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-slate-900 opacity-0 shadow-lg transition-all group-hover:scale-105 group-hover:opacity-100">
              <Maximize2 className="h-5 w-5" />
            </span>
          </button>

          <div className="mb-16">
            <div className="mb-6 flex items-center gap-3">
              <Workflow className="h-7 w-7 text-orange-500" />
              <h2 className="text-2xl font-black text-slate-950 md:text-3xl">核心能力</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {featureCards.map(({ icon: Icon, title, description, gallery, galleryKey }) => {
                const cardGallery = galleryKey === 'parse'
                  ? parseGallery
                  : galleryKey === 'reading'
                    ? readingGallery
                    : galleryKey === 'lab'
                      ? aiLabFeatureGallery
                      : gallery;
                const content = (
                  <>
                    <Icon className="mb-4 h-7 w-7 text-orange-500" />
                    <h3 className="mb-2 text-lg font-black text-slate-950">{title}</h3>
                    <p className="text-sm font-medium leading-relaxed text-slate-500">{description}</p>
                  </>
                );

                if (cardGallery) {
                  return (
                    <button
                      key={title}
                      type="button"
                      className="group relative rounded-[24px] border border-slate-100 bg-slate-50 p-6 text-left transition-all hover:-translate-y-1 hover:border-orange-100 hover:bg-orange-50/50 hover:shadow-lg hover:shadow-orange-100/60"
                      aria-label={`查看${title}截图轮播`}
                      onClick={() => openImagePreview({
                        title,
                        description,
                        image: cardGallery[0].image,
                        gallery: cardGallery,
                      })}
                    >
                      {content}
                      <span className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/90 text-slate-900 opacity-0 shadow-md transition-all group-hover:scale-105 group-hover:opacity-100">
                        <Maximize2 className="h-4 w-4" />
                      </span>
                    </button>
                  );
                }

                return (
                  <div key={title} className="rounded-[24px] border border-slate-100 bg-slate-50 p-6">
                    {content}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-16">
            <div className="mb-6 flex items-center gap-3">
              <BookOpen className="h-7 w-7 text-orange-500" />
              <h2 className="text-2xl font-black text-slate-950 md:text-3xl">一条完整产品路径</h2>
            </div>
            <div className="space-y-10">
              {productJourney.map((item, index) => (
                <div
                  key={item.title}
                  className={`grid grid-cols-1 items-center gap-6 lg:grid-cols-2 ${
                    index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="group/preview relative block w-full cursor-zoom-in overflow-hidden rounded-[28px] border-[3px] border-white bg-slate-50 text-left shadow-lg"
                    onClick={() => openImagePreview({
                      title: item.title,
                      description: item.description,
                      image: item.image,
                      gallery: item.gallery,
                    })}
                  >
                    <img src={item.image} alt={item.title} loading="lazy" className="aspect-[16/9] h-auto w-full object-cover transition-transform duration-700 group-hover/preview:scale-[1.02]" />
                    <span className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-slate-900 opacity-0 shadow-md transition-all group-hover/preview:scale-105 group-hover/preview:opacity-100">
                      <Maximize2 className="h-5 w-5" />
                    </span>
                  </button>
                  <div className="rounded-[24px] border border-slate-100 bg-white p-6 md:p-8">
                    <div className="mb-3 text-xs font-black uppercase tracking-widest text-orange-500">{item.eyebrow}</div>
                    <h3 className="mb-3 text-2xl font-black leading-tight text-slate-950">{item.title}</h3>
                    <p className="font-medium leading-relaxed text-slate-500">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 mb-4 rounded-[28px] bg-slate-950 p-6 text-white md:p-8 lg:p-10">
            <div className="mb-8 max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-orange-200">
                <Server className="h-4 w-4" />
                SYSTEM DESIGN
              </div>
              <h2 className="mb-3 text-2xl font-black md:text-3xl">不是单页 Demo，而是一套完整的多端产品系统</h2>
              <p className="font-medium leading-relaxed text-slate-300">
                墨墨知 AI 由 Web、移动端、业务 API、AI 服务和管理后台共同组成。从用户侧阅读体验，到论文解析、研究问答、内容运营、订单与计费管理，每个环节都有对应的工程支撑。
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {architectureItems.map(({ icon: Icon, title, description, gallery }) => {
                const content = (
                  <>
                    <Icon className="mb-4 h-7 w-7 text-orange-300" />
                    <h3 className="mb-2 text-lg font-black">{title}</h3>
                    <p className="text-sm font-medium leading-relaxed text-slate-300">{description}</p>
                  </>
                );

                if (gallery) {
                  return (
                    <button
                      key={title}
                      type="button"
                      className="group relative rounded-[24px] border border-white/10 bg-white/[0.06] p-6 text-left transition-all hover:-translate-y-1 hover:border-orange-200/60 hover:bg-white/[0.09]"
                      aria-label={`查看${title}截图轮播`}
                      onClick={() => openImagePreview({
                        title,
                        description,
                        image: gallery[0].image,
                        gallery,
                      })}
                    >
                      {content}
                      <span className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/90 text-slate-900 opacity-0 shadow-md transition-all group-hover:scale-105 group-hover:opacity-100">
                        <Maximize2 className="h-4 w-4" />
                      </span>
                    </button>
                  );
                }

                return (
                  <div key={title} className="rounded-[24px] border border-white/10 bg-white/[0.06] p-6">
                    {content}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative top-16 flex flex-col gap-6 rounded-[28px] bg-orange-500 p-8 text-white md:flex-row md:items-center md:justify-between md:p-10">
            <div className="md:flex-1">
              <div className="mb-3 flex items-center gap-3">
                <FileImage className="h-6 w-6" />
                <h2 className="text-2xl font-black">一个让论文阅读真正沉淀下来的 AI 研究助手</h2>
              </div>
              <p className="max-w-4xl font-medium leading-relaxed text-orange-100">
                墨墨知 AI 把论文发现、AI 解析、研究问答、社区内容和科研画像连在一起，让用户每次读论文都能沉淀出可复用的理解、问题和研究线索。
              </p>
            </div>
            <Button asChild className="rounded-xl bg-white px-6 py-5 text-base font-black text-orange-600 hover:bg-slate-950 hover:text-white">
              <Link to="/blog?project=momozhi">
                查看博客 <ArrowRight className="ml-2 h-5 w-5" />
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
                        selectedGalleryIndex === index ? 'w-8 bg-orange-500' : 'w-2.5 bg-slate-200 hover:bg-slate-300'
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

export default ProjectSmartHome;
