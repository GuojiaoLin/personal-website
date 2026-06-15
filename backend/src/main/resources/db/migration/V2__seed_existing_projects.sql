insert into projects (
  title,
  slug,
  summary,
  description_markdown,
  cover_image_url,
  tech_stack,
  sort_order,
  status
) values
(
  '墨墨知 AI 智能论文阅读平台',
  'momozhi',
  '一个面向科研与学习场景的 AI 论文助手，聚合论文发现、批量解析、深度解读、研究问答、内容发布和科研画像。',
  '一个面向科研与学习场景的 AI 论文助手，聚合论文发现、批量解析、深度解读、研究问答、内容发布和科研画像。',
  null,
  '["React Native","Next.js","FastAPI","Agentic RAG","LangGraph"]',
  10,
  'PUBLISHED'
),
(
  '多模态智能客服 Agent',
  'mmcsa',
  '一个面向产品售后问答的智能客服中枢，融合图片理解、手册检索、会话记忆和质量校验，能生成带依据、可配图的中英文回复。',
  '一个面向产品售后问答的智能客服中枢，融合图片理解、手册检索、会话记忆和质量校验，能生成带依据、可配图的中英文回复。',
  null,
  '["React","Spring Boot","PostgreSQL","RAG","Multimodal Agent"]',
  20,
  'PUBLISHED'
)
on conflict (slug) do nothing;
