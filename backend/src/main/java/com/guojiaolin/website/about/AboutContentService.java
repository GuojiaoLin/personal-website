package com.guojiaolin.website.about;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.guojiaolin.website.about.dto.AboutContactItem;
import com.guojiaolin.website.about.dto.AboutContentRequest;
import com.guojiaolin.website.about.dto.AboutContentResponse;
import com.guojiaolin.website.about.dto.AboutProfileDetail;
import com.guojiaolin.website.about.dto.AboutResumeEntry;
import com.guojiaolin.website.about.dto.AboutResumeHighlight;
import com.guojiaolin.website.about.dto.AboutSocialLink;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AboutContentService {

  private static final String MAIN_KEY = "main";
  private static final TypeReference<List<AboutProfileDetail>> PROFILE_DETAILS = new TypeReference<>() {
  };
  private static final TypeReference<List<AboutResumeEntry>> RESUME_ENTRIES = new TypeReference<>() {
  };
  private static final TypeReference<List<AboutContactItem>> CONTACT_ITEMS = new TypeReference<>() {
  };
  private static final TypeReference<List<AboutSocialLink>> SOCIAL_LINKS = new TypeReference<>() {
  };

  private final AboutContentRepository aboutContents;
  private final ObjectMapper objectMapper;

  public AboutContentService(AboutContentRepository aboutContents, ObjectMapper objectMapper) {
    this.aboutContents = aboutContents;
    this.objectMapper = objectMapper;
  }

  @Transactional
  public AboutContentResponse get() {
    return toResponse(getOrCreateMainContent());
  }

  @Transactional
  public AboutContentResponse update(AboutContentRequest request) {
    var content = getOrCreateMainContent();
    apply(content, request);
    return toResponse(content);
  }

  private AboutContent getOrCreateMainContent() {
    return aboutContents.findByContentKey(MAIN_KEY)
      .orElseGet(() -> {
        var content = new AboutContent();
        content.setContentKey(MAIN_KEY);
        apply(content, defaultRequest());
        return aboutContents.save(content);
      });
  }

  private void apply(AboutContent content, AboutContentRequest request) {
    content.setPortraitImageUrl(clean(request.portraitImageUrl()));
    content.setWechatQrImageUrl(clean(request.wechatQrImageUrl()));
    content.setProfileDetails(toJson(normalizeProfileDetails(request.profileDetails())));
    content.setResumeEntries(toJson(normalizeResumeEntries(request.resumeEntries())));
    content.setContactHeading(clean(request.contactHeading()));
    content.setContactItems(toJson(normalizeContactItems(request.contactItems())));
    content.setSocialLinks(toJson(normalizeSocialLinks(request.socialLinks())));
  }

  private AboutContentResponse toResponse(AboutContent content) {
    return new AboutContentResponse(
      content.getId(),
      content.getPortraitImageUrl(),
      content.getWechatQrImageUrl(),
      fromJson(content.getProfileDetails(), PROFILE_DETAILS),
      fromJson(content.getResumeEntries(), RESUME_ENTRIES).stream()
        .sorted(Comparator.comparing(entry -> entry.sortOrder() == null ? 0 : entry.sortOrder()))
        .toList(),
      content.getContactHeading(),
      fromJson(content.getContactItems(), CONTACT_ITEMS),
      fromJson(content.getSocialLinks(), SOCIAL_LINKS),
      content.getCreatedAt(),
      content.getUpdatedAt()
    );
  }

  private AboutContentRequest defaultRequest() {
    return new AboutContentRequest(
      "",
      "",
      List.of(
        new AboutProfileDetail("基本信息", "林国娇 · 女 · 山东青岛", "user", null, true),
        new AboutProfileDetail("本科", "山东科技大学 软件工程", "graduation-cap", null, false),
        new AboutProfileDetail("硕士", "中国科学院大学 计算机技术", "graduation-cap", null, false),
        new AboutProfileDetail("手机", "your-phone-number", "phone", "your-phone-number", false),
        new AboutProfileDetail("邮箱", "you@example.com", "mail", "you@example.com", false)
      ),
      List.of(
        new AboutResumeEntry(
          "Project Resume",
          "墨墨知 —— AI 论文研究平台（多 Agent + RAG + 内容社区）",
          "独立开发 · 已上线 momozhi.com",
          "2025.XX – 至今",
          List.of("Python", "FastAPI", "LangGraph", "RabbitMQ", "MySQL", "Redis", "Milvus", "MongoDB", "MinIO", "MCP", "Docker", "Nginx", "ragas", "DeepEval", "LangSmith"),
          "项目描述",
          "面向科研人群的 AI 论文平台：论文经多 Agent 流水线深度解析后沉淀为用户的可检索记忆，支撑带引用门禁的研究问答（AI 实验室）、灵感卡片与研究计划生成，并经规则推荐分发为内容社区。",
          "项目亮点",
          List.of(
            new AboutResumeHighlight("多 Agent 分析流水线", "基于 LangGraph 构建 12 节点论文解析流水线：取数、图表摄取、分类、5 个分节子代理并行、汇总、Critic 评审、3 写手并行、入库；修复多源汇入“任一触发”竞态，以等齐屏障、齐套断言和 reducer 合并共享状态。"),
            new AboutResumeHighlight("异步任务可靠性", "长耗时解析以 RabbitMQ 解耦，配合持久化、DLQ、1m/5m/30m 三档 TTL 延迟重试；MySQL 状态机兜幂等，采用 claim 抢占、120s 租约、30s 心跳和孤儿回收，实现“至少一次投递 + 幂等处理”的等效 exactly-once。"),
            new AboutResumeHighlight("RAG 与论文记忆", "正文、图表、表格切块后双写 MySQL + Milvus；检索链路为 dense 30 + BM25 sparse 30 双路召回、RRF(k=60) 融合、rerank 取 20、终选 8；严格校验 [C#] 引用真实性，失败降温重试，再失败拒答。"),
            new AboutResumeHighlight("科研 Agent 编排", "AI 实验室采用“规则优先意图路由 + 确定性查询规划 + 有界自反思”的 Plan-and-Execute 架构；LangGraph SQL checkpointer/Store 支持会话恢复与跨会话记忆，SSE 结构化事件流支撑断线恢复。"),
            new AboutResumeHighlight("多租户隔离与安全", "修复“以提示词做用户隔离”的真实漏洞，私有检索切至 Milvus filter 引擎级硬过滤；入库层拒绝私有文档进入共享库；外部内容入模前做提示注入扫描，MCP 工具网关加入白名单、审批令牌、串行锁、超时和脱敏审计。"),
            new AboutResumeHighlight("成本与稳定性治理", "实现请求级三重预算闸：12 次 LLM 调用、12 万 token、300 秒；ContextVar 贯穿调用链，在 LLM 客户端咽喉点先检后记账；外部依赖按核心/增强分级降级，LLM 客户端支持代理/直连双路径与坏路径冷却。"),
            new AboutResumeHighlight("评测与可观测", "自研确定性 Agent Harness，保留真实流水线、替换 LLM/MCP/DB/MQ 叶子；结合 ragas、DeepEval、LangSmith 做质量门禁和 trace；覆盖双 health、任务双状态机、usage 成本核算与启动期轻量迁移。"),
            new AboutResumeHighlight("生产部署与线上排障", "独立完成 Docker Compose 全栈上线，配置 Nginx 分流、HTTPS、MinIO 预签名媒体子域；上线首日定位连接池 ping 随机 500 事故，锁定 PyMySQL 与 SQLAlchemy 依赖版本组合完成修复。")
          ),
          1
        ),
        new AboutResumeEntry(
          "Project Resume",
          "多模态客服 Agent —— 基于混合 RAG 与图文对齐协议的电商售后问答系统",
          "独立开发",
          "2026.XX – 至今",
          List.of("Python", "FastAPI", "FAISS", "BM25", "BGE-Embedding", "BGE-Reranker", "RRF", "HyDE", "Qwen-VL", "DeepSeek", "Redis", "DeepEval", "SSE"),
          "项目描述",
          "面向电商售后与产品手册问答场景，独立设计并实现图文混合输入/输出的客服 Agent：用户上传产品图、故障图、订单截图提问，系统基于产品手册证据生成“文本 + 手册配图”的结构化回复。全链路覆盖图片理解、混合检索、受控生成、幻觉治理与离线评测，400 题评估集上提交审计通过率 96.25%。",
          "项目亮点",
          List.of(
            new AboutResumeHighlight("Agent 链路编排", "采用 Workflow 主干 + 局部 LLM 决策架构，将请求拆为图片理解、会话上下文补全、意图识别与 Query 增强、产品确认、条件触发 HyDE、三路混合检索、受控生成、幻觉/质量/审计三层校验的可观测链路，全程 trace 可回放。"),
            new AboutResumeHighlight("多模态图文对齐协议", "设计 <PIC> 与 image_ids 的前后端渲染协议；建库期将手册图片临时编号为 <PIC_N> 随 chunk 切分后反查绑定，检索期按“宽召回、窄注入”构建候选图片池，生成后硬校验数量、顺序与候选集合法性，对齐率与图片资源可用率均达 100%。"),
            new AboutResumeHighlight("混合 RAG 检索", "构建 FAISS 语义、BM25 关键词、图片 Caption 三路召回，经 RRF 排名融合与 BGE-Reranker-v2-m3 精排、分数断崖动态截断；手册级 Top5 命中率 94.87%，MRR 0.93。"),
            new AboutResumeHighlight("防幻觉与质量治理", "实现“规则硬校验 → LLM 事实核查 → 高风险话术兜底”的分层后置治理，结合 Reflexion 将审计失败原因结构化为重试约束；幻觉率 2.75%，提交审计通过率 96.25%。"),
            new AboutResumeHighlight("评估体系与上线门禁", "设计检索、图片、生成、门禁四层 10 项指标，自研 evidence_hit、neighbor recall 等口径吸收 chunk 切分导致的 ID 漂移；接入 DeepEval 做 LLM-as-a-Judge 软质量评估，忠实度 0.9734。"),
            new AboutResumeHighlight("多模型协作与工程化", "按职责解耦 Vision、Embedding、Reranker、主生成、Judge 五类模型，OpenAI-compatible 统一封装；FastAPI 提供 /chat、multipart 上传与 SSE 流式接口，Redis 会话记忆，Reranker 懒加载失败回退 RRF。"),
            new AboutResumeHighlight("Badcase 数据闭环", "通过指标组合将图片配错问题定位到候选图召回层，离线为 2,597 张手册图生成视觉 caption 并接入检索文本，在全人工确认的 gold v3 标签集上做 before/after 全量回归验证收益。")
          ),
          2
        ),
        new AboutResumeEntry(
          "Publication Resume",
          "GUME: Graphs and User Modalities Enhancement for Long-Tail Multimodal Recommendation",
          "第一作者 ｜ arXiv:2407.12338 ｜ 中科院计算机网络信息中心 & 中科院大学",
          "2024",
          List.of("长尾多模态推荐", "图增强", "用户模态表征", "对比学习", "推荐去噪"),
          "论文描述",
          "针对多模态推荐（MMRS）中长尾物品交互稀疏、用户模态表征过于简单两大被忽视的问题，提出 GUME 框架，在四个公开 Amazon 数据集上达到 SOTA。实现方式：基于 MMRec 框架与 PyTorch 实现，代码与数据已在 GitHub 开源。",
          "论文亮点",
          List.of(
            new AboutResumeHighlight("图增强", "基于物品间多模态相似度（KNN/余弦）识别“语义邻居”，将其边注入用户-物品交互图，提升长尾物品连通性并缓解冷启动；图初始化后冻结以兼顾效率。"),
            new AboutResumeHighlight("用户模态增强", "为用户构建“显式交互特征”（历史偏好，含 coarse/fine-grained 属性分离重聚合）与“扩展兴趣特征”（潜在偏好），用 InfoNCE 最大化二者互信息，并结合 SimGCL 式噪声增强提升泛化能力。"),
            new AboutResumeHighlight("内外双视角对齐去噪", "内部用高斯参数化对齐视觉/文本模态，外部用 InfoNCE 对齐行为与模态特征，削弱与推荐无关的模态噪声。"),
            new AboutResumeHighlight("实验效果", "对比 9 个 baseline，在 Sports/Clothing/Electronics 上 Recall@20 分别提升 2.28%/3.54%/3.82%，NDCG@20 分别提升 3.13%/5.67%/2.65%；消融、长尾分组、t-SNE 可视化验证各模块有效性。"),
            new AboutResumeHighlight("开源实现", "代码与数据已在 GitHub 开源；基于 MMRec 框架与 PyTorch 实现，在四个公开 Amazon 数据集上达到 SOTA。")
          ),
          3
        )
      ),
      "连接我的世界",
      List.of(
        new AboutContactItem("Email Me", "you@example.com", "mail"),
        new AboutContactItem("Location", "北京", "map-pin"),
        new AboutContactItem("Education", "中国科学院大学", "graduation-cap")
      ),
      List.of(
        new AboutSocialLink("Github", "https://github.com/GuojiaoLin?tab=repositories", "globe")
      )
    );
  }

  private List<AboutProfileDetail> normalizeProfileDetails(List<AboutProfileDetail> values) {
    return values == null ? List.of() : values.stream()
      .filter(item -> item != null && !clean(item.label()).isBlank() && !clean(item.value()).isBlank())
      .map(item -> new AboutProfileDetail(
        clean(item.label()),
        clean(item.value()),
        clean(item.icon()).isBlank() ? "user" : clean(item.icon()),
        clean(item.copyValue()).isBlank() ? null : clean(item.copyValue()),
        Boolean.TRUE.equals(item.wide())
      ))
      .toList();
  }

  private List<AboutResumeEntry> normalizeResumeEntries(List<AboutResumeEntry> values) {
    return values == null ? List.of() : values.stream()
      .filter(item -> item != null && !clean(item.title()).isBlank())
      .map(item -> new AboutResumeEntry(
        clean(item.category()).isBlank() ? "Project Resume" : clean(item.category()),
        clean(item.title()),
        clean(item.meta()),
        clean(item.period()),
        cleanList(item.techStack()),
        clean(item.descriptionLabel()).isBlank() ? "项目描述" : clean(item.descriptionLabel()),
        clean(item.description()),
        clean(item.highlightsLabel()).isBlank() ? "项目亮点" : clean(item.highlightsLabel()),
        normalizeHighlights(item.highlights()),
        item.sortOrder() == null ? 0 : item.sortOrder()
      ))
      .toList();
  }

  private List<AboutResumeHighlight> normalizeHighlights(List<AboutResumeHighlight> values) {
    return values == null ? List.of() : values.stream()
      .filter(item -> item != null && !clean(item.title()).isBlank() && !clean(item.detail()).isBlank())
      .map(item -> new AboutResumeHighlight(clean(item.title()), clean(item.detail())))
      .toList();
  }

  private List<AboutContactItem> normalizeContactItems(List<AboutContactItem> values) {
    return values == null ? List.of() : values.stream()
      .filter(item -> item != null && !clean(item.label()).isBlank() && !clean(item.value()).isBlank())
      .map(item -> new AboutContactItem(
        clean(item.label()),
        clean(item.value()),
        clean(item.icon()).isBlank() ? "mail" : clean(item.icon())
      ))
      .toList();
  }

  private List<AboutSocialLink> normalizeSocialLinks(List<AboutSocialLink> values) {
    return values == null ? List.of() : values.stream()
      .filter(item -> item != null && !clean(item.label()).isBlank() && !clean(item.url()).isBlank())
      .map(item -> new AboutSocialLink(
        clean(item.label()),
        clean(item.url()),
        clean(item.icon()).isBlank() ? "globe" : clean(item.icon())
      ))
      .toList();
  }

  private List<String> cleanList(List<String> values) {
    return values == null ? List.of() : values.stream()
      .map(this::clean)
      .filter(value -> !value.isBlank())
      .toList();
  }

  private String clean(String value) {
    return value == null ? "" : value.trim();
  }

  private String toJson(Object value) {
    try {
      return objectMapper.writeValueAsString(value);
    } catch (JsonProcessingException error) {
      throw new IllegalArgumentException("Cannot serialize about content.", error);
    }
  }

  private <T> T fromJson(String json, TypeReference<T> typeReference) {
    try {
      return objectMapper.readValue(json, typeReference);
    } catch (JsonProcessingException error) {
      throw new IllegalArgumentException("Cannot read about content.", error);
    }
  }
}
