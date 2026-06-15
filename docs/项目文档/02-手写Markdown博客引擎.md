---
title: 手写一个 Markdown 博客引擎：从 .md 文件到带图表的页面
date: 2026-06-14
project: 个人网站（全栈）
projectSlug: personal-website
summary: 这篇拆解前端里我自己写的 Markdown 引擎：博客内容怎么在构建期被加载、frontmatter 怎么解析、一段 Markdown 怎么被我手写的解析器变成 React 节点、Mermaid 图表怎么懒加载渲染，以及为什么我没有直接用 react-markdown。重点是编译期 vs 运行时、按需加载和 XSS 防护这几个工程判断。
tags: [React, Markdown, Vite, XSS, Mermaid]
category: 前端深度
order: 2
---

## 1. 开篇：为什么不直接用 react-markdown

最快的做法当然是 `npm i react-markdown remark-gfm`，三行搞定。我没这么做，有几个具体原因：

- 我的博客有一些**非标准语法**：Obsidian 风格的图片 `![[图片名|60%]]`、中文图注 `图 1：...`、需要交互渲染的 `mermaid` 代码块。用现成库要写一堆插件去 hook，未必比自己写省事；
- 我想**完全控制每个块渲染成什么 HTML、挂什么 Tailwind 类**，而不是覆盖一层库的默认样式；
- 这是个**面试项目**——「我用了一个 Markdown 库」和「我能自己写一个词法/块级解析器，并且想清楚了 XSS 和按需加载」，后者能聊的东西多得多。

代价我也清楚：自研引擎只支持我用到的语法子集，不是 CommonMark 全量实现。这个边界我在第 8 节会写明白。

## 2. 内容加载：编译期 glob，而不是运行时请求

第一个关键决策：本地的博客 `.md` 文件是**在构建时**被读进来的，不是运行时再去 `fetch`。靠的是 Vite 的 `import.meta.glob`（[src/lib/blog.ts](../../src/lib/blog.ts)）：

```typescript
const postModules = import.meta.glob('../content/blog/**/*.md', {
  eager: true,        // 构建时就把内容内联进 bundle，不产生额外网络请求
  import: 'default',
  query: '?raw',      // 以原始字符串形式拿到 .md 文本，而不是让 Vite 当模块解析
}) as Record<string, string>;
```

`eager: true` + `query: '?raw'` 的组合意思是：构建时，Vite 扫描 `content/blog` 下所有 `.md`，把每个文件的**原始文本**作为字符串内联进产物。运行时这些内容已经在 JS 里了，打开页面不需要再为每篇文章发一次请求。

> 这里有个能展开的「编译期 vs 运行时」判断：本地内容用编译期 glob（零请求、零加载态），而**后台数据库里的内容**走运行时 `fetch`（[Blog.tsx](../../src/pages/Blog.tsx) 里 `requestJson('/api/blog-posts')`）。两种来源各有取舍——静态内容编译期最省事，动态内容必须运行时拿。项目里两种都用了。

拿到原始字符串后，`blog.ts` 还做了一串纯数据处理：解析 frontmatter、从路径推断 `projectSlug`、估算阅读时长、按多重规则排序、按项目分组。其中**中文友好的阅读时长估算**值得一提：

```typescript
const estimateReadingTime = (body: string) => {
  const cjkChars   = body.match(/[一-鿿]/g)?.length ?? 0;        // 中文按字数
  const latinWords = body.replace(/[一-鿿]/g, ' ').trim().split(/\s+/).filter(Boolean).length; // 英文按词数
  const units   = cjkChars + latinWords;
  const minutes = Math.max(1, Math.ceil(units / 450));
  return `${minutes} min`;
};
```

直接按空格切词在中文里会失效（中文不用空格分词），所以这里把中文字符和拉丁词分开统计再相加。这种「别人不会注意、但你想到了」的细节，在面试里是加分项。

## 3. frontmatter 解析：一个小型词法处理

每篇 `.md` 开头是一段 YAML 风格的 frontmatter。我没引 YAML 库，而是手写了一个够用的解析器（`blog.ts` 的 `parseFrontmatter`）：

```typescript
const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

// 逐行 split 出 key: value；值支持三种类型：
//   [a, b, c] -> 数组    true/false -> 布尔    其余 -> 去引号字符串
```

要点：用一个正则切出 frontmatter 块，逐行找第一个 `:` 分隔 key/value（用 `indexOf(':')` 而不是 `split(':')`，避免值里本身带冒号被切坏），再按 `[...]`、`true/false`、普通字符串三种形态归一化。配合 `\r?\n` 兼容了 Windows/Unix 两种换行——这个项目在 Windows 上开发，换行符不处理好会踩坑。

## 4. 块级解析：手写的「行游标」状态机

核心在 [src/lib/markdown.tsx](../../src/lib/markdown.tsx) 的 `renderMarkdown`。它把 Markdown 文本按行扫描，用一个 `index` 游标向前推进，每次根据当前行的特征判断它是哪种块（标题/列表/表格/引用/代码/图片/段落），消费掉对应的若干行，产出一个 React 节点。本质是一个**手写的块级状态机**：

```mermaid
flowchart TD
  START["按行扫描, 游标 index"] --> EMPTY{"空行?"}
  EMPTY -- 是 --> SKIP["跳过, index++"]
  EMPTY -- 否 --> FENCE{"``` 代码围栏?"}
  FENCE -- mermaid --> MM["渲染 MermaidDiagram 组件"]
  FENCE -- 其他语言 --> PRE["渲染 pre/code 代码块"]
  FENCE -- 否 --> TABLE{"表格起始?<br/>表头 + 分隔行"}
  TABLE -- 是 --> TBL["消费整张表, 渲染 table"]
  TABLE -- 否 --> IMG{"图片?<br/>标准 或 Obsidian ![[ ]]"}
  IMG -- 是 --> FIG["渲染 img, 顺带吃掉下一行图注"]
  IMG -- 否 --> HEAD{"# 标题?"}
  HEAD -- 是 --> H["按 1-4 级渲染 h1-h4"]
  HEAD -- 否 --> QUOTE{"> 引用 / 列表?"}
  QUOTE -- 是 --> BLK["合并连续行, 渲染 blockquote/ul/ol"]
  QUOTE -- 否 --> P["收集到下一个块起始, 渲染段落"]
```

几个有意思的实现细节：

**(1) 表格识别要前看一行。** 判断「这是不是表格起始」不能只看当前行有没有 `|`，还要看**下一行是不是分隔行**（`|---|---|`）。所以 `isTableStart(lines, index)` 会同时检查 `lines[index]` 和 `lines[index+1]`，这是经典的 LL(1) 前看：

```typescript
const isTableStart = (lines: string[], index: number) => {
  if (index + 1 >= lines.length || !lines[index].includes('|')) return false;
  const headerCells    = splitTableRow(lines[index]);
  const separatorCells = splitTableRow(lines[index + 1]);
  return headerCells.length > 1
    && separatorCells.length >= headerCells.length
    && isTableSeparatorLine(lines[index + 1]);
};
```

**(2) 图片后面顺手吃掉图注。** 渲染图片时会向后看若干行，如果遇到 `图 1：xxx` 这种中文图注，就把图和图注一起包进 `<figure>/<figcaption>`，并把游标推到图注之后（`readImageCaption` 返回 `nextIndex`）。

**(3) Obsidian 图片语法。** 支持 `![[路径|60%]]`：`|` 后面可以写宽度（`60%` 或 `300x200`），由 `parseImageSize` 解析成 CSS 样式。这是 react-markdown 默认不认的语法，自研引擎里加它只是几行。

## 5. 行内解析：正则分词 + 递归

块级搞定后，每个块里的文本还要处理 `**加粗**`、`` `代码` ``、`[链接](url)` 这些行内标记。`renderInline` 用一个「全都要」的正则一次性把这些 token 切出来，逐个转成 React 节点，加粗内部还会**递归**调用自己（因为加粗里可能再嵌套代码/链接）：

```typescript
const pattern = /(\*\*[^*]+\*\*|(`+)([\s\S]*?)\2|\[[^\]]+\]\([^)]+\)|<[A-Z][A-Z0-9_-]*>)/g;
```

注意 `` (`+)([\s\S]*?)\2 `` 这一段用了**反向引用** `\2`：开头匹配几个反引号，结尾就要求同样数量的反引号闭合，这样 `` ``包含`单反引号`的代码`` `` 也能正确处理。这是手写解析器才会去抠的细节。

## 6. XSS 防护：链接和图片地址都要过一遍消毒

Markdown 里可以写任意 URL，如果不处理，`[点我](javascript:alert(1))` 就是一个 XSS 入口。所以所有链接和图片地址在渲染前都过一层白名单消毒（`markdown.tsx`）：

```typescript
const safeHref = (href: string) => {
  if (href.startsWith('/') || href.startsWith('#')) return href;  // 站内/锚点放行
  try {
    const url = new URL(href);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? href : '#'; // 只允许这三种协议
  } catch {
    return '#';  // 解析不了的，一律降级成 #
  }
};
```

图片地址还多一层：`toUploadImageSrc` 会把相对路径里的 `.`、`..` 段过滤掉、对每段做 `encodeURIComponent`，再拼成 `/uploads/...`——既防目录穿越，又能正确处理文件名里的空格和中文。

另外 Mermaid 初始化时显式设了 `securityLevel: 'strict'`（见下一节），不允许图表里执行脚本或点击事件。**前端这层消毒和后端上传那层校验（[第 6 章](06-文件上传与静态资源安全.md)）是纵深防御**——任何一层都不该假设另一层一定可靠。

## 7. Mermaid：动态导入 + 单例 + 渲染可取消

图表渲染是这个引擎里最「重」的部分，处理方式集中体现了几个前端工程意识（[src/components/MermaidDiagram.tsx](../../src/components/MermaidDiagram.tsx)）：

```typescript
let mermaidPromise: Promise<Mermaid> | undefined;

const getMermaid = () => {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(({ default: mermaid }) => {  // 动态导入：用到才下载
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', /* ...主题 */ });
      return mermaid;
    });
  }
  return mermaidPromise;  // 单例：全站只加载并初始化一次
};
```

- **动态 `import('mermaid')`**：mermaid 是个大依赖。用动态导入后，它被分到单独的 chunk，只有真正渲染图表的文章才会触发下载，不拖累首屏。
- **模块级 `mermaidPromise` 单例**：无论页面上有几个图表、切换多少次，mermaid 只被加载和 `initialize` 一次。
- **渲染可取消**：`useEffect` 里用一个 `cancelled` 标志，组件卸载或 `chart` 变化时把旧的异步渲染结果丢弃，避免「请求回来时组件已经没了」导致的 setState 警告和图表错位：

```typescript
useEffect(() => {
  let cancelled = false;
  const renderDiagram = async () => {
    const mermaid = await getMermaid();
    await mermaid.parse(chart);                    // 先 parse 校验语法
    const result = await mermaid.render(diagramId, chart);
    if (!cancelled) setSvg(result.svg);            // 只有没被取消才更新
  };
  renderDiagram().catch(/* 渲染失败时展示错误块 + 原始源码 */);
  return () => { cancelled = true; };              // 清理函数
}, [chart, reactId]);
```

`parse` 失败时不是白屏，而是渲染一个友好的错误框并把原始 mermaid 源码展示出来，方便我自己排查写错的图表。

## 8. 这个引擎的边界（要诚实）

自研引擎只覆盖我博客实际用到的语法子集，明确**不支持**的有：嵌套列表、列表项里的多段落、行内 HTML、脚注、任务列表、`*斜体*`（只做了 `**加粗**`）等。它不是 CommonMark 实现，也没打算是。

这是个有意识的取舍：**用最小的代码覆盖我真实需要的语法**，换来对渲染和样式的完全控制，以及一个能在面试里完整讲透的解析器。如果哪天博客语法需求复杂起来，更理性的选择是切回 `react-markdown` + 插件体系——我清楚那条路在哪，只是现在不需要。

## 9. 面试口述版

> 我的博客前端没有用 react-markdown，而是自己写了一个 Markdown 引擎。本地文章是用 Vite 的 `import.meta.glob` 在**构建期**以原始字符串加载进来的，运行时零请求；后台数据库里的文章则走运行时 fetch——两种来源对应两种取舍。
>
> 渲染分两层：块级是一个手写的「行游标」状态机，逐行判断是标题、列表、表格、代码块还是图片，其中表格识别要前看一行分隔符，图片会顺手吃掉中文图注；行内用一个正则把加粗、代码、链接切出来，加粗内部还会递归处理。
>
> 工程上我重点处理了三件事：一是 XSS，所有链接和图片地址都过白名单协议消毒、相对路径过滤掉 `..`；二是 Mermaid 用动态 import + 模块级单例懒加载，只有带图表的文章才下载这个大依赖；三是渲染用 cancelled 标志做了可取消，避免异步竞态。我也清楚它只是个语法子集实现，不是完整 CommonMark。

## 10. 面试官可能追问的问题

**Q1：`import.meta.glob` 的 `eager` 和 `query: '?raw'` 分别是什么意思？**
`eager: true` 表示构建时就把匹配到的模块内容静态内联进产物，而不是生成一堆动态 import；`query: '?raw'` 让 Vite 把 `.md` 当成原始文本字符串返回，而不是当模块去解析。两个合起来就是：构建期把所有本地 Markdown 的原文打进 bundle，运行时直接拿字符串用，不发额外请求。

**Q2：你怎么防止 Markdown 里的 XSS？**
两个入口都堵了。链接走 `safeHref`：只放行站内路径、锚点和 `http/https/mailto` 协议，`javascript:` 这种直接降级成 `#`。图片走 `toUploadImageSrc`：过滤掉路径里的 `.`/`..`、对每段 encode。再加上 Mermaid 初始化时 `securityLevel: 'strict'`。这是纵深防御，不指望单点。

**Q3：手写解析器最容易出错的地方在哪？**
状态机的游标推进。每个分支必须正确地「消费」掉它处理的所有行并把 `index` 推到正确位置，少推一行会死循环或重复渲染，多推一行会吞掉内容。最绕的是带前看的块（表格要看下一行、图片要向后找图注），我用返回 `nextIndex` 的方式显式管理游标，而不是隐式 `index++`。

**Q4：Mermaid 为什么要单例 + 动态导入？不这样会怎样？**
不动态导入，mermaid 这个大依赖会被打进主包，拖慢所有页面的首屏，哪怕这篇文章根本没有图表。不做单例，每个图表组件都可能触发一次 `import` 和 `initialize`，重复初始化、浪费资源。用模块级 `mermaidPromise` 缓存住 Promise，全站只加载和初始化一次，后续都复用同一个实例。

**Q5：`cancelled` 标志解决的是什么问题？**
异步竞态。渲染图表是异步的，如果在它返回前组件卸载了，或者 `chart` 变了触发了新一轮渲染，旧的那次 `setSvg` 就会更新一个已经不存在或已过期的组件，轻则 React 警告，重则显示错位的图。`useEffect` 的清理函数把 `cancelled` 置 true，回调里 `if (!cancelled)` 才更新状态，等于把过期的结果丢弃。

**Q6：为什么不干脆用 react-markdown，省得维护？**
如果是纯标准 Markdown，我会用。但我有 Obsidian 图片语法、中文图注、mermaid 这些非标准需求，用现成库要写不少插件去 hook；而且我想完全控制渲染产物和 Tailwind 样式。对这个项目，自研的边际成本不高、可控性和可讲性都更好。当然代价是只支持语法子集——需求复杂起来我会切回成熟库。
