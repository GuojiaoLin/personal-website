import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/Layout';
import { Mail, MapPin, GraduationCap, Globe, Share2, X, Phone, UserRound } from 'lucide-react';
import { Button } from '../components/ui/button';
import { type AboutContentRecord, type AboutProfileDetail, getAboutContent } from '../lib/aboutApi';

const profilePortraitImage = new URL('../../docs/images/1780899830881.jpg', import.meta.url).href;
const wechatQrImage = new URL('../../docs/images/mmqrcode1780901635229.png', import.meta.url).href;

const profileDetails = [
  { label: '基本信息', value: '林国娇 · 女 · 山东青岛', icon: 'user', wide: true },
  { label: '本科', value: '山东科技大学 软件工程', icon: 'graduation-cap' },
  { label: '硕士', value: '中国科学院大学 计算机技术', icon: 'graduation-cap' },
  { label: '手机', value: '17664020797', icon: 'phone', copyValue: '17664020797' },
  { label: '邮箱', value: 'lgj425425@126.com', icon: 'mail', copyValue: 'lgj425425@126.com' },
];

const momozhiTechStack = [
  'Python',
  'FastAPI',
  'LangGraph',
  'RabbitMQ',
  'MySQL',
  'Redis',
  'Milvus',
  'MongoDB',
  'MinIO',
  'MCP',
  'Docker',
  'Nginx',
  'ragas',
  'DeepEval',
  'LangSmith',
];

const momozhiProjectHighlights = [
  {
    title: '多 Agent 分析流水线',
    detail: '基于 LangGraph 构建 12 节点论文解析流水线：取数、图表摄取、分类、5 个分节子代理并行、汇总、Critic 评审、3 写手并行、入库；修复多源汇入“任一触发”竞态，以等齐屏障、齐套断言和 reducer 合并共享状态。',
  },
  {
    title: '异步任务可靠性',
    detail: '长耗时解析以 RabbitMQ 解耦，配合持久化、DLQ、1m/5m/30m 三档 TTL 延迟重试；MySQL 状态机兜幂等，采用 claim 抢占、120s 租约、30s 心跳和孤儿回收，实现“至少一次投递 + 幂等处理”的等效 exactly-once。',
  },
  {
    title: 'RAG 与论文记忆',
    detail: '正文、图表、表格切块后双写 MySQL + Milvus；检索链路为 dense 30 + BM25 sparse 30 双路召回、RRF(k=60) 融合、rerank 取 20、终选 8；严格校验 [C#] 引用真实性，失败降温重试，再失败拒答。',
  },
  {
    title: '科研 Agent 编排',
    detail: 'AI 实验室采用“规则优先意图路由 + 确定性查询规划 + 有界自反思”的 Plan-and-Execute 架构；LangGraph SQL checkpointer/Store 支持会话恢复与跨会话记忆，SSE 结构化事件流支撑断线恢复。',
  },
  {
    title: '多租户隔离与安全',
    detail: '修复“以提示词做用户隔离”的真实漏洞，私有检索切至 Milvus filter 引擎级硬过滤；入库层拒绝私有文档进入共享库；外部内容入模前做提示注入扫描，MCP 工具网关加入白名单、审批令牌、串行锁、超时和脱敏审计。',
  },
  {
    title: '成本与稳定性治理',
    detail: '实现请求级三重预算闸：12 次 LLM 调用、12 万 token、300 秒；ContextVar 贯穿调用链，在 LLM 客户端咽喉点先检后记账；外部依赖按核心/增强分级降级，LLM 客户端支持代理/直连双路径与坏路径冷却。',
  },
  {
    title: '评测与可观测',
    detail: '自研确定性 Agent Harness，保留真实流水线、替换 LLM/MCP/DB/MQ 叶子；结合 ragas、DeepEval、LangSmith 做质量门禁和 trace；覆盖双 health、任务双状态机、usage 成本核算与启动期轻量迁移。',
  },
  {
    title: '生产部署与线上排障',
    detail: '独立完成 Docker Compose 全栈上线，配置 Nginx 分流、HTTPS、MinIO 预签名媒体子域；上线首日定位连接池 ping 随机 500 事故，锁定 PyMySQL 与 SQLAlchemy 依赖版本组合完成修复。',
  },
];

const supportAgentTechStack = [
  'Python',
  'FastAPI',
  'FAISS',
  'BM25',
  'BGE-Embedding',
  'BGE-Reranker',
  'RRF',
  'HyDE',
  'Qwen-VL',
  'DeepSeek',
  'Redis',
  'DeepEval',
  'SSE',
];

const supportAgentProjectHighlights = [
  {
    title: 'Agent 链路编排',
    detail: '采用 Workflow 主干 + 局部 LLM 决策架构，将请求拆为图片理解、会话上下文补全、意图识别与 Query 增强、产品确认、条件触发 HyDE、三路混合检索、受控生成、幻觉/质量/审计三层校验的可观测链路，全程 trace 可回放。',
  },
  {
    title: '多模态图文对齐协议',
    detail: '设计 <PIC> 与 image_ids 的前后端渲染协议；建库期将手册图片临时编号为 <PIC_N> 随 chunk 切分后反查绑定，检索期按“宽召回、窄注入”构建候选图片池，生成后硬校验数量、顺序与候选集合法性，对齐率与图片资源可用率均达 100%。',
  },
  {
    title: '混合 RAG 检索',
    detail: '构建 FAISS 语义、BM25 关键词、图片 Caption 三路召回，经 RRF 排名融合与 BGE-Reranker-v2-m3 精排、分数断崖动态截断；手册级 Top5 命中率 94.87%，MRR 0.93。',
  },
  {
    title: '防幻觉与质量治理',
    detail: '实现“规则硬校验 → LLM 事实核查 → 高风险话术兜底”的分层后置治理，结合 Reflexion 将审计失败原因结构化为重试约束；幻觉率 2.75%，提交审计通过率 96.25%。',
  },
  {
    title: '评估体系与上线门禁',
    detail: '设计检索、图片、生成、门禁四层 10 项指标，自研 evidence_hit、neighbor recall 等口径吸收 chunk 切分导致的 ID 漂移；接入 DeepEval 做 LLM-as-a-Judge 软质量评估，忠实度 0.9734。',
  },
  {
    title: '多模型协作与工程化',
    detail: '按职责解耦 Vision、Embedding、Reranker、主生成、Judge 五类模型，OpenAI-compatible 统一封装；FastAPI 提供 /chat、multipart 上传与 SSE 流式接口，Redis 会话记忆，Reranker 懒加载失败回退 RRF。',
  },
  {
    title: 'Badcase 数据闭环',
    detail: '通过指标组合将图片配错问题定位到候选图召回层，离线为 2,597 张手册图生成视觉 caption 并接入检索文本，在全人工确认的 gold v3 标签集上做 before/after 全量回归验证收益。',
  },
];

const gumePaperHighlights = [
  {
    title: '图增强',
    detail: '基于物品间多模态相似度（KNN/余弦）识别“语义邻居”，将其边注入用户-物品交互图，提升长尾物品连通性并缓解冷启动；图初始化后冻结以兼顾效率。',
  },
  {
    title: '用户模态增强',
    detail: '为用户构建“显式交互特征”（历史偏好，含 coarse/fine-grained 属性分离重聚合）与“扩展兴趣特征”（潜在偏好），用 InfoNCE 最大化二者互信息，并结合 SimGCL 式噪声增强提升泛化能力。',
  },
  {
    title: '内外双视角对齐去噪',
    detail: '内部用高斯参数化对齐视觉/文本模态，外部用 InfoNCE 对齐行为与模态特征，削弱与推荐无关的模态噪声。',
  },
  {
    title: '实验效果',
    detail: '对比 9 个 baseline，在 Sports/Clothing/Electronics 上 Recall@20 分别提升 2.28%/3.54%/3.82%，NDCG@20 分别提升 3.13%/5.67%/2.65%；消融、长尾分组、t-SNE 可视化验证各模块有效性。',
  },
  {
    title: '开源实现',
    detail: '代码与数据已在 GitHub 开源；基于 MMRec 框架与 PyTorch 实现，在四个公开 Amazon 数据集上达到 SOTA。',
  },
];

const profileIconByName = {
  user: UserRound,
  'user-round': UserRound,
  'graduation-cap': GraduationCap,
  phone: Phone,
  mail: Mail,
};

const contactIconByName = {
  mail: Mail,
  'map-pin': MapPin,
  'graduation-cap': GraduationCap,
  globe: Globe,
};

const defaultAboutContent: AboutContentRecord = {
  portraitImageUrl: profilePortraitImage,
  wechatQrImageUrl: wechatQrImage,
  profileDetails,
  resumeEntries: [
    {
      category: 'Project Resume',
      title: '墨墨知 —— AI 论文研究平台（多 Agent + RAG + 内容社区）',
      meta: '独立开发 · 已上线 momozhi.com',
      period: '2025.XX – 至今',
      techStack: momozhiTechStack,
      descriptionLabel: '项目描述',
      description: '面向科研人群的 AI 论文平台：论文经多 Agent 流水线深度解析后沉淀为用户的可检索记忆，支撑带引用门禁的研究问答（AI 实验室）、灵感卡片与研究计划生成，并经规则推荐分发为内容社区。',
      highlightsLabel: '项目亮点',
      highlights: momozhiProjectHighlights,
      sortOrder: 1,
    },
    {
      category: 'Project Resume',
      title: '多模态客服 Agent —— 基于混合 RAG 与图文对齐协议的电商售后问答系统',
      meta: '独立开发',
      period: '2026.XX – 至今',
      techStack: supportAgentTechStack,
      descriptionLabel: '项目描述',
      description: '面向电商售后与产品手册问答场景，独立设计并实现图文混合输入/输出的客服 Agent：用户上传产品图、故障图、订单截图提问，系统基于产品手册证据生成“文本 + 手册配图”的结构化回复。全链路覆盖图片理解、混合检索、受控生成、幻觉治理与离线评测，400 题评估集上提交审计通过率 96.25%。',
      highlightsLabel: '项目亮点',
      highlights: supportAgentProjectHighlights,
      sortOrder: 2,
    },
    {
      category: 'Publication Resume',
      title: 'GUME: Graphs and User Modalities Enhancement for Long-Tail Multimodal Recommendation',
      meta: '第一作者 ｜ arXiv:2407.12338 ｜ 中科院计算机网络信息中心 & 中科院大学',
      period: '2024',
      techStack: ['长尾多模态推荐', '图增强', '用户模态表征', '对比学习', '推荐去噪'],
      descriptionLabel: '论文描述',
      description: '针对多模态推荐（MMRS）中长尾物品交互稀疏、用户模态表征过于简单两大被忽视的问题，提出 GUME 框架，在四个公开 Amazon 数据集上达到 SOTA。实现方式：基于 MMRec 框架与 PyTorch 实现，代码与数据已在 GitHub 开源。',
      highlightsLabel: '论文亮点',
      highlights: gumePaperHighlights,
      sortOrder: 3,
    },
  ],
  contactHeading: '连接我的世界',
  contactItems: [
    { label: 'Email Me', value: 'lgj425425@126.com', icon: 'mail' },
    { label: 'Location', value: '北京', icon: 'map-pin' },
    { label: 'Education', value: '中国科学院大学', icon: 'graduation-cap' },
  ],
  socialLinks: [],
};

const resolveAboutContent = (content: AboutContentRecord): AboutContentRecord => ({
  ...content,
  portraitImageUrl: content.portraitImageUrl?.trim() || profilePortraitImage,
  wechatQrImageUrl: content.wechatQrImageUrl?.trim() || wechatQrImage,
  profileDetails: content.profileDetails?.length ? content.profileDetails : defaultAboutContent.profileDetails,
  resumeEntries: content.resumeEntries?.length ? content.resumeEntries : defaultAboutContent.resumeEntries,
  contactHeading: content.contactHeading?.trim() || defaultAboutContent.contactHeading,
  contactItems: content.contactItems?.length ? content.contactItems : defaultAboutContent.contactItems,
  socialLinks: [],
});

const getProfileIcon = (detail: AboutProfileDetail) => (
  profileIconByName[(detail.icon || '').toLowerCase() as keyof typeof profileIconByName] ?? UserRound
);

const getContactIcon = (icon?: string | null) => (
  contactIconByName[(icon || '').toLowerCase() as keyof typeof contactIconByName] ?? Mail
);

const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};

const About = () => {
  const [isWechatOpen, setIsWechatOpen] = useState(false);
  const [copiedProfileDetail, setCopiedProfileDetail] = useState<string | null>(null);
  const [aboutContent, setAboutContent] = useState<AboutContentRecord>(defaultAboutContent);

  useEffect(() => {
    let isCurrent = true;

    getAboutContent()
      .then((content) => {
        if (isCurrent) setAboutContent(resolveAboutContent(content));
      })
      .catch(() => {
        if (isCurrent) setAboutContent(defaultAboutContent);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const orderedResumeEntries = useMemo(() => (
    [...aboutContent.resumeEntries].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
  ), [aboutContent.resumeEntries]);

  const copyProfileDetail = async (label: string, value?: string | null) => {
    if (!value) return;

    await copyText(value);
    setCopiedProfileDetail(label);
    window.setTimeout(() => {
      setCopiedProfileDetail((current) => (current === label ? null : current));
    }, 1600);
  };

  return (
    <Layout>
      <section className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Intro Section */}
          <div className="relative mb-20 grid items-center gap-12 md:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.6fr)]">
            <div className="relative mx-auto h-64 w-64 shrink-0 self-center md:mx-0">
              <div className="absolute inset-0 bg-[#FFFF00] rounded-[28px] rotate-6 opacity-20" />
              <img 
                src={aboutContent.portraitImageUrl || profilePortraitImage}
                className="w-full h-full rounded-[28px] object-cover object-[center_60%] border-[3px] border-white shadow-xl relative z-10 hover:rotate-0 transition-transform duration-500"
              />
            </div>
            <div className="w-full self-center text-center md:text-left">
              <div className="grid gap-3 sm:grid-cols-2">
                {aboutContent.profileDetails.map((detail) => {
                  const { label, value, copyValue, wide } = detail;
                  const Icon = getProfileIcon(detail);
                  const isCopyable = Boolean(copyValue);
                  const isCopied = copiedProfileDetail === label;
                  const cardClassName = `flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white/90 p-3 text-left shadow-sm shadow-slate-100 ${wide ? 'sm:col-span-2' : ''} ${isCopyable ? 'cursor-copy select-text transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white active:scale-[0.99]' : ''}`;

                  return (
                    <div
                      key={label}
                      role={isCopyable ? 'button' : undefined}
                      tabIndex={isCopyable ? 0 : undefined}
                      title={isCopyable ? '双击复制' : undefined}
                      onDoubleClick={() => void copyProfileDetail(label, copyValue)}
                      onKeyDown={(event) => {
                        if (isCopyable && (event.key === 'Enter' || event.key === ' ')) {
                          event.preventDefault();
                          void copyProfileDetail(label, copyValue);
                        }
                      }}
                      className={cardClassName}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFFF00] text-slate-950 shadow-sm shadow-[#FFFF00]/30">
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                          {label}
                          {isCopied && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] tracking-normal text-emerald-700">
                              已复制
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block break-words text-sm font-black leading-snug text-slate-900">{value}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Resume Sections */}
          <div className="space-y-24">
            {orderedResumeEntries.map((entry) => (
              <motion.div
                key={`${entry.title}-${entry.sortOrder ?? 0}`}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#FFFF00]/80 hover:shadow-[0_28px_72px_-38px_rgba(15,23,42,0.48)] md:p-8"
              >
                <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#FFFF00] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#FFFF00]/10 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative z-10 border-b border-slate-100 pb-5">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-400">
                      {entry.category || 'Project Resume'}
                    </p>
                    <h2 className="mt-2 text-xl font-black leading-snug text-slate-950 md:text-2xl">
                      {entry.title}
                    </h2>
                    {(entry.meta || entry.period) && (
                      <div className={`mt-2 flex flex-col gap-1 sm:flex-row sm:items-center ${entry.meta ? 'sm:justify-between' : 'sm:justify-end'}`}>
                        {entry.meta && (
                          <p className="text-sm font-bold text-slate-500">{entry.meta}</p>
                        )}
                        {entry.period && (
                          <p className="shrink-0 text-sm font-black text-slate-700 sm:ml-4 sm:text-right">{entry.period}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative z-10 mt-5 space-y-4 text-sm leading-relaxed text-slate-700 md:text-base">
                  {entry.techStack && entry.techStack.length > 0 && (
                    <p>
                      <span className="font-black text-slate-950">技术栈：</span>
                      <span className="font-semibold">{entry.techStack.join('、')}</span>
                    </p>
                  )}
                  {entry.description && (
                    <p>
                      <span className="font-black text-slate-950">{entry.descriptionLabel || '项目描述'}：</span>
                      {entry.description}
                    </p>
                  )}
                  {entry.highlights && entry.highlights.length > 0 && (
                    <div>
                      <p className="font-black text-slate-950">{entry.highlightsLabel || '项目亮点'}：</p>
                      <ul className="mt-3 space-y-3">
                        {entry.highlights.map((item) => (
                          <li key={`${entry.title}-${item.title}`} className="grid grid-cols-[0.75rem_1fr] gap-3">
                            <span className="mt-[0.65rem] h-1.5 w-1.5 rounded-full bg-slate-950" />
                            <p>
                              <span className="font-black text-slate-950">{item.title}：</span>
                              <span className="font-medium text-slate-600">{item.detail}</span>
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>


          {/* Contact Info Card */}
          <div className="mt-24 bg-white rounded-[36px] p-10 lg:p-16 border border-slate-100 shadow-[0_24px_64px_-18px_rgba(0,0,0,0.08)] text-center relative overflow-hidden group/card transition-all duration-500">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-12 tracking-tight">{aboutContent.contactHeading}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {aboutContent.contactItems.map((item) => {
                const Icon = getContactIcon(item.icon);

                return (
                  <div key={item.label} className="flex flex-col items-center space-y-4">
                    <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-slate-900 mb-2 shadow-inner group-hover/card:bg-[#FFFF00] transition-colors">
                      <Icon size={24} />
                    </div>
                    <p className="font-black text-slate-900 uppercase tracking-widest text-xs">{item.label}</p>
                    <p className="text-lg text-slate-500 font-medium">{item.value}</p>
                  </div>
                );
              })}
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 mt-14">
               <Button
                 type="button"
                 variant="outline"
                 className="rounded-xl border-2 border-slate-200 text-slate-900 hover:bg-[#FFFF00] hover:border-[#FFFF00] font-black px-7 py-5 text-base transition-all shadow-lg shadow-slate-200/50"
                 onClick={() => setIsWechatOpen(true)}
               >
                 <Share2 className="mr-2 w-5 h-5" /> Let's Connect
               </Button>
            </div>
          </div>
        </div>
      </section>

      {isWechatOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/30 px-4 py-8 backdrop-blur-sm"
          onClick={() => setIsWechatOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wechat-dialog-title"
            className="relative w-full max-w-sm rounded-[28px] border border-slate-100 bg-white p-6 text-center shadow-[0_30px_90px_-42px_rgba(15,23,42,0.85)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="关闭微信二维码弹窗"
              className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-950"
              onClick={() => setIsWechatOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-slate-400">WeChat</p>
            <h2 id="wechat-dialog-title" className="mb-5 text-2xl font-black tracking-tight text-slate-950">
              微信添加好友
            </h2>
            <img
              src={aboutContent.wechatQrImageUrl || wechatQrImage}
              alt="微信添加好友二维码"
              className="mx-auto w-full max-w-[280px] rounded-2xl border border-slate-100 shadow-sm"
            />
            <p className="mt-5 text-sm font-bold leading-6 text-slate-500">
              扫一扫，添加我为微信好友。
            </p>
          </div>
        </div>
      )}
    </Layout>
  );
};
export default About;
