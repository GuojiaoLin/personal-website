---
title: 多模态客服 Agent 怎么防幻觉：图片、证据和 <PIC> 的硬规则
date: 2026-06-02
project: 多模态智能客服 Agent
projectSlug: mmcsa
projectDescription: 一个面向产品售后问答的智能客服中枢，融合图片理解、手册检索、会话记忆和质量校验，能生成带依据、可配图的中英文回复。
summary: 这篇文章不是讲“怎么调用一个大模型 API”。我更想复盘的是：在真实客服场景里，用户上传图片、系统检索手册、模型插入配图、前端渲染图片，这一整条链路怎样才能不乱答、不乱配图、不编造 image_id。
tags: [图片证据, 幻觉治理, PIC]
category: 质量治理
order: 3
---
我做这个多模态客服 Agent 时，最早踩到的坑不是“模型不会回答”，而是“模型太会回答”。用户问一个售后问题，模型可以很快给出一段看起来合理的建议；用户上传一张故障图，模型也能描述得像那么回事。但客服系统不能只追求像，尤其是涉及产品手册、故障判断、售后政策和配图时，回答必须有证据。

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

项目里的 QualityChecker.check_and_improve 会基于完整性、结构、配图准确性等维度打分，低于阈值时会带着 improvement_hint 调用生成函数重新生成。它还有防退化逻辑：如果新答案为空、过短、过度推诿，或者原本有图片但新答案丢了图片，就不会轻易接受。这个设计让系统既控制风险，也保证回答对用户真的有帮助。
