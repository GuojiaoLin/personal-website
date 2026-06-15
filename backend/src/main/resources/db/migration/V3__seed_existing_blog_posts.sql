-- Seed frontend Markdown blog posts into the editable admin database.
-- Draft Markdown posts are intentionally skipped.

insert into blog_posts (
  project_id,
  title,
  slug,
  category,
  summary,
  content_markdown,
  blog_order,
  cover_image_url,
  status,
  published_at
)
select
  projects.id,
  '我做了一个多模态客服 Agent：从前端、后端到 RAG 的完整架构拆解',
  'mmcsa/2026-05-31-mmcs-agent-overview',
  '架构复盘',
  '这篇文章不是站在旁观者角度介绍一个项目，而是站在项目负责人和核心开发者角度，复盘我为什么这样设计这套多模态客服 Agent，以及它怎么从一个用户问题走到有证据的客服回答。',
  '## 1. 项目背景：为什么普通客服机器人不够用

我一开始做这个项目的时候，很快发现一个问题，电商售后客服并不是一个简单的 FAQ 问答场景。

普通 FAQ 的前提是，用户能把问题说清楚，知识库里有一条标准答案，系统只要匹配过去就行。但真实售后里，用户经常只发一句“这个怎么不亮了”，或者直接上传一张故障图。更麻烦的是，问题背后可能同时牵涉产品型号、安装步骤、物流状态、订单截图、故障现象和售后政策。

单轮文本 RAG 也不够。它可以从手册里搜一段文字，但很难判断用户上传的是产品实物图、订单截图，还是一张无关图片；也很难知道某一步需要插入哪张手册配图。产品手册本身不是纯文本，里面有大量图片，回答里如果只给文字，用户可能仍然不知道螺丝该拧在哪里、线该插到哪里、故障灯长什么样。

所以我对这个项目的定位很明确，它不是一个“模型接入 Demo”，也不是“把手册丢进向量库”的练习题。它真正要解决的是一套客服业务链路：用户发来文字和图片后，系统要理解问题、找到证据、选择图片、控制风险，再给出可以被前端渲染的回答。

            这个项目真正要解决的不是“让模型回答”，而是“让模型基于证据、结合图片、按客服流程可靠回答”。

这也是我在架构上最坚持的一点。大模型很强，但客服系统不能只追求“像人在回答”。售后场景里，错误回答会带来真实成本，比如误导用户自行拆机、编造不存在的保修政策、把别的产品说明套到当前产品上。我的设计重点放在证据、约束和闭环上，而不是只把回答写得更顺。

## 2. 输入输出：系统到底处理什么

从工程角度看，这个系统的输入不只是用户的一句话。它接收的是一个多源信息包。

用户侧输入

文本问题、上传图片、会话 ID，以及可能存在的商品型号、订单号、物流信息等结构化字段。

知识侧输入

产品手册文本、手册图片、图片 caption、章节位置和图片 ID 映射关系。

上下文输入

历史会话里已经确认过的产品、型号、问题阶段和用户补充信息。

模型侧输入

检索证据、图片理解结果、意图分类结果、Prompt 约束和候选配图集合。

输出也不是简单的一段自然语言。面向用户，系统要返回结构化客服回答，最好能按步骤告诉用户怎么排查、怎么安装、需要补充什么信息。必要时，回答正文会插入 `<PIC>` ，同时返回对应的 image_ids 。面向系统内部，还会保留检索结果、意图分类结果、质量检查结果和日志信息，方便后续评估。
`<PIC>` 不是普通占位符。它是前端渲染手册配图的锚点，必须和 image_ids 严格一一对应。正文里出现第一个 `<PIC>` ，前端就应该渲染 image_ids[0] 对应的图片；第二个 `<PIC>` ，对应 image_ids[1] 。

这个约束看起来细，但它很重要。因为在安装、故障排查这类场景里，图片不是装饰，而是操作依据。一个错位的图片，比没有图片更危险。

## 3. 总体架构：从前端到后端再到 Agent / RAG

我没有让前端直接调用大模型。前端只负责交互、上传、会话和渲染，真正的业务逻辑全部收敛到 FastAPI 后端。这样做的原因很简单，客服流程里有太多不能暴露给前端的东西，比如模型路由、检索策略、Prompt、幻觉检测、质量检查和日志。把这些逻辑放在后端，系统才可控。

后端也没有把 LLM 当成黑盒。一次请求进入后，会被 Agent 编排层拆成多个阶段：图片理解、意图识别、Query 增强、混合检索、重排序、Prompt 构造、回答生成、幻觉检测、质量自检和图片对齐。RAG 在这里也不是“搜一段文本”这么简单，它同时服务于文本证据、图片证据和回答约束。

Mermaid 架构图
```mermaid
flowchart LR
  U["用户文本 + 图片"] --> FE["前端 HTML 页面输入、上传、渲染 PIC"]
  FE --> API["FastAPI 后端/chat /chat/upload"]
  API --> Parser["请求解析与参数校验"]
  Parser --> Agent["Agent 编排层handle_request"]

  Agent --> Vision["图片理解模块类型判断 / OCR / 故障描述 / 型号提取"]
  Agent --> Intent["意图识别模块售后 / 安装 / 故障 / 物流 / 产品咨询"]
  Vision --> Query["Query 增强融合图片信息、历史上下文、产品型号"]
  Intent --> Query

  Query --> RAG["RAG 混合检索模块"]
  RAG --> FAISS["FAISS 向量检索BGE Embedding"]
  RAG --> BM25["BM25 关键词检索产品词、型号词、故障词"]
  RAG --> Caption["图片 Caption 检索手册图片、章节、附近文本"]
  FAISS --> Merge["RRF 融合"]
  BM25 --> Merge
  Caption --> Merge
  Merge --> Reranker["BGE Reranker 重排序可配置，失败回退 RRF"]

  Reranker --> Prompt["Prompt 构造模块证据、候选图、输出契约"]
  Prompt --> LLM["LLM 生成模块默认远程；关闭 REMOTE_ONLY 后本地优先"]
  LLM --> Guard["幻觉检测 / 质量自检事实校验、风险控制、重生成"]
  Guard --> Align["图片选择与 PIC 对齐answer + image_ids"]
  Align --> API
  API --> FE

  API --> Session["Redis 可选会话存储默认也支持内存会话"]
  Agent --> Eval["评估与日志模块trace、metrics、检索与回答质量"]
  Guard --> Eval
```

当前项目里已经落地的是 FastAPI 服务、前端 HTML 页面、Agent 编排、FAISS 向量检索、BM25 检索、图片 caption 检索、Reranker 可选接入、Redis 可选会话、日志和评估入口。模型调用默认按 REMOTE_ONLY=1 走远程 OpenAI 兼容接口；如果关闭这个配置，才会进入本地优先、失败回退远程的路径。像 Milvus、MinIO、MongoDB、MySQL 这类组件，我更倾向于把它们放在生产化扩展里讲：Milvus 承接大规模向量库，MinIO 管图片对象存储，MongoDB 存非结构化会话和评估样本，MySQL 存订单、商品、用户等强结构化业务数据。这个区分很重要，因为面试里我不想把“设计预留”说成“已经上线”。

## 4. 一次请求怎么流动：从 /chat 到 handle_request

我把一次请求设计成一个可观察、可拆解、可回退的流程。看起来步骤很多，但每一步都有它存在的理由。

Mermaid 请求流程图
```mermaid
flowchart TD
  A["用户输入问题并上传图片"] --> B["前端发送 query、images、session_id 到 /chat"]
  B --> C["FastAPI 参数校验统一请求格式"]
  C --> D["handle_request进入 Agent 流程"]
  D --> E{"是否有图片"}
  E -->|有| F["视觉理解图片类型、OCR、故障描述、型号线索"]
  E -->|无| G["读取历史上下文"]
  F --> G
  G --> H["意图识别售后、安装、故障、物流、产品咨询"]
  H --> I["Query 增强融合意图、图片信息、产品型号"]
  I --> I2["HyDE 条件扩展短 query / 产品不明确时补召回"]
  I2 --> J["FAISS 语义召回"]
  I2 --> K["BM25 关键词召回"]
  I2 --> L["图片 Caption 召回"]
  J --> M["融合排序与 Reranker"]
  K --> M
  L --> M
  M --> N["选择手册文本证据和候选图片"]
  N --> O["构造证据约束 Prompt"]
  O --> P["LLM 生成结构化回答"]
  P --> Q["幻觉检测事实依据、图片候选、PIC 数量"]
  Q --> R["质量检查完整性、风险表达、配图合理性"]
  R --> S{"是否需要修复或重生成"}
  S -->|需要| O
  S -->|通过| T["返回 answer、image_ids、trace"]
  T --> U["前端按 PIC 锚点渲染手册配图"]
```

### 第一步，前端只提交事实，不做业务判断

用户在前端输入问题并上传图片后，前端把文本、图片和会话 ID 发到 /chat 。前端不判断“这是不是售后问题”，也不决定要不要检索手册。这样可以减少前端分支，让业务策略集中在后端维护。

### 第二步，FastAPI 负责把入口收干净

FastAPI 先做参数校验和请求整理，然后把统一格式的请求交给 handle_request 。这一步看似普通，但它决定了后面所有模块能不能用同一套数据契约协作。尤其是图片上传、JSON 请求、会话 ID 这些字段，如果入口不统一，Agent 流程后面会非常乱。

### 第三步，Agent 先理解，再检索

我没有让系统一上来就检索。它会先看是否有图片，如果有，就做图片类型判断和信息抽取。订单截图和产品故障图完全不是一回事，前者可能要走物流或售后流程，后者更可能需要结合产品手册排查。然后系统做意图识别，判断用户是在问安装、故障、物流、产品参数，还是复合问题。

### 第四步，RAG 同时找文本证据和图片证据

Query 增强后，系统会先判断是否需要 HyDE：如果问题太短、产品不明确，就让模型补一段“假设手册段落”用于扩展检索 query；否则直接用原检索 query。随后系统同时走 FAISS 语义检索、BM25 关键词检索和图片 caption 检索。这样设计是因为产品手册里有大量相似段落，仅靠语义相似度容易把相近型号或相近步骤混在一起。BM25 可以抓住型号、部件名、故障词；向量检索负责语义扩展；图片 caption 则把手册配图纳入证据链。

### 第五步，生成之后必须检查

LLM 生成回答后，系统不会直接返回。幻觉检测会检查回答是否超出检索证据， image_ids 是否来自候选图片集合，正文中的 `<PIC>` 数量是否和 image_ids 对齐。质量检查会继续看回答是否完整、是否过度承诺、是否把高风险售后结论说得太绝对。必要时会触发修复或有限次数重生成。

## 5. 这个项目最难的点：不是回答，而是有依据地回答

做这个项目时，我最大的感受是，Agent 项目难的地方通常不在“让模型说话”。模型当然会说话，而且说得很像。但客服系统要的是另外一件事：它说的每一句话最好都能回到证据上。

### 难点一：多模态输入不稳定

用户上传的图片可能是产品实物图、故障截图、订单截图、物流截图、安装步骤照片，也可能是一张完全无关的图片。系统不能看到图片就强行回答，更不能把所有图片都当作产品故障图处理。

所以我把图片理解放在 Agent 流程前段。它先判断图片类型，再提取关键信息。比如订单截图更偏向售后和物流，产品实物图更适合抽取型号，故障截图可能要提取屏幕文字或异常状态。这样后面的意图识别和检索 query 才不会从一开始就跑偏。

### 难点二：RAG 检索不能只看语义相似度

产品手册里经常有很多长得很像的段落，比如不同型号的安装说明、相似配件的故障排查步骤、不同语言版本的同类说明。只靠向量相似度，召回结果有时看起来相关，但落到具体产品上就是错的。

我用了混合检索思路：FAISS 负责语义召回，BM25 抓关键词和型号词，HyDE 在问题过短或缺少产品信息时补一段假设性查询文本，Reranker 再对候选 chunk 做精排。图片 caption 也参与召回，因为很多手册图片旁边的文字，正好能说明图片对应的安装步骤或部件位置。

这样做的目的不是堆技术名词，而是提高证据命中率。检索命中率上不去，后面的生成和幻觉治理都会很被动。

### 难点三：PIC 和 image_ids 必须严格对齐

在客服回答里插入图片，不是为了让界面好看，而是为了帮助用户完成安装、排查或确认故障。比如回答里说“请参考下图检查排水管连接位置”，那这张图必须真的是排水管连接图，不能是另一个型号的控制面板图。

所以我没有让模型自由发挥选图，而是把图片 caption、手册章节、检索 chunk 和候选 image_ids 绑定起来。模型只能从候选图片里选择，回答里每出现一个 `<PIC>` ，都必须和返回的 image_ids 对上。这个规则非常“死板”，但客服场景恰恰需要这种死板。

### 难点四：幻觉治理

大模型最危险的地方，是它可以把没有依据的话说得非常像真的。产品规格、保修政策、维修结论、拆机建议，这些内容如果编错了，会直接变成售后风险。

我的做法是把约束分成两层。第一层在 Prompt 里要求模型只能基于检索证据回答，不确定就要求用户补充信息，不允许编造产品规格和售后政策。第二层在生成后做检查，重点看回答是否超出证据、图片是否错配、是否有过度承诺。对高风险结论，系统倾向保守表达，比如建议联系售后，而不是直接给出维修结论。

这个点在面试里很值得讲。因为它能说明我不是只会调 API，而是在把大模型放进一个有边界、有证据、有风险控制的业务流程里。

## 6. 面试可讲亮点：这个项目体现了哪些 Agent 应用开发能力

如果把这个项目放到求职语境里，我不会把它包装成“用了很多 AI 技术”。我会讲它体现了哪些 Agent 应用开发能力。

- 多模态理解能力： 系统能同时处理文字和图片输入，并根据图片类型决定后续流程，而不是把所有图片都丢给模型做一次描述。

- Agent 流程编排能力： 项目不是单 prompt 问答，而是把任务拆成图片理解、意图识别、检索、生成、检查、修复等阶段，每个阶段有清晰职责。

- RAG 工程能力： 检索链路不是单一向量库，而是 FAISS、BM25、图片 caption、HyDE、Reranker 的组合，目标是让证据更准。

- 后端工程能力： 用 FastAPI 承接前端请求，统一请求格式，提供 /chat 、上传、健康检查、指标等接口，把模型能力封装成可调用服务。

- 幻觉治理能力： 通过证据约束、候选图片限制、 `<PIC>` 对齐、质量检查和有限重生成，减少看似合理但无依据的回答。

- 评估闭环能力： 系统保留检索结果、意图分类、回答质量和日志信息，后续可以量化为检索命中率、图片匹配率、回答通过率、重生成率等指标。

- 产品思维： 设计不是为了堆技术，而是围绕真实客服问题展开，比如不完整问题、图片输入、手册依据、售后风险和前端渲染。

我觉得 Agent 应用开发岗位最看重的，往往不是“你知道多少模型名字”，而是你能不能把模型放进真实系统里，让它稳定地解决一个业务问题。这个项目对我来说就是一次完整训练：从需求拆解、架构设计、RAG 检索、后端接口、前端交互，到幻觉治理和评估闭环，都不是孤立模块，而是围绕一个目标工作。

## 7. 最后给一段适合面试中口述的总结

### 面试题：你做过什么 Agent 项目？

1 分钟项目介绍

我做过一个面向电商售后和产品手册问答的多模态客服 Agent。它不是普通的文本问答机器人，用户可以输入问题，也可以上传产品故障图、订单截图、安装截图这类图片。我的主要工作是把这个问题拆成一套完整工程链路：前端负责输入和图片渲染，FastAPI 后端提供 /chat 接口，核心 Agent 负责图片理解、意图识别、Query 增强、RAG 检索、回答生成和质量检查。

RAG 部分我用了混合检索思路，结合 FAISS 语义检索、BM25 关键词检索、图片 caption 和 Reranker，尽量让回答有手册依据。项目里还有一个比较关键的约束是 `<PIC>` 和 image_ids 必须严格对齐，因为前端要根据这个锚点渲染手册配图。整体上，这个项目让我比较完整地实践了 Agent 应用开发，不只是调用模型 API，而是把模型、检索、后端接口、前端交互和幻觉治理串成一个可运行的客服系统。

## 8. 面试官可能追问的问题和参考回答

### 1. 你这个项目和普通 RAG 问答有什么区别？

普通 RAG 更像是“用户问一句，系统检索一段文本，再让模型回答”。这个项目多了几个关键约束：它要处理图片输入，要识别用户意图，要从产品手册里同时找文本证据和图片证据，还要保证回答里的 `<PIC>` 和 image_ids 对齐。也就是说，它不只是问答，而是一个面向客服流程的 Agent 系统。

### 2. 为什么要同时用 FAISS 和 BM25？只用向量检索不行吗？

只用向量检索在很多开放问答里可以工作，但产品手册场景里有大量型号、部件名、故障词，这些词对正确召回非常重要。向量检索擅长语义相似，BM25 更擅长抓精确关键词。我把两者结合起来，是为了减少“语义看起来相关，但产品或步骤不对”的问题。后面再通过 Reranker 精排，提高最终证据质量。

### 3. 你怎么处理用户上传图片？

我没有把图片简单当成一段描述塞给模型，而是先做图片类型判断。它可能是产品图、故障截图、订单截图、物流截图、安装步骤照片，也可能无关。不同类型会影响后续流程，比如订单截图更偏售后和物流，产品图更适合抽型号，故障截图更适合提取异常现象。图片理解结果会参与 Query 增强和意图识别。

### 4. 你怎么降低大模型幻觉？

我主要做了三件事。第一，Prompt 里明确要求只能基于检索证据回答，不确定就让用户补充信息。第二，生成后检查回答是否超出证据，尤其是产品规格、售后政策、维修结论这类高风险内容。第三，图片也做硬约束， image_ids 必须来自检索候选集合， `<PIC>` 数量必须和图片 ID 对齐。必要时会触发修复或有限重生成。

### 5. 如果要生产化，你会怎么扩展这套架构？

当前版本更适合项目验证和中小规模知识库，向量检索主要用 FAISS，图片和手册数据也偏本地化。如果要生产化，我会把向量索引迁到 Milvus 这类向量数据库，把图片放到 MinIO 这类对象存储，把订单、商品、用户这类强结构化数据放到 MySQL，把会话、评估样本、日志这类更灵活的数据放到 Redis 或 MongoDB。这样系统可以支撑更大规模的数据和更清晰的服务边界。',
  1,
  null,
  'PUBLISHED',
  '2026-05-31 00:00:00+08'::timestamptz
from projects
where projects.slug = 'mmcsa'
on conflict (slug) do nothing;

insert into blog_posts (
  project_id,
  title,
  slug,
  category,
  summary,
  content_markdown,
  blog_order,
  cover_image_url,
  status,
  published_at
)
select
  projects.id,
  'RAG 不是向量库搜索：这个客服 Agent 里的检索链路到底怎么跑',
  'mmcsa/2026-06-01-mmcs-rag-retrieval-pipeline',
  '检索链路',
  '这篇文章复盘我在多模态客服 Agent 里怎么设计 RAG：从手册解析、chunk 切分、图片绑定，到 FAISS、BM25、RRF、HyDE、Reranker 和最终证据组装。重点不是讲概念，而是讲这些东西在真实客服场景里到底解决了什么问题。',
  '## 1. 开篇：RAG 不是向量库搜索

很多 RAG Demo 的流程都很顺：用户问题，做 embedding，去向量库拿 topK，把结果拼进 Prompt，让 LLM 回答。这个流程能跑，但放到电商售后客服里，很快就会露出问题。

用户不会总是把问题写完整。他可能只说“这个怎么装”“为什么亮红灯”“能退吗”，甚至只上传一张产品图或订单截图。产品手册里又有大量相似章节，语义相似并不等于证据正确。比如“红灯闪烁”和“红灯常亮”可能都很接近，但处理方式完全不一样。

更麻烦的是，这个项目的手册不是纯文本。手册里有 `<PIC>` 占位符，也有对应的 image_ids 。如果回答需要插图，系统不仅要找到文字证据，还要找到正确图片，并且让回答里的 `<PIC>` 顺序和 image_ids 顺序严格对应。

            RAG 的核心不是“向量库搜索”，而是“围绕业务问题构建稳定的证据召回链路”。

所以我在这个客服 Agent 里做 RAG 时，没有把重点放在“怎么查到一段相似文本”上，而是把它当成一个证据召回系统来设计。它要回答三个问题：证据从哪里来，证据怎么排序，证据怎么安全地交给模型使用。

## 2. 知识库格式：手册 JSON、PIC、图片 ID 如何对齐

项目里的知识库不是简单的 txt 文档。源码里由 src/retrieval/knowledge_base_builder.py 的 KnowledgeBaseBuilder 负责解析手册，核心数据结构是 ChunkData 和 ImageManifestEntry 。

当前实现支持两类手册格式。主要格式是 JSON 列表 [content_str, image_ids] ，其中 content_str 里包含 `<PIC>` ，图片 ID 列表按 `<PIC>` 出现顺序一一映射。兼容格式是旧的 Markdown 风格，用 [IMG:xxx] 标记图片。

ChunkData

包含 chunk_id 、 text 、 manual_name 、 section_title 、 image_ids 、 pic_count 、 metadata 等字段。

ImageManifestEntry

记录 image_id 、 manual_name 、 section_title 、 nearby_text 和 order_in_manual ，用于图片候选和 prompt 注入。

这里最关键的是 `<PIC>` 。它不是普通文本，而是模型回答和前端图片渲染之间的锚点。正文里出现第一个 `<PIC>` ，后端返回的第一个 image_id 就应该被渲染到这个位置。这个约束如果不在知识库阶段就处理好，后面再靠模型猜，很容易出错。

源码里的做法是先把每个 `<PIC>` 替换成带序号的
 ，切 chunk 的时候保留这个序号。等 chunk 生成后，再把
 还原成 `<PIC>` ，并通过序号反查对应的 image_id 。这一步解决了一个很实际的问题：哪怕中间做了滑动窗口，图片顺序也不会丢。

简化知识库示例，不是源码完整字段
```
{
  "manual_name": "中文手册/可编程温控器手册",
  "section_title": "安装说明 > 固定底座",
  "text": "将底座对准主机卡槽后向下压紧。<PIC>",
  "image_ids": ["thermostat_01"],
  "pic_count": 1,
  "metadata": {
    "source": "中文手册/可编程温控器手册",
    "section": "固定底座",
    "chunk_index": 3,
    "indexed_pic_indices": [0]
  }
}
```

Mermaid 知识库构建流程图
```mermaid
flowchart TD
  A["data manuals: Chinese and English manuals"] --> B["Read txt and md files"]
  B --> C["KnowledgeBaseBuilder.parse_manual"]
  C --> D{"Manual format"}
  D --> E["JSON content plus image_ids: mark PIC as indexed PIC token"]
  D --> F["Legacy IMG format: collect images by section"]
  E --> G["Split passages by heading"]
  G --> H["Sliding window for long passages: chunk_size 512 and overlap 64"]
  H --> I["Create ChunkData: chunk_id, text, section_title, image_ids, metadata"]
  I --> J["Create ImageManifestEntry: image_id, section_title, nearby_text"]
  F --> I
  J --> K["ImageManifest: attach local paths and save image_manifest.json"]
  I --> L["VectorRetriever plus FAISS"]
  I --> M["BM25Retriever"]
  K --> N["ImageCaptionIndex"]
  L --> O["HybridRetriever"]
  M --> O
  N --> O
```

中文伪代码图：逐节点解释 Mermaid 知识库构建流程

输入与读取
A / B / C

从 `data/manuals` 扫描中文手册和英文手册，只处理 `.txt`、`.md` 这类手册文件。每读到一本手册，就交给 `KnowledgeBaseBuilder.parse_manual` 解析，而不是直接整篇塞进向量库。

得到：manual_name、raw_text

↓

格式分流
D
`Manual format` 是一个分支判断：如果手册是 JSON 列表，就走 `content + image_ids` 路线；如果是旧格式，就走 `IMG` 标记路线。这里先把两种输入格式统一成后面可处理的“正文 + 图片信息”。

决定：JSON 路径或旧格式路径

↓

JSON 路径
E

JSON 手册里正文有 `<PIC>`，旁边有按顺序排列的 `image_ids`。系统先把每个 `<PIC>` 临时改成带编号的图片 token，比如第 0 张、第 1 张、第 2 张，这样后面切 chunk 时仍能知道每个图片占位符对应哪个 image_id。

解决：PIC 和 image_ids 不错位

↓

旧格式路径
F

旧格式手册没有 JSON 图片列表，而是在章节里出现 `IMG` 标记。系统会按章节收集这些图片，把图片和所在章节、附近文字先绑定起来，再合并到后续 chunk 构建流程。

得到：章节级图片信息

↓

按标题切段
G

对解析后的正文先按标题、章节结构切成 passage。这样每个候选文本块天然带有章节语义，比如“安装说明”“故障排查”“参数配置”，后面回答时也能追溯来源。

得到：passages + section_title

↓

滑窗切 chunk
H

如果某个 passage 太长，就用滑动窗口继续切分，例如 `chunk_size = 512`、`overlap = 64`。overlap 的作用是保留前后文，避免把“问题现象”和“解决方法”切散；同时要尽量避免切断图片 token。

得到：可检索的文本块

↓

创建 ChunkData
I

每个 chunk 会被封装成 `ChunkData`，字段包括 `chunk_id`、正文 `text`、章节 `section_title`、绑定图片 `image_ids` 和 `metadata`。如果 chunk 中出现了编号后的图片 token，就反查原始 image_id 并写入 `ChunkData.image_ids`。

得到：chunk ↔ 图片 ↔ 来源章节

↓

创建图片清单
J / K

再为每张手册图创建 `ImageManifestEntry`，记录 `image_id`、所属手册、章节标题、附近文本 `nearby_text` 和本地图片路径。最后保存成 `image_manifest.json`，后面图片召回和前端渲染都依赖它。

得到：image_id ↔ path ↔ nearby_text

↓

建三路索引
L / M / N
`ChunkData` 会进入两条文本索引：一条是 `VectorRetriever + FAISS`，用于语义召回；另一条是 `BM25Retriever`，用于型号、错误码、按钮名等关键词召回。`ImageManifest` 会进入 `ImageCaptionIndex`，用于图片 caption 和附近文字召回。

得到：向量召回 + 关键词召回 + 图片召回

↓

组装混合检索
O

最后把 `VectorRetriever`、`BM25Retriever`、`ImageCaptionIndex` 汇入 `HybridRetriever`。在线请求进来时，系统就可以同时拿到文本证据、关键词证据和候选图片，而不是只靠单一路径。

用于：RAG 召回链路

把上面的 Mermaid 翻译成函数伪代码
```
def build_knowledge_base(manuals_dir, images_dir):
    all_chunks = []
    image_manifest = []

    # A / B / C: 读取手册，并交给 KnowledgeBaseBuilder.parse_manual
    for file in scan_files(manuals_dir, suffixes=[".txt", ".md"]):
        raw_text = read_text(file)
        manual_name = get_manual_name(file)

        # D: 判断手册格式
        if is_json_manual(raw_text):
            # E: JSON 手册：content 里有 PIC，image_ids 按 PIC 顺序排列
            content, image_ids = parse_json_manual(raw_text)
            indexed_text = replace_pic_with_indexed_token(content)
        else:
            # F: 旧格式：按章节收集 IMG 标记
            indexed_text, image_ids = parse_legacy_img_manual(raw_text)

        # G / H: 先按标题切 passage；太长时再滑窗切 chunk
        passages = split_passages_by_heading(indexed_text)
        raw_chunks = []
        for passage in passages:
            if too_long(passage):
                raw_chunks.extend(sliding_window(passage, size=512, overlap=64))
            else:
                raw_chunks.append(passage)

        # I: 创建 ChunkData，并把 chunk 内 PIC 反查成 image_ids
        for chunk_text in raw_chunks:
            bound_image_ids = map_pic_tokens_to_image_ids(chunk_text, image_ids)
            chunk = ChunkData(
                chunk_id=make_chunk_id(manual_name, chunk_text),
                text=restore_pic_token(chunk_text),
                section_title=get_section_title(chunk_text),
                image_ids=bound_image_ids,
                metadata={"manual_name": manual_name},
            )
            all_chunks.append(chunk)

            # J: 为 chunk 相关图片创建 ImageManifestEntry
            for image_id in bound_image_ids:
                image_manifest.append(ImageManifestEntry(
                    image_id=image_id,
                    manual_name=manual_name,
                    section_title=chunk.section_title,
                    nearby_text=extract_nearby_text(chunk.text, image_id),
                ))

    # K: 补本地图片路径，并保存 image_manifest.json
    attach_local_image_paths(image_manifest, images_dir)
    save_json("image_manifest.json", image_manifest)

    # L / M / N: 建三路索引
    vector_retriever = build_vector_retriever_with_faiss(all_chunks)
    bm25_retriever = build_bm25_retriever(all_chunks)
    image_caption_index = build_image_caption_index(image_manifest)

    # O: 组装 HybridRetriever，供在线 RAG 使用
    return HybridRetriever(
        vector_retriever=vector_retriever,
        bm25_retriever=bm25_retriever,
        image_caption_index=image_caption_index,
    )
```

## 3. Chunk 策略：不是随便切 500 字，而是按章节、语义和图片绑定切

chunk 策略在这个项目里非常关键。客服手册不是普通文章，一个安装步骤可能依赖前后步骤，一个故障说明可能同时包含现象、原因和解决方法。图片通常又只对应某个局部步骤。如果切分破坏了文字和 `<PIC>` 的关系，后续图片召回就会错位。

当前实现的策略比较务实：先按手册标题切成 passage，再把短 passage 装箱到 512 字符左右的 chunk，过长 passage 用滑动窗口切分，overlap 是 64。每个 chunk 都带上 manual_name 、 section_title 、 product_keywords 和 metadata 。如果 chunk 里有 `<PIC>` ，就绑定对应的 image_ids ，并记录 pic_count 。

我这么设计，是因为面试官会关心一个问题：你是不是只知道“chunk 大小影响召回”，还是知道业务里 chunk 到底会影响什么。在这个项目里，chunk 影响的不只是召回文本，还影响配图、证据来源和最终回答能不能渲染。

关键伪代码：chunk 构建逻辑
```
def build_chunks(manual_text, image_ids, manual_name):
    indexed = replace_pic_with_global_index(manual_text)  # <PIC> -> <PIC_N>
    passages = split_by_heading(indexed)
    raw_chunks = []

    for passage in passages:
        if len(passage.text) > MAX_CHUNK_SIZE:
            raw_chunks.extend(
                sliding_window(
                    passage.text,
                    size=MAX_CHUNK_SIZE,
                    overlap=CHUNK_OVERLAP,
                    avoid_cutting_pic_token=True
                )
            )
        else:
            raw_chunks.append(pack_with_neighbor_passages(passage))

    chunks = []
    for raw in raw_chunks:
        pic_indices = find_pic_indices(raw.text)
        related_images = [image_ids[i] for i in pic_indices if i < len(image_ids)]
        chunks.append(create_chunk(raw, related_images))

    return chunks
```

这段伪代码背后的思路很简单：先保护图片位置，再谈文本切分。因为一旦 `<PIC>` 和 image_id 的关系在入库时丢掉，后面再做 RRF、Reranker、Prompt 都救不回来。

## 4. 向量检索：BGE Embedding + FAISS 解决语义召回

向量检索在这个项目里解决的是“用户说法和手册说法不一样”的问题。比如用户说“机器一直闪红灯”，手册写的是“状态指示灯红色闪烁表示设备异常”。关键词不完全一致，但语义上是在问同一类故障。

当前实现里， VectorRetriever.index 会对 ChunkData.text 做 embedding，然后写入 FAISSVectorStore 。而 ChunkData.text 在构建时已经把章节标题拼到了正文前面，所以向量检索不只看到正文，也能看到 section_title 带来的上下文。

FAISSVectorStore 使用 faiss.IndexFlatIP ，写入和查询时都会做 L2 normalize，所以内积可以近似作为余弦相似度。它负责的是快速查向量相似的 chunk，不负责判断这个 chunk 是否真能回答问题。

当前实现里，图片 caption 没有简单地塞进每个 chunk 的 embedding 文本，而是通过 ImageCaptionIndex 单独参与召回。后续如果要增强向量召回，可以把 title_path / 正文 / caption / 产品名 / 故障词 组合成更丰富的 embedding text。

可扩展的 embedding text 示例
```
产品：可编程温控器
章节：故障排查 > 显示与指示灯异常
正文：状态指示灯红色闪烁表示设备异常，请检查电源、接线和传感器状态。
图片说明：红色指示灯闪烁示意图
```

我不会把 FAISS 说成 RAG 的全部。FAISS 解决的是“怎么快速查相似向量”，不是“证据是否正确”。这就是为什么后面还要有 BM25、图片 caption 召回、RRF 融合和可选 Reranker。

## 5. 关键词检索：jieba + BM25 解决精确匹配和型号问题

在客服场景里，很多关键信息必须精确匹配。产品型号、错误码、配件名称、按钮名称、指示灯颜色、售后政策关键词，这些东西一旦错了，回答就会直接跑偏。

举个例子，用户问“E03 报错怎么处理”。向量检索可能召回“设备异常”相关段落，但真正需要的是包含 E03 的故障码说明。这个时候 BM25 比向量检索更靠谱，因为它更关心 query 里的词有没有真实出现在文档里。

当前代码里的 BM25Retriever 是手写 BM25 实现，中文场景用 jieba 分词，并通过 product_alias 把产品别名注册到 jieba 用户词典里。它还支持 manual_whitelist 硬过滤、 product_filter 软过滤和 boost_tokens 加权，适合处理产品名、型号、错误码这类强约束词。

关键伪代码：BM25 召回
```
def bm25_retrieve(query, chunks, boost_tokens=None):
    tokenized_query = jieba_cut(query)
    scores = []

    for chunk in chunks:
        doc_tokens = tokenize(chunk.text)
        score = bm25_score(tokenized_query, doc_tokens)

        if hit_boost_tokens(doc_tokens, boost_tokens):
            score *= BOOST_FACTOR

        scores.append((chunk, score))

    return top_k_positive_scores(scores)
```

它和向量检索是互补关系。向量检索负责同义表达和口语化问题，BM25 负责精确词项、型号和错误码。只用其中一个都会有盲区。

## 6. 融合排序：RRF 不是简单加权，而是降低单一路径误判

FAISS 和 BM25 的 score 分布不一样，不能直接拿两个分数相加。向量相似度可能是 0.6、0.7，BM25 可能是 3、10、20，直接加权很容易被某一路分数尺度带偏。

项目里的 HybridRetriever 用 RRF 思路融合结果。通俗讲，它不直接比较原始分数，而是看一个 chunk 在多个召回列表里的排名。如果一个 chunk 同时在向量检索和 BM25 里都排得靠前，它更可能是真正相关的证据。

RRF 公式
```
RRF_score(d) = Σ 1 / (k + rank_i(d))
```

当前代码里还保留了 vector_weight 和 bm25_weight ，默认向量 0.6、BM25 0.4；RRF 平滑常量 rrf_k 是 60。图片 caption 命中的 chunk 也会以额外权重注入 RRF 分数。

关键伪代码：FAISS + BM25 + Caption 的 RRF 融合
```
def rrf_fusion(vector_results, bm25_results, caption_hits, k=60):
    scores = defaultdict(float)
    chunk_map = {}

    for rank, chunk in enumerate(vector_results, start=1):
        scores[chunk.id] += 0.6 * (1 / (k + rank))
        chunk_map[chunk.id] = chunk

    for rank, chunk in enumerate(bm25_results, start=1):
        scores[chunk.id] += 0.4 * (1 / (k + rank))
        chunk_map[chunk.id] = chunk

    for rank, image_id in enumerate(caption_hits, start=1):
        for chunk_id in image_to_chunk_ids[image_id]:
            scores[chunk_id] += 0.2 * (1 / (k + rank))

    return sort_by_score(scores, chunk_map)
```

这个设计解决的不是“排序公式好不好看”，而是降低单一路径误判。向量检索可能错召相似章节，BM25 可能漏召同义表达，RRF 可以让多路都认可的证据更稳定地进入下一阶段。

## 7. 可选 BGE Reranker：从“召回候选”到“精排证据”

Reranker 的位置是在 FAISS、BM25、图片 caption 和 RRF 之后。它不负责全库召回，而是对融合后的少量候选 chunk 做更细的 query-document 匹配。

当前项目里有 src/retrieval/reranker.py ，默认模型名是 BAAI/bge-reranker-v2-m3 ，通过 FlagEmbedding 懒加载。在线服务的运行时配置里 RERANK_ENABLED 默认偏开启，但 config.yaml 示例里写的是关闭，最终以环境变量和实际启动配置为准。它有一个很工程化的处理：如果没有安装 FlagEmbedding ，或者模型加载失败，就回退到 RRF 顺序，不让主流程崩掉。

这个取舍很重要。Reranker 通常比 embedding 检索慢，所以不应该对全库跑。它适合处理 topK 候选，比如先让 FAISS 召回 topK1，BM25 召回 topK2，RRF 融合得到 topK3，再由 Reranker 精排，最后交给 Prompt。

面试里我会如实说：Reranker 是项目里的可配置增强模块。代码已预留并接入 HybridRetriever ，运行时默认值、配置文件示例和部署环境可能不一样；实际效果取决于环境里是否安装了 FlagEmbedding ，以及 RERANK_ENABLED / rerank_enabled 的最终取值。

## 8. 图片召回：image manifest + caption index 怎么工作

图片召回是这个多模态客服 Agent 和普通文本 RAG 最大的差异之一。图片不能交给模型自由决定，因为模型不知道前端实际有哪些图片，可能编造 image_id ，也可能把不相关图片插进回答。

项目里有一张图片资产表，也就是 ImageManifest 。它来自 KnowledgeBaseBuilder.consume_image_manifest() ，记录每张图来自哪本手册、哪个章节、附近文本是什么、在手册里是第几张。 ImageManifest.captions_for 会把 nearby_text 或章节标题渲染成简短 caption，供 Prompt 使用。

另外， ImageCaptionIndex 会把 manual_name 、 section_title 、 nearby_text 和可选的额外 caption 拼成图片检索文本，用 BM25 建索引。这样当用户问“底座怎么装”“红灯闪烁是什么样子”“滤芯在哪里”时，系统不仅能召回文字 chunk，也能通过图片 caption 找到相关 image_id ，再映射回对应 chunk。

Mermaid 检索链路图

这张链路图较长，已放大画布；可以左右拖动底部滚动条查看完整流程。
```mermaid
flowchart LR
  Q["User query with text, vision summary and session context"] --> H{"Need HyDE"}
  H --> HY["HyDEGenerator: hypothetical document for retrieval only"]
  H --> Q2["Retrieval query"]
  HY --> Q2

  Q2 --> V["VectorRetriever with BGE embedding"]
  V --> F["FAISSVectorStore: IndexFlatIP and L2 normalize"]
  Q2 --> B["BM25Retriever: jieba, product aliases and boost_tokens"]
  Q2 --> C["ImageCaptionIndex: manual, section and nearby_text"]

  F --> R["HybridRetriever: RRF fusion"]
  B --> R
  C --> R
  R --> RR{"Reranker available"}
  RR --> BR["BGE Reranker: query-document scoring and cliff cutoff"]
  RR --> TOP["RRF TopK fallback"]
  BR --> TOP
  TOP --> IMG["Candidate image_ids from final chunks and RRF pool"]
  TOP --> CTX["format_context: source, section, text and related images"]
  IMG --> P["Prompt with available images and PIC alignment rules"]
  CTX --> P
  P --> L["LLM generation"]
  L --> G["Hallucination and quality check: image_ids must be candidates"]
```

中文伪代码图：逐节点解释 Mermaid 检索链路

输入节点
Q

图里的 `User query with text, vision summary and session context` 不是原始问题，而是把用户文本、图片理解结果、会话里的商品型号和上一轮上下文先合并。这样“怎么安装”“红灯闪”这类短问题，才能变成可检索的问题。

解决：用户说得不完整

↓

HyDE 开关
H / HY / Q2
`Need HyDE` 是条件判断，不是每次都走。只有 query 太短、产品名缺失、召回分数偏低时，才让 `HyDEGenerator` 生成一段“假想手册段落”，再和原 query 合并成 `Retrieval query`。它只帮检索扩写，不作为最终回答依据。

解决：短 query 召回不稳

↓

三路召回
V / B / C

这一步对应图里的三路并行：第一路 `VectorRetriever with BGE embedding` 把 `Retrieval query` 编码成语义向量，再交给 `FAISSVectorStore` 找语义相近的手册 chunk；第二路 `BM25Retriever` 用 jieba、型号别名、boost_tokens 抓型号、错误码、按钮名；第三路 `ImageCaptionIndex` 按图片 caption、章节、附近文字找相关手册配图。

得到：语义候选 + 关键词候选 + 图片候选

↓

融合排序
R
`HybridRetriever: RRF fusion` 把向量召回、BM25 召回和图片 caption 召回的候选合并。RRF 不比较原始分数，因为 FAISS 分数、BM25 分数、caption 分数尺度不同；它看的是“同一个 chunk 在各路结果里的排名”。多路都靠前的 chunk，会被排到更前面。

解决：分数尺度不一致

↓

精排或回退
RR / BR / TOP
`Reranker available` 判断 BGE Reranker 是否可用。可用时，只对 RRF 后的小候选集做 query-document 精排和截断；不可用时，直接走 `RRF TopK fallback`。这个设计保证模型服务失败时，检索链路仍能返回可用证据。

解决：精度和稳定性平衡

↓

拆成两类证据
IMG / CTX
`TOP` 之后会分成两条输出：一条收集 `Candidate image_ids`，作为候选图池；另一条调用 `format_context`，把来源手册、章节标题、正文、关联图片整理成文本证据。也就是说，图和文字都来自检索结果，不交给 LLM 自由发挥。

解决：图片不能乱配

↓

生成与校验
P / L / G
`Prompt` 同时拿到文本证据和候选图池，并写明：需要插图时才能输出 `<PIC>`，且 image_ids 必须来自候选集合。LLM 生成后，幻觉检测和质量检查会再验证事实是否有依据、图片数量是否和 `<PIC>` 对齐。

解决：有依据地回答

把上面的 Mermaid 翻译成函数伪代码
```
def rag_retrieve(user_query, vision_summary, session_context):
    # 1. 先补全问题：原始 query 太短，直接检索容易找错手册
    retrieval_query = build_retrieval_query(
        text=user_query,
        vision=vision_summary,
        session=session_context,
    )

    # 2. HyDE 是检索增强，不是事实来源
    if need_hyde(retrieval_query):
        hyde_doc = generate_hypothetical_manual_text(retrieval_query)
        if hyde_doc:
            retrieval_query = merge_query_and_hyde(retrieval_query, hyde_doc)

    # 3. 三路召回：语义向量、关键词、图片 caption 同时找候选
    #    第一路：VectorRetriever 先用 BGE 把 query 变成语义向量
    #    再交给 FAISSVectorStore，查语义最接近的手册 chunk
    query_vector = bge_embedding_model.encode(retrieval_query, normalize=True)
    vector_hits = faiss_vector_store.search(query_vector, top_k=30)

    #    第二路：BM25 精确找型号、错误码、按钮名
    bm25_hits = bm25_search_with_alias_and_boost(retrieval_query)

    #    第三路：ImageCaptionIndex 找相关手册配图
    caption_hits = image_caption_search(retrieval_query)

    # 4. RRF 融合：不硬加不同检索器的分数，只看排名贡献
    rrf_pool = rrf_fusion(
        vector_hits=vector_hits,
        bm25_hits=bm25_hits,
        caption_hits=caption_hits,
    )

    # 5. 有 reranker 就精排；没有就用 RRF TopK 兜底
    if reranker_available():
        final_chunks = bge_rerank_and_cutoff(retrieval_query, rrf_pool)
    else:
        final_chunks = take_top_k(rrf_pool)

    # 6. 最终证据拆成“文本上下文”和“候选图池”
    context_text = format_context(final_chunks)
    candidate_image_ids = collect_image_ids(final_chunks, rrf_pool)

    # 7. LLM 只能在这些证据里回答，图片也只能从候选图池选
    answer = llm_generate(
        query=user_query,
        evidence=context_text,
        available_image_ids=candidate_image_ids,
        pic_rule="如果输出 <PIC>，image_ids 必须同数量、同顺序、来自候选图池",
    )

    return hallucination_and_quality_check(answer, candidate_image_ids)
```

图片召回实际有两条路径。第一条是文本 chunk 自带 image_ids ，最终证据 chunk 如果有图，优先用这些绑定图片。第二条是 caption 独立召回图片，再通过 image_to_chunk_ids 把图片映射回 chunk，为 RRF 增加权重或注入候选。

关键伪代码：图片选择
```
def select_images(final_chunks, rrf_chunks, query):
    selected = []

    for chunk in final_chunks:
        selected.extend(chunk.image_ids)

    if need_more_visual_help(query):
        caption_hits = caption_retrieve(query)
        for image_id in caption_hits:
            chunk_ids = image_to_chunk_ids[image_id]
            if section_is_consistent(chunk_ids, final_chunks):
                selected.append(image_id)

    return deduplicate_keep_order(selected)
```

最终原则是：图片必须和最终证据 chunk 同章节或相邻上下文相关， image_ids 不能由 LLM 编造， `<PIC>` 出现顺序必须和 image_ids 顺序一致。不确定时宁可不插图，也不要插错图。

## 9. HyDE：短 query 或产品不明确时怎么补召回

HyDE 的全称是 Hypothetical Document Embeddings。它不是直接回答用户，而是先让模型生成一段“假想手册段落”，再把这段文本和原 query 拼在一起去检索。

在客服场景里，短 query 很常见，比如“怎么装”“红灯怎么回事”“一直响怎么办”。这种 query 信息太少，直接做 embedding 可能不稳定。项目里的 HyDEGenerator.should_run 会在 query 过短、产品名为空或主路分数低时触发。失败或超时会返回 None，不影响原始 query 继续检索。

关键伪代码：HyDE 补召回
```
def maybe_use_hyde(query, item_names, first_pass_score):
    if is_short(query) or not item_names or low_confidence(first_pass_score):
        hypothetical_doc = generate_hyde_doc(query)
        if hypothetical_doc:
            return query + "\n\n" + hypothetical_doc

    return query
```

HyDE 的坑也很明显：它生成的是检索辅助文本，不是事实。最终回答不能引用 HyDE 内容，仍然必须基于真实召回的手册 chunk。这个边界如果讲不清，面试官很容易追问“HyDE 会不会引入幻觉”。

## 10. 最终证据组装：把检索结果变成 LLM 能用的上下文

RAG 检索不是结束。真正交给 LLM 前，还要把证据整理成模型能理解、也能被规则检查的上下文。

当前项目里 HybridRetriever.format_context 会把每个 chunk 渲染成“来源手册 > 章节 + 正文 + 关联图片”的格式。Agent 在生成阶段还会把用户问题、图片理解结果、子问题、候选 image_ids 、会话上下文和额外约束一起交给 Prompt。

简化 Prompt 结构
```
你是一个客服助手，请严格基于【检索证据】回答用户问题。

【用户问题】
{user_query}

【图片理解结果】
{vision_summary}

【检索证据】
{retrieved_chunks}

【可用图片】
{image_candidates}

【回答要求】
1. 只能使用检索证据中的信息。
2. 不要编造产品规格、售后政策和维修结论。
3. 如果证据不足，请说明需要用户补充哪些信息。
4. 如需插入图片，只能使用可用图片中的 image_id。
5. <PIC> 的数量必须和返回的 image_ids 数量一致。
```

这一步是幻觉治理的关键。LLM 不能看到整本手册，只能看到检索出来的证据；它也不能自由生成图片 ID，只能从候选集合里选。换句话说，Prompt 不是为了让模型“更会说”，而是为了让模型在证据边界内说。

## 11. 评估闭环：怎么判断 RAG 检索链路好不好

RAG 优化不能靠感觉。这个项目里我会把问题拆成“召回问题、排序问题、Prompt 问题、生成问题”几类，再用日志和测试集定位。

检索指标

Recall@K、MRR、Hit Rate、目标章节命中率、图片命中率、chunk-source 一致性。

生成指标

回答是否基于证据、是否编造手册没有的信息、 `<PIC>` 和 image_ids 是否对齐。

日志字段

user_query 、HyDE query、vector hits、BM25 hits、RRF score、reranker score、final chunks、final image_ids、latency。

排障价值

如果答案错了，可以判断是没召回、排错序、证据不足，还是模型生成时越界。

当前项目里已经有 RequestTrace 、 MetricsCollector 、评估脚本和输出文件目录，后续可以把这些指标系统化。面试里我不会说“准确率提升 xx%”，因为没有严谨实验就不该编数据。我会说这套链路可以通过这些指标持续评估和迭代。

## 12. 总结：RAG 的核心是召回证据，不是让模型自由发挥

在这个客服 Agent 里，我对 RAG 的理解是：向量库只是其中一环，chunk 策略决定知识能不能被正确召回，BM25 解决精确匹配，RRF 降低单一路径误判，Reranker 提升最终证据质量，HyDE 用于短 query 补召回，caption index 让图片也能被检索， `<PIC>` 和 image_ids 对齐保证前端可渲染。

            我在这个项目里做 RAG，不是把文档切块丢进向量库，而是把它当成一个证据召回系统来设计：先保证知识库结构化，再通过向量检索、关键词检索、融合排序和图片绑定，把可追溯的文本证据和图片证据交给模型，最后通过 Prompt 约束和质量检查减少幻觉。

## 13. 面试口述版

### 面试题：你这个项目里的 RAG 是怎么做的？

我这个项目里的 RAG 不是单纯把文档切块后丢进向量库。因为它是电商售后和产品手册问答场景，用户问题经常很短，还可能上传图片，所以我把 RAG 设计成一套证据召回链路。

入库阶段，我用 KnowledgeBaseBuilder 解析手册，把正文里的 `<PIC>` 和 image_ids 按顺序绑定，生成 ChunkData 和图片 manifest。检索阶段同时走 FAISS 语义检索和 jieba + BM25 关键词检索，再用 RRF 融合结果；如果 query 很短或者产品不明确，会用 HyDE 做补召回；Reranker 作为可选增强，对融合后的少量候选做精排。图片这块还有 ImageCaptionIndex ，会把图片所属章节和 nearby_text 变成可检索的 caption。

最后交给模型的不是一堆随便拼的文本，而是带来源、章节、候选图片和输出约束的证据上下文。回答里如果出现 `<PIC>` ，返回的 image_ids 必须严格对应。这样做的目的就是让模型基于证据回答，而不是自由发挥。

## 14. 面试官可能追问的问题和参考回答

### 1. 为什么不能只用向量检索？

因为客服手册里很多信息需要精确匹配，比如型号、错误码、按钮名称和指示灯颜色。向量检索擅长语义相似，但相似不代表证据正确。比如“红灯闪烁”和“红灯常亮”语义接近，但处理方式可能不同。所以我用 FAISS 做语义召回，再用 BM25 抓精确词，最后通过 RRF 融合，降低单一路径误判。

### 2. chunk size 怎么定？

我不是单纯按固定字数硬切。项目里优先按手册标题切 passage，短 passage 会装箱，过长 passage 才用滑动窗口。当前实现里 chunk_size 是 512，overlap 是 64。这个大小主要是为了平衡召回粒度和上下文完整性，同时避免切断
 ，保证图片和正文关系不丢。

### 3. 图片和文本怎么绑定？

手册格式里正文有 `<PIC>` ，后面有 image_ids 列表。解析时我先把 `<PIC>` 变成
 ，N 是图片全局顺序。切 chunk 后再根据 N 反查 image_id，并写入 ChunkData.image_ids 。同时生成 ImageManifestEntry ，记录图片所属手册、章节和附近文本。

### 4. BM25 和向量检索结果怎么融合？

项目里通过 HybridRetriever 融合。它先分别拿到 FAISS 结果和 BM25 结果，再用 RRF 按排名融合，而不是直接把原始分数相加。代码里还保留了 vector_weight 和 bm25_weight，默认向量召回权重更高一点，同时 caption index 的图片命中也可以给相关 chunk 加权。

### 5. RRF 为什么比直接加权更稳？

因为不同检索器的分数尺度不一样。向量相似度和 BM25 分数不能直接比较，强行相加容易被某一路带偏。RRF 看的是排名，一个 chunk 如果在向量检索和 BM25 里都靠前，它就更值得进入下一阶段。这样能降低单一路径误召的影响，也更适合多路召回融合。

### 6. HyDE 会不会引入幻觉？

会有风险，所以我把 HyDE 定位成检索辅助，而不是事实来源。它生成的假设文档只用于扩展 query，提高短问题的召回稳定性，最终回答不能引用 HyDE 内容。回答仍然必须基于真实召回的手册 chunk。代码里 HyDE 失败或超时会直接跳过，不会阻塞主流程。

### 7. Reranker 放在哪一层？为什么不直接全库 rerank？

Reranker 放在 FAISS、BM25、caption index 和 RRF 之后。它适合对融合后的少量候选做精排，不适合全库跑，因为 query-document pair 打分成本更高。当前实现里 Reranker 是懒加载的可配置增强模块，如果模型不可用，会回退到 RRF 顺序，保证服务可用。

### 8. 怎么评估 RAG 的效果？

我会分检索和生成两层看。检索层看 Recall@K、MRR、目标章节命中率、图片命中率；生成层看回答是否基于证据、是否编造手册不存在的信息、 `<PIC>` 和 image_ids 是否对齐。日志里要记录 query、各路 hits、RRF 分数、reranker 分数、final chunks 和最终回答，这样才能定位问题在哪一层。

### 9. PIC 和 image_ids 怎么防止错位？

第一步是在入库阶段绑定， `<PIC>` 按顺序映射到 image_ids。第二步是在生成阶段只把候选 image_ids 提供给模型，不允许模型自由编。第三步是在幻觉检查里做硬校验，正文中的 `<PIC>` 数量必须和返回的 image_ids 长度一致，而且 image_ids 必须来自候选集合。

### 10. 如果召回不到正确文档怎么办？

我会先看问题出在哪层。如果 query 太短或缺产品名，可以用 HyDE 或会话上下文补召回；如果是型号、错误码没命中，就加强 BM25 分词、产品别名和 boost_tokens；如果召回到了但排序靠后，就看 RRF 权重或 Reranker。仍然证据不足时，系统应该追问用户补充型号或故障信息，而不是让模型硬答。

## 15. 3 条可以放进简历的项目亮点描述

- 设计并实现多模态客服 Agent 的 RAG 证据召回链路，基于 KnowledgeBaseBuilder 将产品手册解析为带章节、图片绑定和元数据的 ChunkData ，保证 `<PIC>` 与 image_ids 可追溯对齐。

- 构建 FAISS 语义检索、jieba + BM25 关键词检索、图片 caption 检索和 RRF 融合排序流程，并接入可选 BGE Reranker 与 HyDE 补召回，提高短 query、型号词和图文证据场景下的召回稳定性。

- 围绕客服风险设计证据约束和评估闭环，记录检索候选、最终 chunk、候选图片、生成结果和质量检查信息，为 Recall@K、MRR、图片命中率、 `<PIC>` 对齐率等指标评估预留数据基础。',
  2,
  null,
  'PUBLISHED',
  '2026-06-01 00:00:00+08'::timestamptz
from projects
where projects.slug = 'mmcsa'
on conflict (slug) do nothing;

insert into blog_posts (
  project_id,
  title,
  slug,
  category,
  summary,
  content_markdown,
  blog_order,
  cover_image_url,
  status,
  published_at
)
select
  projects.id,
  '多模态客服 Agent 怎么防幻觉：图片、证据和 <PIC> 的硬规则',
  'mmcsa/2026-06-02-mmcs-pic-guardrails',
  '质量治理',
  '这篇文章不是讲“怎么调用一个大模型 API”。我更想复盘的是：在真实客服场景里，用户上传图片、系统检索手册、模型插入配图、前端渲染图片，这一整条链路怎样才能不乱答、不乱配图、不编造 image_id。',
  '我做这个多模态客服 Agent 时，最早踩到的坑不是“模型不会回答”，而是“模型太会回答”。用户问一个售后问题，模型可以很快给出一段看起来合理的建议；用户上传一张故障图，模型也能描述得像那么回事。但客服系统不能只追求像，尤其是涉及产品手册、故障判断、售后政策和配图时，回答必须有证据。

            我对这个项目的核心定位是：不是让模型自由回答，而是让模型在图片理解、RAG 证据、候选图片池和输出硬规则约束下回答。能回答就基于证据回答，证据不足就保守表达或追问，不能靠“模型感觉”补完业务结论。

这套系统的主流程在 agent.py 里，图片理解由 src/perception/image_processor.py 完成，幻觉检查由 src/validation/hallucination_checker.py 处理，质量门禁由 src/validation/quality_checker.py 兜底。文章会从项目负责人的角度，把我为什么这样拆、怎么落到后端流程、以及面试官会追问什么讲清楚。

从图片到可信回答的控制链路

用户输入

文本问题 + 上传图片 + 会话上下文

图片理解

分类为产品图、故障图、截图或其他，并提取结构化信息

Query 增强

把型号、故障现象、订单字段等并入检索 query

RAG 检索

召回手册 chunk、章节、caption 和候选 image_ids

受控生成

Prompt 注入候选图片池和 `<PIC>` 对齐规则

幻觉检查

规则校验 image_ids，再用事实核查检查证据一致性

质量门禁

不达标则带改进指令重新生成，并保留最终硬校验

## 1. 用户上传图片类型：不是所有图片都应该进入同一个流程

为什么需要这一层？因为客服场景里的图片非常杂。用户可能拍的是产品实物，也可能截的是订单页、物流页、报错页面，甚至只是一张和问题无关的图片。如果系统看到图片就直接让模型“结合图片回答”，风险很高：模型可能把无关图片当成故障证据，也可能把订单截图误当成产品图。

我的设计是先做图片类型分类，再决定后续处理策略。源码里的 ImageProcessor.process_images 会逐张图片处理，先通过视觉模型判断类型，再进入不同分支：故障图走故障描述，截图走 OCR 字段提取，产品图走品牌型号识别，其他图片只做简要描述和低权重辅助。

产品图 Product Image

重点提取品牌、型号、品类、外观特征和检索关键词，用来帮助系统选对产品手册。

故障图 Fault Image

重点提取故障现象、异常状态、错误码、指示灯状态和可能的故障关键词。

截图 Screenshot

重点做 OCR，抽取订单号、物流单号、状态、金额、商品名、日期等结构化字段。

为什么需要？

图片本身不是证据，图片理解后的结构化结果才是可控输入。先分类可以避免把订单截图误用成产品故障证据。

怎么实现？

用视觉模型输出标准类型：`FAULT`、`SCREENSHOT`、`PRODUCT`、`OTHER`。不同类型走不同 prompt，并返回统一结构，如 `type`、`description`、`keywords`、`fault_info`、`ocr_result`。

解决什么问题？

面试官最关心的是你有没有多模态工程边界。我的边界是：产品图和故障图可以增强检索，截图更多作为订单和物流辅助信息，其他图片不会被强行用于生成结论。

图片类型处理的简化伪代码
```
def process_image(image, user_question):
    image_type = classify_image_type(image)

    if image_type == "FAULT":
        return extract_fault_description_and_keywords(image, user_question)

    if image_type == "SCREENSHOT":
        return extract_ocr_fields(image)

    if image_type == "PRODUCT":
        return extract_brand_model_product_type(image)

    return describe_as_other(image)
```

中文伪代码：图片类型处理流程
```
处理用户上传图片：
    第一步：先做图片类型分类
        输入：用户上传的图片 image
        输出：图片类型 image_type
        可选类型：故障图、截图、产品图、其他图片

    第二步：如果图片是故障图
        提取：故障现象、异常状态、错误码、指示灯状态、检索关键词
        用途：进入故障排查 / 售后判断流程，并增强 RAG 检索 query

    第三步：如果图片是截图
        提取：订单号、物流单号、订单状态、金额、商品名、日期等 OCR 字段
        用途：辅助判断订单、物流、售后问题，不直接当作产品手册证据

    第四步：如果图片是产品图
        提取：品牌、型号、品类、外观特征、产品关键词
        用途：帮助系统选对产品手册，提高后续检索命中率

    第五步：如果图片是其他类型
        只生成简要描述，并标记为低置信辅助信息
        用途：防止无关图片被模型误用成故障证据或手册配图依据
```

## 2. 图片理解如何进入 Query：视觉信息不能只停留在描述层

为什么需要这一层？因为用户经常不会把关键信息打出来。他可能只说“这个一直闪”，然后上传一张面板照片；也可能只发订单截图，问“怎么还没到”。如果系统只用用户文本做检索，query 太短，FAISS 和 BM25 都容易召回偏。

我在 Agent 流程里把图片理解结果放到 Step 2 做 query 增强。产品图提取出的型号、品类会并入检索关键词；故障图里的指示灯、错误码、异常状态会补到检索 query；截图里的订单号、物流状态、商品名会进入 metadata 或辅助上下文。这样检索阶段看到的不是“怎么回事”，而是“某型号产品，红灯闪烁，用户询问故障处理”。

为什么需要？

RAG 的召回质量很大程度取决于 query。图片如果只给生成模型看，不给检索链路用，系统可能根本拿不到正确手册证据。

怎么实现？
`_step1_image_understanding` 先得到图片摘要和结构化字段，`_step2_query_enhancement` 再把这些字段和会话里的产品上下文合并，供意图判断、产品确认和 RAG 检索使用。

解决什么问题？

这体现的是“多模态不是只在最终 prompt 里塞图片”。图片理解结果要进入 Agent 的中间状态，影响路由、检索和生成，而不是只当装饰信息。

图片信息进入 query 的简化伪代码
```
def enhance_query(user_text, image_analysis, session_context):
    fields = []

    for image in image_analysis:
        if image.type == "product":
            fields += [image.brand, image.model, image.product_type]
        elif image.type == "defect":
            fields += [image.fault_description, image.error_code, image.indicator_status]
        elif image.type == "screenshot":
            fields += [image.order_id, image.tracking_number, image.status, image.product_name]

    fields += session_context.get("known_product_models", [])
    return merge_without_conflict(user_text, fields)
```

中文伪代码：图片信息进入 query 的处理流程
```
增强用户检索 query：
    第一步：保留用户原始问题
        原始问题 = user_text
        注意：图片信息只能补充问题，不能随便覆盖用户明确表达的意图

    第二步：遍历图片理解结果
        对每张图片读取：图片类型、结构化字段、关键词、描述信息

    第三步：如果是产品图
        提取：品牌、型号、品类
        拼入 query：用于帮助系统选对产品手册

    第四步：如果是故障图
        提取：故障现象、错误码、指示灯状态
        拼入 query：用于召回故障排查、异常说明、维修建议相关 chunk

    第五步：如果是截图
        提取：订单号、物流单号、订单状态、商品名
        拼入 metadata 或辅助上下文：用于判断订单、物流、售后问题
        注意：截图字段不直接当作产品手册证据

    第六步：补充会话上下文
        如果历史会话中已有产品型号、品牌或用户确认过的商品
        一起加入 query，避免多轮对话里丢失产品锚点

    第七步：合并并去冲突
        去掉空字段、重复字段、低置信字段
        如果图片信息和用户文本冲突，优先保留用户文本，并把图片信息作为辅助线索

    最终输出：
        enhanced_query = 用户问题 + 图片结构化信息 + 会话产品上下文
```

这里我做了一个工程取舍：视觉模型提取的信息不是无条件覆盖用户文本，而是作为补充字段。比如用户文本说的是退货，截图里出现物流状态，这时截图不能把意图强行改成物流查询，只能作为辅助事实。多模态系统最怕“看见一点东西就过度解释”，所以 query 融合要保守。

## 3. 候选图片池如何提供给模型：只给可用图片，不给自由发挥空间

为什么需要候选图片池？因为模型不能凭空生成 image_id。前端最终渲染图片时，依赖的是后端返回的 image_ids ，这些 ID 必须真实存在，并且来自产品手册或系统可追溯的图片清单。如果让模型自由写 image_id，页面不是渲染失败，就是把错误图片插到错误步骤。

我把图片池分成几类看：第一类是手册图片，它们来自知识库 chunk 绑定的 image_ids ；第二类是图片 caption 索引召回出来的手册配图；第三类是用户上传图片，它们主要用于视觉理解和上下文，不默认作为手册配图插入回答；第四类是历史会话中的图片信息，可以辅助理解连续问题。

为什么需要？

候选图片池是控制模型配图自由度的关键。模型只能从池子里选，不能发明图片，也不能跨章节乱配图。

怎么实现？

检索阶段返回 `candidate_image_ids`。生成阶段如果存在 `image_manifest`，会把 image_id、caption、章节、附近文本渲染成候选图片块，注入到 Prompt。

解决什么问题？

面试官会问“LLM 怎么知道该插哪张图”。我的回答是：LLM 不直接知道，它只在后端筛好的候选图池里选择，选择后还会被规则校验。

候选图片池的简化结构
```
{
  "candidate_images": [
    {
      "image_id": "Manual17_03",
      "manual_name": "空气炸锅说明书",
      "section_title": "预热步骤",
      "caption": "电源按钮和预热指示灯位置示意",
      "nearby_text": "按下预热按钮，指示灯亮起表示正在预热"
    }
  ]
}
```

这个设计里还有一个小坑：不是候选图越多越好。候选图片太多，模型更容易乱选；候选图片太少，操作类问题又可能缺少必要配图。所以我在后端做了候选图去重、基于 caption 和 query 的简单重排，并限制数量，优先保留和最终 chunk 同章节、同上下文的图片。

## 4. 为什么 `<PIC>` 和 image_ids 必须严格对齐
`<PIC>` 不是一个普通占位符。它是 LLM 输出文本和前端图片渲染之间的锚点。正文里第一个 `<PIC>` ，必须对应 image_ids 里的第一个 ID；第二个 `<PIC>` ，对应第二个 ID。这个顺序一旦错，回答表面看起来没问题，前端一渲染就会变成“步骤 A 配了步骤 B 的图”。

            我在项目里把这个问题当成硬规则，而不是 prompt 建议。因为配图错位不是文案瑕疵，而是客服可信度问题。用户跟着错误图片安装、排查或确认故障，实际风险会比少给一张图更大。

为什么需要？

客服回答里的图片是操作证据，不是装饰图。错位会导致用户理解错误，也会让系统看起来不可信。

怎么实现？

知识库阶段先把 chunk 和图片绑定；Prompt 阶段明确“第 k 个 `<PIC>` 对应第 k 个 image_id”；后端阶段用 `_validate_image_ids` 再做最终硬校验。

解决什么问题？

这体现前后端协作意识：LLM 生成的是文本和 ID，前端负责渲染，但后端必须保证协议可执行、可校验。
`<PIC>` 对齐规则的简化伪代码
```
def validate_pic_alignment(answer, image_ids, candidate_image_ids):
    valid_ids = []
    for image_id in image_ids:
        if image_id in candidate_image_ids and image_id not in valid_ids:
            valid_ids.append(image_id)

    pic_count = answer.count("<PIC>")

    if not candidate_image_ids:
        return answer.replace("<PIC>", ""), []

    if pic_count > len(valid_ids):
        answer = remove_extra_pic_tags(answer, keep=len(valid_ids))

    if len(valid_ids) > pic_count:
        valid_ids = valid_ids[:pic_count]

    return answer, valid_ids
```

中文伪代码：`<PIC>` 与 image_ids 对齐流程
```
校验回答中的图片占位符：
    第一步：先过滤 image_ids
        只保留出现在候选图片池 candidate_image_ids 里的图片 ID
        去掉空 ID、重复 ID、模型编造出来的 ID

    第二步：统计正文里的图片占位符
        pic_count = 正文中 <PIC> 的数量
        id_count = 过滤后的有效 image_ids 数量

    第三步：如果候选图片池为空
        删除正文里所有 <PIC>
        返回空 image_ids
        原因：没有可验证图片时，宁可不插图，也不能让模型乱配图

    第四步：如果 <PIC> 数量多于 image_ids
        删除多余的 <PIC>
        保证前端不会出现“有占位符但没有图片”的情况

    第五步：如果 image_ids 数量多于 <PIC>
        截断多余的 image_ids
        保证不会返回前端无法渲染的位置外图片

    第六步：最终返回
        answer 中的第 1 个 <PIC> 对应 image_ids 第 1 个 ID
        answer 中的第 2 个 <PIC> 对应 image_ids 第 2 个 ID
        以此类推，数量一致、顺序一致、ID 必须来自候选图片池
```

## 5. 幻觉检查两层：规则校验 + LLM 事实核查

我把幻觉检查拆成两层，是因为不同问题需要不同工具解决。图片 ID 是否存在、 `<PIC>` 数量是否一致，这类问题不需要 LLM 判断，规则更可靠；回答里的事实是否被检索证据支持，则需要做声明级核查，可以交给低温度 LLM 或规则化 prompt。

### 第一层：规则校验

规则校验主要处理“格式和边界”。它会过滤候选集合外的 image_id，去掉重复 ID；候选集合为空时，直接清除 `<PIC>` ； `<PIC>` 多于 image_ids 时删除多余占位符，image_ids 多于 `<PIC>` 时截断多余 ID。这个逻辑在 HallucinationChecker._validate_image_ids 中实现。

对敏感字段我也倾向于走更严格的规则，比如型号、故障码、金额、时效、售后政策。它们不能靠模型“差不多表达”，要么来自检索证据，要么让用户补充信息。尤其是售后政策和维修结论，回答要保守，不能把平台责任、赔付承诺或维修结论写死。

### 第二层：LLM 事实核查

第二层是事实核查。系统会把回答里的 `<PIC>` 先去掉，避免图片占位符被当成事实断言，然后让检查模型对照检索上下文输出 PASS 、 REWRITE 或 REJECT 。如果是部分无依据，就删除或改写无依据内容；如果大部分无依据，就保留有证据的部分，或者在证据不足时提示用户补充信息。

为什么需要？

规则能抓格式问题，但抓不住“看似合理但手册没写”的事实性幻觉。事实核查负责补上这块。

怎么实现？

先硬校验 image_ids 和 `<PIC>`，再用 `HALLUCINATION_CHECK_PROMPT` 对回答和检索上下文做一致性检查，必要时调用 rewrite prompt 修正。

解决什么问题？

面试官会关心“你怎么治理幻觉”。我的答案不是“prompt 写严格一点”，而是规则门禁、事实核查、重写修复和最终对齐多层一起做。

## 6. 质量检查和重新生成：不是检查完就结束

幻觉检查解决的是“能不能这样说”，质量检查解决的是“这样说够不够好”。一个回答可能没有编造，但仍然不完整：子问题漏答、步骤太短、该配图没配、结构混乱、候选图存在却没有使用。这些问题不一定是幻觉，但会影响客服体验。

QualityChecker 会基于回答、用户问题、子问题、检索上下文、候选图片列表做打分。当前实现里低于阈值或标记需要改进时，会把改进建议、遗漏子问题、配图要求等整理成 improvement_hint ，再调用生成函数重新生成。重新生成不是完全推倒重来，而是带着“保留已有证据、补齐结构和配图”的指令修复。

为什么需要？

真实客服系统不能只要求“没错”，还要回答完整、可执行、可渲染。质量门禁是把模型输出从“可用”推到“稳定可用”的一层。

怎么实现？

生成后先过幻觉检查，再过质量检查；质量不达标时，带改进建议重新调用 `_step6_generate_answer`，最后再次执行 `<PIC>` 和 image_ids 硬校验。

解决什么问题？

这给面试官传递的是闭环意识：我不是只做一次生成，而是把生成、检查、修复、再校验串成可观测的后端流程。

生成后的质量闭环简化伪代码
```
def generate_with_guardrails(question, evidence, candidate_images):
    answer, image_ids = llm_generate(question, evidence, candidate_images)

    answer, image_ids, passed = hallucination_check(
        answer=answer,
        image_ids=image_ids,
        evidence=evidence,
        candidate_images=candidate_images,
    )

    quality = quality_check(answer, question, evidence, image_ids, candidate_images)

    if quality.needs_improvement:
        answer, image_ids = llm_generate(
            question=question,
            evidence=evidence,
            candidate_images=candidate_images,
            extra_instruction=quality.suggestions,
        )

    return validate_pic_alignment(answer, image_ids, candidate_images)
```

中文伪代码：生成后的质量闭环流程
```
生成客服回答并做质量闭环：
    第一步：先让模型生成初始回答
        输入：用户问题、检索证据、候选图片池
        输出：answer 正文、image_ids 图片列表

    第二步：做幻觉检查
        检查 answer 是否超出检索证据
        检查 image_ids 是否来自候选图片池
        检查 <PIC> 数量是否和 image_ids 数量一致
        如果发现无依据内容，就删除、改写或标记为需要重新生成

    第三步：做质量检查
        检查回答是否完整覆盖用户问题
        检查子问题是否漏答
        检查结构是否清楚、步骤是否可执行
        检查有候选图片时是否合理插入 <PIC>

    第四步：判断是否需要重新生成
        如果质量达标：
            保留当前回答
        如果质量不达标：
            把质量检查建议写入 extra_instruction
            让模型基于同一批证据重新生成
            注意：重新生成不能扩大证据范围，也不能编造新的 image_id

    第五步：最终再做一次硬校验
        再次校验 <PIC> 和 image_ids 是否数量一致、顺序一致
        再次过滤候选图片池外的 image_id
        确保返回给前端的是可渲染、可追溯、可解释的最终答案
```

日志也很重要。这个项目里请求 trace 会记录检索 chunk 数、候选图片数、是否触发幻觉、质量分、是否重新生成等信息。后续如果要量化，可以继续统计 Recall@K、图片命中率、 `<PIC>` 对齐率、重新生成率、事实核查失败率。这里我没有编造项目指标，但工程上已经为评估闭环预留了数据入口。

## 7. 面试亮点：这篇文章背后真正想展示什么

如果面试官问我“这个项目怎么体现 AI 应用开发能力”，我不会只说用了多模态模型、RAG、Agent。我会讲这几个工程点：

- AI 输出可控。 我没有让模型自由编答案，而是通过检索证据、候选图片池、Prompt 约束、规则校验和事实核查限制输出空间。

- 多模态理解进入流程。 图片不是最后才给模型看，而是在 Step 1 被分类和结构化，在 Step 2 进入 query，在 Step 3/4 影响意图和检索。

- RAG 不是只搜文本。 手册 chunk、图片 caption、章节信息、image_ids 都参与证据构造，文本证据和图片证据一起进入生成阶段。

- 幻觉治理有闭环。 规则校验负责硬边界，LLM 事实核查负责语义一致性，质量检查负责完整性和配图质量，不达标就重新生成。

- 前后端协议明确。 `<PIC>` 和 image_ids 的严格对齐，让后端生成结果能被前端稳定渲染，而不是一段“看起来像答案”的文本。

            这套项目经验最适合在面试里这样总结：我做的不是一个会聊天的客服机器人，而是一个能把用户图片、产品手册、检索证据和输出协议串起来的多模态 Agent。我的重点不是让模型多说，而是让模型在证据范围内说，并且说出来的内容能被后端校验、被前端渲染、被日志追踪。

### 1 分钟口述版

我做过一个面向电商售后和产品手册问答的多模态客服 Agent。这个项目里，用户不仅会输入文字，还会上传产品图、故障图、订单截图或物流截图。我的工作重点是把图片理解、RAG 检索和生成约束串成一条可控链路：先识别图片类型并提取型号、故障现象、订单字段等信息，再把这些信息并入 query 去召回手册文本和候选图片；生成时只把候选 image_ids 提供给模型，要求正文里的 `<PIC>` 和 image_ids 严格按顺序对应。生成后还会做两层幻觉检查：第一层用规则校验 image_ids 是否来自候选池、 `<PIC>` 数量是否一致；第二层用事实核查检查回答是否基于检索证据。质量不达标时会带着改进建议重新生成。这个项目让我比较系统地实践了 Agent 编排、RAG 证据约束、多模态输入处理和 AI 输出风险控制。

## 8. 面试高频追问：结合源码回答这 10 个问题

这一节更像我面试前会背的“项目八股”。回答时不要只讲概念，要把问题落到代码链路：图片先由 ImageProcessor 分类和抽取，结果进入 _step2_query_enhancement ，检索后形成候选图片池，生成后再由 HallucinationChecker 和 QualityChecker 收口。

### 1. 你为什么要先区分图片类型？不能直接把图片丢给多模态模型吗？

我不会直接把所有图片都丢给模型自由理解，因为客服场景里图片的用途不一样：产品图用于识别型号，故障图用于提取异常现象，截图可能包含订单号、物流号或状态字段，无关图片则不能被当成证据。项目代码里， src/perception/image_processor.py 的 process_images 会先调用 _classify_image_type ，再分到 FAULT 、 SCREENSHOT 、 PRODUCT 、 OTHER 四类处理分支。

这样设计的核心不是“模型看不懂图”，而是要控制工程边界。不同图片进入不同字段，后续 query 增强、意图判断、检索策略和风险控制才不会混在一起。面试里我会强调：多模态 Agent 不是把图片塞进最终 prompt，而是先把图片变成可路由、可检索、可校验的结构化信息。

### 2. 图片理解结果具体怎么进入 RAG 检索？

入口在 agent.py 的 Step 1 和 Step 2。 _step1_image_understanding 会把图片处理结果整理成 extracted_info ，例如 product_model 、 product_brand 、 order_id 、 tracking_number 、 defect_description 。然后 _step2_query_enhancement 会把这些字段拼进用户 query，例如追加 [产品型号: ...] 、 [订单号: ...] 、 [图片显示: ...] 。

这样做的原因是：RAG 召回阶段看的是 query，不是只看最终生成 prompt。图片里识别出的型号、故障码、物流状态如果不进入 query，FAISS、BM25 和后续混合检索都很难召回正确手册段落。我的实现思路是让视觉信息先变成检索信号，再进入生成证据。

### 3. 如果图片识别错了怎么办？

这个问题我会先承认风险：视觉模型确实可能识别错，尤其是模糊图片、截图 OCR、型号相似的产品。所以项目里图片信息是“增强信号”，不是直接覆盖用户原问题。 _step2_query_enhancement 会保留原始 query ，再追加图片字段和会话中已知型号，避免一张图把用户文本完全带偏。

工程上可以用三种方式兜底：第一，低置信或无关图片走 OTHER ，只作为描述，不强行触发售后或产品手册流程；第二，图片字段和用户文本、会话上下文冲突时优先保守表达，必要时追问型号或订单信息；第三，后续检索和事实核查仍然要求回答基于手册证据，不能因为图片识别出了一个字段就直接下维修结论。

### 4. LLM 怎么知道该插哪张图？

我没有让 LLM 从全量手册图片里自由挑图。检索阶段会从相关 chunk 中收集 candidate_image_ids ，并通过 _rerank_candidate_images 根据用户问题、chunk 文本、图片 caption、章节信息做排序。生成阶段 _step6_generate_answer 会调用 image_manifest.render_candidate_block ，把候选图片的 id、caption、section 提供给模型。

所以 LLM 看到的不是“随便插图”，而是一个被后端筛过的候选图片池。它只能在这些候选 id 中选择，并且需要在回答对应步骤处插入 `<PIC>` 。这个设计把图片选择从“模型自由发挥”变成了“模型在证据池内做受限选择”。

### 5. 候选图片是不是越多越好？

不是。候选图片越多，模型越容易乱选，尤其是产品手册里很多安装图、按钮图、状态图看起来都很像。项目里的 _rerank_candidate_images 默认会限制候选数量，例如 limit=6 ，并且会去重、按 caption 和章节相关性排序，还会给来自高相关 chunk 的图片加分。

我在面试里会把它解释成一个取舍：召回阶段可以尽量保证不漏，但给生成模型的图片池必须收窄。太大的候选池会提升“看起来有证据、实际配错图”的风险。客服 Agent 更需要稳定和可解释，而不是把所有可能图片都塞给模型。

### 6. 为什么 `<PIC>` 和 image_ids 必须严格对齐？
`<PIC>` 是前端渲染手册配图的锚点，不是普通装饰占位符。协议是：正文里的第 N 个 `<PIC>` 对应返回数组里的第 N 个 image_id 。如果顺序错了，用户看到的步骤和图片就会错位，比如文字说“检查红灯闪烁”，前端却渲染了安装螺丝图，这会直接影响客服可信度。

代码里有两层约束： src/generation/prompts.py 的生成提示词明确要求数量和顺序一致； HallucinationChecker._validate_image_ids 会在后端做硬校验，确保 image_ids 来自候选池，且数量和 `<PIC>` 对齐。

### 7. 如果模型输出了 3 个 `<PIC>`，但只返回 2 个 image_id，怎么办？

这类问题不能交给前端猜，也不能直接放行。项目里的 _validate_image_ids 会先过滤候选池外的 id 和重复 id，然后统计 answer.count("`<PIC>`") 。如果 `<PIC>` 数量大于有效 image_ids 数量，就删除多余的 `<PIC>` ；如果 image_ids 比 `<PIC>` 多，就截断多余 id。

还有一种情况是候选图片池为空，但模型生成了 `<PIC>` 。这时后端会直接移除所有 `<PIC>` 并返回空 image_ids。我的原则是：宁可少展示一张图，也不能展示一张不确定、不可追溯、可能错位的图。

### 8. 你说做了幻觉治理，具体怎么做？只是 prompt 写得严格吗？

不是只靠 prompt。Prompt 只是第一层约束，真正的工程闭环在生成之后。 agent.py 的 Step 7 会调用 HallucinationChecker.check_and_fix ，里面先做规则校验，再做 LLM 事实核查。如果事实核查判定需要改写，会调用改写逻辑，并再次校验图片 id。

此外，主流程在 Step 8 之后还会再次调用 _validate_image_ids 做最终硬校验，并在 _audit_and_maybe_retry_final 中做最后审计和必要重试。所以我会跟面试官强调：幻觉治理不是一句“请你不要编”，而是 Prompt 约束、规则校验、事实核查、质量检查和最终审计组成的链路。

### 9. 规则校验和 LLM 事实核查怎么分工？

我的分工原则是：确定性的东西交给规则，语义一致性的东西交给模型。比如 image_id 是否在候选池里、是否重复、 `<PIC>` 数量是否等于 image_ids 数量，这些都不需要 LLM 判断，直接由 _validate_image_ids 做硬规则校验，结果稳定、成本低、可解释。

但“回答里的故障原因是否真的被手册证据支持”“有没有把建议说得太绝对”这类问题是语义判断，所以交给 _fact_check 。代码里事实核查会先去掉 `<PIC>` ，再把回答和检索上下文一起交给核查提示词，返回通过、拒绝或改写建议。

### 10. 幻觉检查通过了，为什么还要质量检查？

因为“不幻觉”不等于“好用”。幻觉检查主要回答“能不能这样说”，质量检查回答“答得是否完整、清楚、可执行、该配图时有没有配图”。比如一个回答完全基于证据，但只说“请参考说明书”，没有步骤、没有排查顺序、没有提醒用户补充型号，这种回答事实上没错，但客服体验很差。

项目里的 QualityChecker.check_and_improve 会基于完整性、结构、配图准确性等维度打分，低于阈值时会带着 improvement_hint 调用生成函数重新生成。它还有防退化逻辑：如果新答案为空、过短、过度推诿，或者原本有图片但新答案丢了图片，就不会轻易接受。这个设计让系统既控制风险，也保证回答对用户真的有帮助。',
  3,
  null,
  'PUBLISHED',
  '2026-06-02 00:00:00+08'::timestamptz
from projects
where projects.slug = 'mmcsa'
on conflict (slug) do nothing;

insert into blog_posts (
  project_id,
  title,
  slug,
  category,
  summary,
  content_markdown,
  blog_order,
  cover_image_url,
  status,
  published_at
)
select
  projects.id,
  '一个 RAG Agent 离生产还有多远：Redis、Milvus、MinIO、MongoDB、MySQL 应该放哪里',
  'mmcsa/2026-06-03-mmcs-production-infra',
  '工程化复盘',
  '这篇文章不是为了把中间件名词堆满，而是复盘我做多模态客服 RAG Agent 时的一个真实架构问题：当前版本已经跑通核心闭环，但如果要变成可扩展、可观测、可维护的生产系统，哪些东西必须从本地文件、内存和单机索引里拆出来。',
  '## 1. 开篇：一个能跑的 RAG Agent，不等于一个生产级 RAG Agent

我当前这个项目已经能跑通一条完整链路：用户输入问题或上传图片，前端把请求交给 FastAPI，后端调用 MultiModalCustomerServiceAgent.handle_request ，Agent 完成图片理解、query 增强、意图判断、RAG 检索、LLM 生成、幻觉检查和质量检查，最后返回 answer 与 image_ids 给前端。

但我不会把它说成已经是生产级系统。更准确的说法是：当前版本先把「Agent + RAG + 多模态 + `<PIC>` 对齐 + 幻觉治理 + 评估闭环」跑通了，适合本地开发、演示、求职项目和小规模验证。

            本文的核心观点是：一个 RAG Agent 从 Demo 到生产，不是简单换一个更高级的向量库，而是要把计算、存储、检索、文件、会话、权限、日志和评估拆到合适的位置。

Demo 阶段，我优先关注的是流程能不能跑通、手册 chunk 能不能被召回、图片信息能不能进入 Agent、 `<PIC>` 和 image_ids 能不能被前端稳定渲染、幻觉检查有没有后置兜底。这些问题用 FastAPI、FAISS、BM25、本地文件、JSON manifest 和内存会话已经能验证。

生产环境会出现另一组问题：多产品、多租户、并发、文件和图片管理、向量索引在线更新、用户权限、工单审计、日志追踪、成本控制、服务可观测性、灰度发布和回滚。到那个阶段，Redis、Milvus、MinIO、MongoDB、MySQL 才真正有各自的位置。

## 2. 当前已落地：FastAPI、FAISS、BM25、内存 / Redis 会话、评估接口

当前已落地
**FastAPI 服务入口**

server.py 暴露 /chat 、 /chat/upload 、 /chat/stream 、 /health 、 /metrics 和评估相关接口；其中 /chat/stream 是 SSE 分块输出完整答案，不是模型原生 token 流。

当前已落地
**FAISS + BM25 混合检索**

agent.py 初始化 FAISSVectorStore 、 BM25Retriever 、 HybridRetriever ，支持向量、关键词、图片 caption 三路召回。

可选支持
**Redis 会话后端**

SESSION_BACKEND=redis 且配置 REDIS_URL 时，服务会使用 RedisSessionManager ，否则走内存 SessionManager 。

当前已落地
**评估与 trace**

RequestTrace 、 MetricsCollector 、 EvaluationJobManager 和 scripts/eval_submission.py 用于观测检索、生成和质量闭环。

### FastAPI 是业务入口，不是简单转发器

当前 server.py 用 FastAPI 作为统一后端入口。前端不会直接调用大模型，而是把文本、图片、session_id、kb_locale 等参数交给后端。后端完成参数校验、图片 base64 归一化、Bearer Token 可选鉴权，然后再调用 Agent。

这样设计的价值在于，RAG 检索、幻觉治理、质量检查、日志记录、会话管理都收敛在后端。如果让前端直接调用模型，短期看起来简单，长期会导致业务规则散落、调用成本不可控、评估和审计也很难做。

### FAISS 的定位是快速验证检索链路

项目里的 src/retrieval/vector_store.py 使用 faiss.IndexFlatIP 保存 chunk embedding。Agent 启动时会解析 data/manuals ，构建向量索引和 BM25 索引，并把在线启动缓存保存到 cache/retriever_cache*.pkl 。 build_index.py 也提供了离线构建 FAISS / BM25 索引的脚本，输出到 data/faiss_index ，但这套离线产物当前没有直接接入在线服务初始化。

我当前用 FAISS，是因为它轻量、本地可跑、开发调试快，不依赖额外数据库服务。它适合验证 chunk 切分、BGE embedding、RRF 融合、Reranker、图片 image_ids 跟随 chunk 返回这些核心问题。

### BM25 在客服场景里非常实用

BM25Retriever 不是一个落后方案。客服问题里经常有型号、错误码、按钮名、配件名、政策关键词，这些信息靠语义相似度未必稳定。项目的 HybridRetriever 会把向量召回、BM25 召回和图片 caption 召回做 RRF 融合，再按运行时配置可选叠加 BGE Reranker 精排；如果 FlagEmbedding 不可用，会回退到 RRF 顺序。

面试里我会强调：RAG 不是只看语义相似度。很多产品手册问答需要精确命中，尤其是型号、故障码和手册章节。

### 内存 / Redis 会话是阶段性选择

SessionManager 当前支持内存会话，保存历史对话、已识别产品型号、品牌、错误码等上下文。 RedisSessionManager 则提供同样的方法接口，用 Redis 保存历史和上下文，并设置 TTL。

所以 Redis 在当前项目里更准确的状态是「可选支持」，不是我已经把生产级 Redis 集群、限流、任务状态全部上线了。当前它主要服务于会话后端切换；生产化时可以继续扩展到缓存、限流、任务进度和短期 trace buffer。

### 评估接口是从 Demo 走向工程化的标志

/evaluation/run 会通过 EvaluationJobManager 拉起 scripts/eval_submission.py 。评估脚本会批量调用 agent.handle_request ，记录 answer、image_ids、候选图片、检索命中、幻觉标记、 `<PIC>` 对齐等指标。

这点很重要。RAG 不能只靠主观感觉调参。评估接口能帮我定位问题到底发生在检索、生成、图片选择、幻觉检查，还是最终提交格式。

## 3. 当前未接入：Milvus、MinIO、MongoDB、MySQL

当前项目没有实际接入 Milvus、MinIO、MongoDB、MySQL。这个边界必须讲清楚，因为面试官很容易追问：你说这些组件，是代码里已经有，还是你生产化时准备这么设计？

            我的回答会很明确：当前项目优先验证 Agent + RAG + 多模态 + 幻觉治理闭环，所以没有一开始就把所有基础设施都接入。不是这些组件不重要，而是早期阶段过早引入它们，会增加部署复杂度，反而拖慢核心链路验证。

早期阶段

FAISS 验证向量检索，本地文件管理手册和图片，JSON / manifest 描述图片元数据，内存或 Redis 维护短期会话。

小规模试运行

Redis 接入会话和限流，MinIO 管理文件，MongoDB 管理 manifest 和 trace，继续保留 FAISS 或小规模 Milvus。

生产阶段

Milvus 承担向量检索，MinIO 承担对象存储，MongoDB 管元数据和 trace，MySQL 管业务强一致数据，Redis 管缓存和状态。

真正的工程能力不是把所有中间件都堆上去，而是知道什么时候该引入它们，以及它们各自负责什么边界。

## 4. 为什么当前用 FAISS：轻量、开发快、本地可跑

在项目早期，我最需要验证的不是「向量数据库部署得多漂亮」，而是 RAG 链路本身是否可靠：chunk 切分是否合理、embedding 文本怎么组织、BGE 是否能召回正确章节、BM25 和向量检索如何融合、Reranker 是否有必要、 `<PIC>` 和 image_ids 能否跟随 chunk 返回。

这些问题都可以用 FAISS 快速验证。它不需要额外部署服务，启动成本低，也方便我直接检查 index、chunk_id 和 image_ids 的映射关系。对于求职项目、个人 PoC、低数据量手册问答，FAISS 是很合适的选择。

但 FAISS 的不足也很明显：分布式能力弱，多租户权限隔离需要自己做，索引在线更新和版本管理需要额外设计，多服务实例共享索引不方便，数据量大以后维护成本会上升。

            面试总结可以这样说：我当前用 FAISS 不是因为它一定适合生产，而是因为它适合在项目早期快速验证 RAG 检索链路。等数据规模、多租户和在线更新成为主要矛盾时，再切到 Milvus 这类向量数据库更合理。

## 5. 什么时候换 Milvus：数据量大、多租户、分布式检索

Milvus 在生产版架构里应该放在向量检索层。它负责存储 chunk embedding，支持大规模向量检索，管理 collection，按 tenant_id、product_id、manual_id 等字段过滤，并承载多副本、高并发、分布式部署。

迁移触发条件很清楚：手册数量明显增加，产品线变多，多租户需求出现，一个服务实例无法承载全部向量索引，需要在线更新知识库，或者需要隔离不同商家和不同产品线。到这个阶段，再继续把向量索引绑在应用进程里，就会影响扩展性和运维。

生产版 Milvus 查询链路
```
1. FastAPI 收到 query
2. Agent 生成 query embedding
3. 带 tenant_id / product_id / manual_id 到 Milvus 检索 topK
4. Milvus 返回 chunk_id 和 score
5. 后端根据 chunk_id 去 metadata store 取正文、标题、图片、source
6. 与 BM25 / Search Engine 结果做 RRF 融合
7. Reranker 精排后构造 prompt 和候选图片池
```

Milvus 不应该存完整业务对象，也不应该承担用户权限、工单、审计、图片文件管理。它主要负责向量索引和向量检索。完整 chunk metadata、图片 caption、章节树、trace 应该放 MongoDB，用户权限和业务状态应该放 MySQL。

它的代价也要讲清楚：部署、监控、索引管理、数据同步、备份恢复都会变复杂。所以我不会在 Demo 阶段盲目接入 Milvus，而是等规模和在线更新成为主要矛盾时再迁移。

## 6. MinIO 放什么：手册、图片、上传文件、评估产物

MinIO 是对象存储层，适合放大文件和非结构化文件。生产版里，原始 PDF 手册、解析后的附件、手册配图、用户上传图片、OCR 中间结果、评估数据集、批量评估产物、日志归档、导出报告，都应该进入对象存储。

MinIO 不负责复杂查询，也不负责业务关系建模。它保存文件本体，返回 object key 或授权 URL。真正的 image_id、caption、section、product_id、manual_id、权限信息，要放在数据库里。

生产版文件链路
```
管理员上传产品手册 PDF
  -> 文件写入 MinIO
  -> MySQL / MongoDB 记录上传任务和手册版本
  -> Worker 异步解析文本、图片、表格
  -> 图片继续写入 MinIO
  -> 图片 metadata 写入 MongoDB
  -> chunk embedding 写入 Milvus
  -> 前端通过后端授权接口获取临时图片 URL
```

为什么不用本地文件系统？因为生产里通常是多实例部署，本地文件不共享；容器重启可能丢失；权限控制弱；备份迁移困难；文件量大以后也不好管理。对象存储的价值，就是把文件生命周期从应用进程里拆出去。

## 7. MongoDB 放什么：图片 manifest、标注、trace、知识库元数据

当前项目里的 ImageManifest 是轻量实现，构建期把 image_id、manual_name、section_title、nearby_text 绑定起来，并可以保存成 JSON。这个设计在 Demo 阶段足够，但生产化后它应该进入更灵活的 metadata store。

MongoDB 适合存结构灵活、字段变化频繁、嵌套结构多的数据，比如 image manifest、图片 caption、图片和 chunk 绑定关系、手册章节树、chunk metadata、RAG trace、LLM 调用 trace、幻觉检查结果、质量检查结果、人工标注结果、评估样本、多模态识别结果。

image manifest 示例
```
{
  "image_id": "img_install_001",
  "manual_id": "manual_x1",
  "product_id": "coffee_machine_x1",
  "section_id": "install_step_01",
  "caption": "底座与主机卡槽对齐示意图",
  "object_key": "manuals/x1/images/img_install_001.png",
  "related_chunk_ids": ["chunk_001", "chunk_002"],
  "pic_position": 1,
  "page": 12,
  "source": "用户手册"
}
```

这类数据不一定适合全部放 MySQL，因为不同产品手册结构差异大，caption、OCR、trace、模型输出都是嵌套结构，评估日志字段也会不断扩展。但 MongoDB 不适合承担强事务业务，比如用户权限、订单、工单状态流转和审计主表，这些更适合 MySQL。

## 8. MySQL 放什么：用户、权限、任务、工单、审计日志

MySQL 在生产版系统里应该放强结构化、关系明确、需要事务和审计的数据。比如用户表、角色表、权限表、租户表、产品表、手册版本表、上传任务表、解析任务表、工单表、工单状态流转、人工客服处理记录、审计日志、API 调用记录、计费或配额数据。

这些数据的特点是表结构相对稳定，关系明确，需要事务一致性、权限控制和长期审计，也可能需要和现有业务系统对接。比如用户上传手册后，文件本体放 MinIO，手册版本和上传任务状态放 MySQL，解析出的图片和 chunk metadata 放 MongoDB，向量写入 Milvus。

            面试官常问：为什么不用 MongoDB 存所有东西？我的回答是，MongoDB 灵活，但用户、权限、工单、审计、任务状态这类生产业务数据更需要事务、约束、关联查询和稳定 schema。长期维护时，不应该把所有数据塞进一个库，而应该按数据特性分层。

## 9. Redis 放什么：会话、缓存、限流、任务进度

Redis 适合存短生命周期、高频访问、允许过期的数据。当前项目已经有 RedisSessionManager ，可以把最近几轮对话和会话上下文从内存切到 Redis。生产化后，它还可以承担检索缓存、embedding 缓存、热门 FAQ 缓存、限流计数器、异步任务进度、SSE / WebSocket 推送状态、分布式锁和短期 trace buffer。

Redis 不是长期事实库，不应该保存必须永久留存的工单、审计、用户权限、手册原始数据。它更适合做缓存、状态和加速层。

会话上下文

保存最近几轮对话、已确认产品型号、用户上传图片摘要、候选证据摘要。

缓存与限流

缓存重复 query 的检索结果和 embedding，按 user_id、tenant_id、IP、API key 做频控。

任务进度

手册解析、切 chunk、embedding、写 Milvus 都可以异步执行，Redis 保存短期状态供前端查询。

引入 Redis 也有代价：key 设计、过期策略、内存淘汰、缓存击穿、缓存一致性、集群高可用，都需要工程处理。

## 10. 生产版请求链路：一次 /chat 请求怎么跑

当前代码里的 /chat 已经把请求转到 agent.handle_request 。生产化后，我会在这条链路前后补齐鉴权、限流、对象存储、metadata store、审计和异步日志。

- 前端发送文本、图片、会话 ID 到 FastAPI。

- FastAPI 做鉴权、限流、参数校验。

- Redis 读取会话上下文。

- 如果有用户上传图片，图片文件写入 MinIO。

- 图片 OCR / 视觉理解结果写入 MongoDB trace。

- Agent 根据用户问题和图片理解结果构造 query。

- 生成 query embedding。

- 到 Milvus 做向量召回。

- 同时走 BM25 / Elasticsearch / OpenSearch 等关键词召回。

- 根据 chunk_id 从 MongoDB 取 chunk metadata、image manifest、caption。

- RRF / reranker 融合排序。

- 构造候选图片池。

- LLM 生成回答。

- 幻觉检查和质量检查。

- trace 写入 MongoDB。

- 工单或审计结果写入 MySQL。

- 会话摘要写入 Redis。

- FastAPI 返回 answer、image_ids、trace_id 给前端。

- 前端通过 image_ids 请求后端授权图片 URL，再从 MinIO 渲染图片。

注意，生产版不是每一步都必须同步执行。手册解析、embedding 构建、评估任务、日志归档都应该异步化；在线请求里只保留真正影响回答的关键路径。

Mermaid 生产版 /chat 请求链路图

```mermaid
graph TD
  U["Web 前端<br/>文本、图片、会话 ID"] --> API["FastAPI /chat<br/>鉴权、限流、参数校验"]
  API --> REDIS_IN["Redis<br/>读取会话上下文"]
  API --> UPLOAD{"是否有用户上传图片"}
  UPLOAD -->|"有图片"| MINIO_IN["MinIO<br/>保存用户上传图片"]
  UPLOAD -->|"无图片"| AGENT_IN["Agent Orchestrator"]
  MINIO_IN --> VISION["图片 OCR / 视觉理解"]
  VISION --> MONGO_VISION["MongoDB<br/>写入图片理解 trace"]
  MONGO_VISION --> AGENT_IN
  REDIS_IN --> AGENT_IN

  AGENT_IN --> QUERY["构造增强 query<br/>融合文本、图片理解、会话上下文"]
  QUERY --> EMB["生成 query embedding"]
  EMB --> MILVUS["Milvus<br/>向量召回 topK chunk_id"]
  QUERY --> SEARCH["BM25 / Elasticsearch / OpenSearch<br/>关键词召回"]
  MILVUS --> META["MongoDB<br/>读取 chunk metadata、image manifest、caption"]
  SEARCH --> META
  META --> RRF["RRF / Reranker<br/>融合排序"]
  RRF --> IMG_POOL["构造候选图片池"]
  IMG_POOL --> LLM["LLM 生成 answer + image_ids"]
  LLM --> GUARD["幻觉检查 + 质量检查"]

  GUARD --> TRACE["MongoDB<br/>写入 RAG trace、质量结果"]
  GUARD --> AUDIT["MySQL<br/>写入工单或审计结果"]
  GUARD --> REDIS_OUT["Redis<br/>写入会话摘要"]
  GUARD --> RESP["FastAPI 返回<br/>answer、image_ids、trace_id"]
  RESP --> FE_IMG["前端用 image_ids<br/>请求后端授权图片 URL"]
  FE_IMG --> MINIO_OUT["MinIO<br/>返回临时可访问图片"]
  MINIO_OUT --> RENDER["前端渲染回答和图片"]
```

## 11. 生产版知识库构建链路

当前项目里， KnowledgeBaseBuilder 会解析 data/manuals 下的手册，把带 `<PIC>` 的正文切成 chunk，并生成 image manifest。生产化后，这条链路要从启动时同步构建，演进为异步任务和版本化发布。

Mermaid 知识库构建流程图

```mermaid
graph TD
  A["管理员上传 PDF / Word / HTML 手册"] --> B["MinIO 保存原始文件"]
  B --> C["MySQL 创建上传任务和手册版本"]
  C --> D["Worker 拉取解析任务"]
  D --> E["解析文本、章节、表格、图片"]
  E --> F["图片写入 MinIO"]
  E --> G["生成 chunk 与 image manifest"]
  F --> H["MongoDB 写入图片 caption、section、object_key"]
  G --> H
  G --> I["生成 chunk embedding"]
  I --> J["Milvus 写入向量索引"]
  G --> K["BM25 / Search Engine 同步更新"]
  J --> L["跑 smoke test 和 RAG 评估"]
  K --> L
  L --> M["MySQL 更新版本状态"]
  M --> N["发布为线上可检索版本"]
```

手册版本管理非常关键。它能防止更新手册时影响线上回答，支持回滚，支持 A/B 测试，也能让 trace 追溯到「这次回答基于哪一个版本的手册」。

## 12. 数据应该怎么分层：不要把所有东西塞进一个库

生产级 RAG Agent 最容易犯的错误，是把所有数据都塞进一个数据库，或者反过来把所有中间件都接上但边界不清。我的拆分原则是：按数据生命周期、查询方式、一致性要求和文件大小来分层。

数据类型

示例

推荐存储

原因

当前状态

生产化价值

向量索引

chunk embedding

FAISS / Milvus

向量相似度检索

当前 FAISS，本地构建和缓存

大规模、多租户时切 Milvus

关键词索引

BM25 corpus、jieba tokens

BM25 / Search Engine

型号、错误码、按钮名需要精确命中

当前 BM25 已落地

可扩展到 ES / OpenSearch

原始文件

PDF、手册配图、上传截图

MinIO

对象存储适合大文件和多实例共享

当前本地文件 / base64 上传

统一文件生命周期和权限控制

图片 manifest

image_id、caption、section

MongoDB

结构灵活，适合嵌套 metadata

当前 JSON / 内存 ImageManifest

支持多模态检索和可追溯配图

chunk metadata

chunk_id、manual_id、source、image_ids

MongoDB

字段会随检索策略和评估需求变化

当前 ChunkData / pickle cache

向量库只返 id，metadata 独立查询

用户权限

user、role、tenant

MySQL

关系清晰、需要事务和审计

当前仅有可选 Bearer Token

生产必需，支持租户隔离

会话缓存

session context、最近历史

Redis

短期高频状态，可过期

当前内存 / 可选 Redis

支持多实例、TTL、快速读取

评估 trace

retrieval hits、answer、quality_score

MongoDB

字段灵活，便于诊断和检索

当前 RequestTrace / metrics 文件

支持检索调参和质量闭环

业务审计

工单、人工接管、API 调用记录

MySQL

需要稳定 schema 和可追责

当前未接入

生产客服系统必需

### 当前架构 vs 生产架构对比表

层级

当前架构

生产架构

为什么这样演进

服务入口

FastAPI，`/chat`、`/chat/upload`、`/metrics`

FastAPI / API Gateway + 鉴权、限流、审计

把模型调用和业务规则收敛在后端

向量检索

FAISS 本地索引

Milvus collection + metadata filter

支持大规模、多租户、在线更新和分布式部署

关键词检索

BM25 + jieba + boost tokens

BM25 / Elasticsearch / OpenSearch

型号、错误码、政策关键词需要精确召回

文件存储

本地 `data/manuals`、`data/images`

MinIO 对象存储

多实例共享、备份、权限和生命周期管理

多模态元数据

ImageManifest JSON / 内存对象

MongoDB image manifest + trace

caption、OCR、chunk 绑定字段变化频繁

业务数据

当前未建模

MySQL 管用户、租户、权限、工单、审计

强一致、可审计、关系清晰

会话状态

内存 SessionManager / 可选 Redis

Redis 集群 + TTL + 限流 + 任务状态

支持多实例和高频短期状态

评估观测

RequestTrace、MetricsCollector、评估脚本

MongoDB trace + 指标看板 + 告警

从调试工具演进为生产可观测性

## 13. 生产版架构图

下面这张图不是当前代码已经全部实现的架构，而是我基于当前项目设计的生产化扩展架构。当前已实现的是 FastAPI、Agent、FAISS、BM25、会话管理、评估和 trace；Milvus、MinIO、MongoDB、MySQL 是生产化后应该接入的位置。

中文流程图：生产版在线主链路

01 入口

前端 / 管理后台

提交问题、图片、会话 ID；管理员上传手册和查看评估结果。

02 后端入口

FastAPI

统一接收请求，做鉴权、限流、参数校验，不让前端直连模型。

03 Agent 编排

Agent Orchestrator

图片理解、query 增强、意图判断、检索编排、Prompt 构造。

04 证据检索

Milvus / BM25 / MongoDB

向量召回、关键词召回，再补全 chunk、caption、image manifest。

05 生成与风控

LLM + 质量守门

生成 answer 和 image_ids，并做幻觉检查、质量检查、对齐校验。

06 返回与落库

前端渲染 / Trace

返回 answer、image_ids、trace_id；图片走授权 URL，日志写入存储层。

模块分工：每个组件到底负责什么

### FastAPI 后端服务层

系统入口，不做大模型直连代理，而是承载业务规则。

- /chat 、 /chat/upload 、 /metrics

- 鉴权、限流、参数校验、结果适配

- 调用 agent.handle_request

### Agent 编排层

把一次客服请求拆成多步任务，而不是只写一个 prompt。

- 图片理解、query 增强、意图判断

- 检索编排、候选图片池、Prompt 构造

- 幻觉检查、质量检查、重新生成

### RAG 检索层

负责把用户问题变成有依据的证据包。

- 当前：FAISS + BM25 + 可选 Reranker

- 生产：Milvus 负责向量检索

- MongoDB 补全 chunk、caption、image manifest

### 对象存储层 MinIO

只管文件本体，不管复杂查询和业务关系。

- 原始手册、手册配图、用户上传图片

- 评估产物、导出报告、日志归档

- 通过后端发放临时授权 URL

### 业务数据层 MySQL

放强结构化、需要事务和审计的数据。

- 用户、租户、角色、权限

- 上传任务、手册版本、工单状态

- 审计日志、API 调用记录、配额

### 缓存与观测层

Redis 和日志系统负责运行态加速与问题定位。

- Redis：会话、缓存、限流、任务进度

- MongoDB：RAG trace、模型调用、评估结果

- Metrics：延迟、质量分、幻觉率、重生成率

中文伪代码：生产版请求怎么跑
```
收到 /chat 请求：
    FastAPI 先做鉴权、限流、参数校验
    从 Redis 读取最近会话上下文

如果用户上传了图片：
    图片文件保存到 MinIO
    OCR / 视觉理解结果写入 MongoDB trace
    图片摘要进入 Agent 的 query 增强

Agent 开始处理：
    根据用户文本 + 图片理解 + 会话上下文构造检索 query
    Milvus 做语义向量召回，返回 chunk_id
    BM25 / Search Engine 做关键词召回，命中型号、错误码、按钮名
    MongoDB 根据 chunk_id 补全正文、章节、caption、image_ids
    RRF / Reranker 融合排序，得到最终证据包

模型生成前：
    Prompt 只注入检索证据和候选图片池
    LLM 生成 answer 和 image_ids

生成后：
    规则校验 <PIC> 与 image_ids 是否对齐
    LLM 事实核查回答是否基于证据
    QualityChecker 检查是否完整、清楚、可执行

最后返回：
    MongoDB 写入 RAG trace 和质量结果
    MySQL 写入工单 / 审计 / API 调用记录
    Redis 更新会话摘要
    FastAPI 返回 answer、image_ids、trace_id
    前端用 image_ids 请求授权图片 URL，并从 MinIO 渲染图片
```

## 14. 当前架构到生产架构的演进路线

### 阶段一：本地 Demo / 求职项目阶段

FastAPI + FAISS + BM25 + 本地文件 + JSON metadata + 内存 session + 基础评估脚本。目标是验证 Agent + RAG + 多模态 + 幻觉治理闭环。当前项目主要处在这个阶段，同时已经预留了 Redis 会话和评估接口。

### 阶段二：小规模试运行

Redis 接入会话和限流，MinIO 管理文件和图片，MongoDB 管理 image manifest 和 trace，保留 FAISS 或小规模 Milvus，增加评估接口和日志看板。目标是让系统可部署、可追踪、可恢复。

### 阶段三：生产化

Milvus 承担向量检索，MySQL 管理租户、用户、权限、任务、工单，MongoDB 管理多模态 metadata 和 trace，MinIO 管理对象存储，Redis 做缓存、限流和任务状态，Worker 做异步手册解析和索引构建，再补上监控、告警、灰度和回滚。

            工程演进要跟业务阶段匹配。过早堆满基础设施，会让 Demo 阶段的核心问题被部署复杂度掩盖；但到了生产阶段还把所有东西放在本地文件和内存里，也是不负责任。

## 15. 面试可讲亮点：这个项目体现了哪些系统设计能力

- 架构分层能力。 前端、FastAPI、Agent、RAG、存储、评估、日志边界清楚，不让前端直接碰模型。

- 技术选型能力。 FAISS 适合早期验证，Milvus 适合规模化检索；BM25 在客服场景里仍然非常重要。

- 数据建模能力。 向量、对象文件、metadata、业务数据、缓存状态各自放在合适的位置。

- 后端工程能力。 代码里有 FastAPI 接口、请求校验、会话管理、可选 Redis、评估任务和 metrics 汇总。

- 生产意识。 生产化要考虑对象存储、权限、审计、限流、任务状态、trace 和版本回滚。

- 可观测性意识。 通过 RequestTrace、MetricsCollector、评估脚本记录检索命中、幻觉、质量分和重新生成。

- 演进思维。 不是一次性堆满组件，而是从 Demo 到小规模试运行，再到生产化分阶段演进。

## 16. 1 分钟面试口述版

            当前版本我主要把 Agent + RAG + 多模态 + 幻觉治理这条核心链路跑通了。后端用 FastAPI，对外提供 chat、upload、stream（SSE 分块输出完整答案）、metrics 和 evaluation 相关接口；检索层当前用 FAISS + BM25，在线启动缓存放在 `cache/retriever_cache*.pkl`，适合本地开发和快速验证，也方便调 chunk、embedding 和图片 image_ids 的绑定。Redis 在项目里是可选会话后端，可以从内存 session 切过去。生产化的话，我不会简单把中间件堆上去，而是按数据类型拆：向量索引迁到 Milvus，文件和图片放 MinIO，图片 manifest、chunk metadata、RAG trace 放 MongoDB，用户、权限、任务、工单、审计放 MySQL，Redis 负责会话、缓存、限流和任务进度。这样系统才能从一个本地 Demo 变成可扩展、可观测、可维护的生产版 RAG Agent。

## 17. 面试官可能追问的问题和参考回答

### 1. 为什么当前用 FAISS，而不是一开始就用 Milvus？

当前阶段我最需要验证的是 RAG 链路本身，包括 chunk 切分、embedding 效果、BM25 融合、可选 Reranker 和 image_ids 跟随 chunk 返回。FAISS 本地可跑，不需要额外部署服务，调试 chunk_id 和索引映射也很方便。Milvus 更适合数据规模、多租户、在线更新成为主要矛盾以后再接入。早期直接上 Milvus 会让基础设施复杂度盖过核心链路验证。

### 2. FAISS 迁移 Milvus 的触发条件是什么？

触发条件主要是规模和运维需求。比如手册数量明显增加，产品线变多，需要多租户隔离，需要在线更新知识库，或者一个应用实例无法承载所有向量索引。还有一种情况是多实例部署后，本地 FAISS 索引共享和版本一致性变得困难。到这些节点，Milvus 作为独立向量检索服务更合适，可以用 collection 和 metadata filter 管理不同产品或租户。

### 3. MinIO、MongoDB、MySQL 分别存什么？为什么不放一个库？

我会按数据特性拆。MinIO 放文件本体，比如 PDF、手册配图、用户上传图片和评估产物；MongoDB 放结构灵活的 metadata，比如 image manifest、caption、chunk metadata、trace 和评估结果；MySQL 放强结构化业务数据，比如用户、租户、权限、任务、工单和审计。一个库能省事，但长期会让文件、索引、业务关系和审计全部混在一起，维护成本更高。

### 4. Redis 在这个项目里具体能解决什么问题？

当前代码里 Redis 可以作为可选会话后端，保存最近几轮对话、已确认产品型号、错误码等上下文。生产化后，Redis 还能做检索缓存、embedding 缓存、热门 FAQ 缓存、限流计数器、任务进度和短期 trace buffer。它适合短生命周期、高频访问、允许过期的数据，不适合保存必须长期留存的工单、权限、审计和手册原始数据。

### 5. 会话上下文应该放 Redis 还是 MySQL？

短期会话上下文更适合 Redis，比如最近几轮对话、已识别型号、用户上传图片摘要、最近候选证据。这些数据访问频繁、生命周期短、可以设置 TTL。MySQL 更适合长期业务状态，比如工单、用户、权限、审计记录。如果某些会话最终升级为工单，可以把关键摘要和审计结果落到 MySQL，但在线聊天上下文本身不应该每轮都强依赖 MySQL。

### 6. 用户上传图片如何存储和鉴权？

当前 /chat/upload 会把上传图片转成 base64 交给 Agent，这是 Demo 和本地验证可接受的做法。生产环境里，我会把图片写入 MinIO，数据库记录 object_key、image_id、tenant_id、user_id、过期时间和用途。前端不能直接拿公开 URL，而是通过后端鉴权后获取临时访问 URL。这样能控制图片访问权限，也方便删除、归档和审计。

### 7. 手册更新后，如何保证向量索引和 metadata 一致？

生产里需要手册版本管理。上传新手册后先创建版本和解析任务，Worker 解析文本、图片、chunk、caption，再写 MongoDB metadata 和 Milvus 向量索引。写入完成后跑 smoke test，通过后才把版本状态切为可用。在线请求始终带 manual_version 或知识库版本检索。旧版本先保留一段时间，方便 trace 追溯和回滚，避免 metadata 已更新但向量索引没更新的中间态影响线上。

### 8. 如何支持多租户和权限隔离？

多租户要从三层做隔离。请求层通过 API key、user_id、tenant_id 做鉴权；检索层在 Milvus 查询时带 tenant_id、product_id、manual_id filter，BM25 / Search Engine 也要按租户过滤；数据层里 MinIO object key、MongoDB metadata、MySQL 业务表都记录 tenant_id。这样模型构造 prompt 时只会拿到当前租户允许访问的证据，避免跨商家、跨产品线泄漏。

### 9. RAG trace 应该记录哪些字段？

至少要记录 trace_id、session_id、query、图片数量、图片理解结果、意图、检索 query、retrieved_chunk_ids、retrieved_manuals、candidate_image_ids、reranker 分数、最终 answer、image_ids、幻觉检查结果、质量分、是否重新生成、各步骤耗时、模型调用和错误信息。当前项目的 RequestTrace 已经记录了步骤耗时、检索数量、幻觉、质量分、模型调用和 fallback，生产版可以扩展到 MongoDB。

### 10. 评估接口在生产中有什么价值？

评估接口不是只为了比赛提交，它能帮助定位线上质量问题。比如回答差，到底是检索没命中、图片候选池错了、生成跑偏，还是幻觉检查过严。当前项目的评估脚本会记录 `<PIC>` 对齐、image_id 可用性、检索命中和 hallucination_rate。生产中可以用固定评估集做回归测试，新手册上线、prompt 变更、模型切换前都跑一轮，降低灰度风险。

### 11. 如果 Milvus 挂了，系统怎么降级？

首先要区分故障范围。如果只是向量检索不可用，可以短期降级到 BM25 / Search Engine 和热门 FAQ 缓存，回答时降低置信度，并对需要手册证据的问题更保守。Redis 中如果有最近检索缓存，也可以复用。对高风险售后结论，不应该在没有证据时硬答。长期方案是 Milvus 多副本、健康检查和熔断，必要时切到备用 collection 或只读快照。

### 12. 如果 Redis 缓存失效，系统还能不能工作？

应该能工作，但体验和成本会受影响。Redis 保存的是短期会话、缓存和任务状态，不应该是唯一事实源。如果 Redis 失效，在线问答可以退化为无历史上下文的单轮请求，检索和生成仍然能跑；限流和缓存收益会消失，延迟和 LLM 成本可能上升。真正必须长期保存的任务、工单、审计、权限，应落在 MySQL 或 MongoDB，不能只依赖 Redis。

### 13. 手册解析和 embedding 构建为什么要异步？

手册解析、图片抽取、OCR、caption 生成、chunk embedding、写 Milvus 都是耗时任务。如果同步放在上传接口里，前端会长时间等待，也容易因为超时导致任务中断。异步 Worker 可以把任务拆成阶段，Redis 或 MySQL 记录进度，失败后重试，完成后再发布新版本。这样在线 /chat 请求只走已经构建好的知识库，不被离线构建拖慢。

### 14. 生产环境如何做版本管理和回滚？

每次手册更新都应该生成新的 manual_version 或 kb_version。Milvus collection 或分区、MongoDB metadata、MinIO object key、MySQL 手册版本表都要能关联到这个版本。发布前跑评估和 smoke test，通过后切换线上版本。trace 里记录使用的版本，出现问题时可以把租户或产品线切回旧版本。这样回滚不是改文件，而是切换检索和 metadata 的版本指针。

### 15. 怎么控制 LLM 成本和延迟？

我会从四层控制。第一，检索层控制 topK 和 reranker 截断，避免把太多 chunk 塞进 prompt；第二，Redis 缓存 embedding、热门 query 和重复检索结果；第三，按问题类型路由，简单 FAQ 不一定走完整多模态链路；第四，trace 记录 tokens、延迟和 fallback，找出高成本请求。对高风险回答可以保留事实核查，对低风险通用问题则减少不必要的模型调用。

## 18. 简历项目亮点

基于 FastAPI 搭建多模态 RAG Agent 服务，封装聊天、上传、评估与质量检查接口。

使用 FAISS + BM25 + 图片 caption 召回实现轻量混合检索，并设计 Milvus 生产迁移方案。

设计 `<PIC>` 与 image_ids 对齐协议，结合幻觉检查和质量检查降低多模态输出风险。

设计生产版数据分层，将向量、对象文件、元数据、业务数据和缓存状态解耦管理。

接入 RequestTrace、MetricsCollector 与评估脚本，支持检索、生成、配图和质量问题定位。',
  4,
  null,
  'PUBLISHED',
  '2026-06-03 00:00:00+08'::timestamptz
from projects
where projects.slug = 'mmcsa'
on conflict (slug) do nothing;

insert into blog_posts (
  project_id,
  title,
  slug,
  category,
  summary,
  content_markdown,
  blog_order,
  cover_image_url,
  status,
  published_at
)
select
  projects.id,
  '设备状态模型怎么设计',
  'momozhi/2026-05-01-device-state-model',
  '架构笔记',
  '记录智能家居控制台里设备在线、离线、异常和同步中的状态建模方式。',
  '## 问题

智能家居面板不是简单地展示开关状态。真实设备会掉线、延迟、上报失败，也可能处在本地操作已经发生但云端还没确认的中间状态。

如果只用 `on` 和 `off` 两个值，界面会很快变得不可信。

## 设计

我把设备状态拆成三层：

- 业务状态：开、关、自动、节能。
- 连接状态：在线、离线、弱连接。
- 同步状态：空闲、提交中、失败、等待回滚。

这样 UI 可以同时表达“灯现在是开的”和“这次开灯操作还没有被设备确认”。

## 收获

前端状态不是后端字段的直接翻译。它应该服务于用户判断：当前发生了什么、能不能操作、失败后能不能恢复。',
  0,
  null,
  'PUBLISHED',
  '2026-05-01 00:00:00+08'::timestamptz
from projects
where projects.slug = 'momozhi'
on conflict (slug) do nothing;

insert into blog_posts (
  project_id,
  title,
  slug,
  category,
  summary,
  content_markdown,
  blog_order,
  cover_image_url,
  status,
  published_at
)
select
  projects.id,
  '房间仪表盘的信息密度',
  'momozhi/2026-05-04-room-dashboard-layout',
  '设计复盘',
  '复盘房间卡片、设备列表和快捷控制之间的信息层级。',
  '## 布局目标

房间仪表盘的用户目标很直接：快速知道家里哪里异常，并且能立即处理。

所以页面不能做成纯展示型卡片墙，而要把异常、常用设备和快捷动作放在更靠前的位置。

## 处理方式

首页只展示每个房间的摘要：温度、湿度、在线设备数、异常数量。进入房间详情后，再显示设备分组和历史数据。

快捷控制只保留三个：灯光总开关、空调模式和安防布防。其余操作放进详情页，避免主界面过载。

## 收获

高频场景需要更少选择。仪表盘不是把所有数据摆出来，而是帮助用户决定下一步。',
  0,
  null,
  'PUBLISHED',
  '2026-05-04 00:00:00+08'::timestamptz
from projects
where projects.slug = 'momozhi'
on conflict (slug) do nothing;
