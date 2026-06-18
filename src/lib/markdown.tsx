import type { CSSProperties, ReactNode } from 'react';
import { MermaidDiagram } from '../components/MermaidDiagram';

type InlineToken = string | ReactNode;

const safeHref = (href: string) => {
  if (href.startsWith('/') || href.startsWith('#')) return href;

  try {
    const url = new URL(href);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? href : '#';
  } catch {
    return '#';
  }
};

const safeImageSrc = (src: string) => {
  if (src.startsWith('/')) return src;

  try {
    const url = new URL(src);
    return ['http:', 'https:'].includes(url.protocol) ? src : '#';
  } catch {
    return '#';
  }
};

const toUploadImageSrc = (target: string) => {
  const normalized = target.trim().replace(/\\/g, '/');

  if (normalized.startsWith('/') || /^https?:\/\//i.test(normalized)) {
    return safeImageSrc(normalized);
  }

  const safePath = normalized
    .split('/')
    .filter((segment) => segment && segment !== '.' && segment !== '..')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return safePath ? `/uploads/${safePath}` : '#';
};

const imageClassName = 'mx-auto w-full rounded-3xl border border-slate-100 object-cover shadow-sm';

const horizontalRulePattern = /^(-{3,}|\*{3,}|_{3,})$/;

const tableCellClassName = [
  'line-clamp-3 max-w-full break-words text-sm leading-6 text-slate-700',
  '[&_code]:inline-block [&_code]:max-w-full [&_code]:truncate [&_code]:align-bottom',
  '[&_code]:rounded-md [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.8em]',
].join(' ');

const getTableColumnWidth = (cellIndex: number, columnCount: number) => {
  if (columnCount >= 6) {
    return ['12%', '24%', '24%', '18%', '14%', '8%'][cellIndex] ?? `${100 / columnCount}%`;
  }

  if (columnCount === 5) {
    return ['16%', '28%', '24%', '18%', '14%'][cellIndex];
  }

  return `${100 / columnCount}%`;
};

const splitTableRow = (line: string) => {
  const trimmed = line.trim();
  const withoutLeadingPipe = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
  const withoutEdgePipes = withoutLeadingPipe.endsWith('|')
    ? withoutLeadingPipe.slice(0, -1)
    : withoutLeadingPipe;

  return withoutEdgePipes.split('|').map((cell) => cell.trim());
};

const isTableSeparatorLine = (line: string) => {
  const cells = splitTableRow(line);
  return cells.length > 1 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
};

const isTableStart = (lines: string[], index: number) => {
  if (index + 1 >= lines.length || !lines[index].includes('|')) return false;

  const headerCells = splitTableRow(lines[index]);
  const separatorCells = splitTableRow(lines[index + 1]);

  return headerCells.length > 1
    && separatorCells.length >= headerCells.length
    && isTableSeparatorLine(lines[index + 1]);
};

const parseImageSize = (value?: string) => {
  if (!value) return {};

  const trimmed = value.trim();
  if (/^\d+(?:\.\d+)?%$/.test(trimmed)) {
    return {
      style: {
        width: trimmed,
        maxWidth: '100%',
        height: 'auto',
      } satisfies CSSProperties,
    };
  }

  const match = trimmed.match(/^(\d+(?:\.\d+)?)(?:\s*(?:x|×)\s*(\d+(?:\.\d+)?))?(?:px)?$/i);
  if (!match) return { alt: trimmed };

  const width = Number(match[1]);
  const height = match[2] ? Number(match[2]) : undefined;
  const style: CSSProperties = {
    width,
    maxWidth: '100%',
    height: height ?? 'auto',
  };

  if (height) {
    style.objectFit = 'contain';
  }

  return { style };
};

const parseImageCaption = (line?: string) => {
  if (!line) return undefined;

  const trimmed = line.trim();
  const captionMatch = trimmed.match(/^\*{1,2}\s*(图\s*\d+\s*[：:].+?)\s*\*{1,2}$/);
  if (captionMatch) return captionMatch[1].trim();

  const plainCaptionMatch = trimmed.match(/^(图\s*\d+\s*[：:].+)$/);
  return plainCaptionMatch?.[1].trim();
};

const readImageCaption = (lines: string[], imageLineIndex: number) => {
  let captionIndex = imageLineIndex + 1;

  while (captionIndex < lines.length && !lines[captionIndex].trim()) {
    captionIndex += 1;
  }

  const caption = parseImageCaption(lines[captionIndex]);
  return caption ? { caption, nextIndex: captionIndex + 1 } : undefined;
};

const renderImageBlock = (
  key: string,
  src: string,
  alt: string,
  style: CSSProperties | undefined,
  caption: string | undefined
) => {
  const image = (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={imageClassName}
      style={style}
    />
  );

  if (!caption) {
    return (
      <img
        key={key}
        src={src}
        alt={alt}
        loading="lazy"
        className={imageClassName}
        style={style}
      />
    );
  }

  return (
    <figure key={key} className="space-y-3">
      {image}
      <figcaption className="text-center text-base font-black leading-7 text-slate-700">
        {renderInline(caption, `${key}-caption`)}
      </figcaption>
    </figure>
  );
};

const renderInline = (text: string, keyPrefix: string): InlineToken[] => {
  const tokens: InlineToken[] = [];
  const pattern = /(\*\*[^*]+\*\*|(`+)([\s\S]*?)\2|\[[^\]]+\]\([^)]+\)|<[A-Z][A-Z0-9_-]*>)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      tokens.push(text.slice(cursor, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${match.index}`;

    if (token.startsWith('**')) {
      tokens.push(<strong key={key} className="font-black text-slate-950">{renderInline(token.slice(2, -2), `${key}-strong`)}</strong>);
    } else if (token.startsWith('`')) {
      const codeMatch = token.match(/^(`+)([\s\S]*?)\1$/);

      tokens.push(
        <code key={key} className="whitespace-nowrap rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.88em] font-bold text-slate-900">
          {codeMatch?.[2] ?? token.replace(/^`+|`+$/g, '')}
        </code>
      );
    } else if (token.startsWith('<')) {
      tokens.push(
        <code key={key} className="whitespace-nowrap rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.88em] font-bold text-slate-900">
          {token}
        </code>
      );
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const href = safeHref(linkMatch[2]);
        const isExternal = href.startsWith('http');

        tokens.push(
          <a
            key={key}
            href={href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noreferrer' : undefined}
            className="font-bold text-slate-950 underline decoration-[#FFFF00] decoration-2 underline-offset-4 transition hover:text-[#854D0E]"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }

    cursor = pattern.lastIndex;
  }

  if (cursor < text.length) {
    tokens.push(text.slice(cursor));
  }

  return tokens;
};

export const renderInlineMarkdown = (text: string, keyPrefix = 'inline') => renderInline(text, keyPrefix);

const isBlockStart = (lines: string[], index: number) => {
  const line = lines[index].trim();

  return /^#{1,4}\s+/.test(line)
    || /^>\s?/.test(line)
    || /^[-*]\s+/.test(line)
    || /^\d+\.\s+/.test(line)
    || /^!\[[^\]]*\]\([^)]+\)/.test(line)
    || /^!\[\[[^\]]+\]\]/.test(line)
    || horizontalRulePattern.test(line)
    || isTableStart(lines, index)
    || /^```/.test(line);
};

export const renderMarkdown = (markdown: string) => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim().toLowerCase();
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }

      const code = codeLines.join('\n');

      if (language === 'mermaid') {
        blocks.push(<MermaidDiagram key={`mermaid-${index}`} chart={code} />);
      } else {
        blocks.push(
          <pre
            key={`code-${index}`}
            className="mx-auto w-fit max-w-full overflow-x-auto rounded-2xl border border-slate-300 border-l-[6px] border-l-[#FFFF00] bg-white px-6 py-5 text-[15px] leading-8 text-slate-950 shadow-[0_16px_38px_-30px_rgba(15,23,42,0.7)] md:text-base"
          >
            <code data-language={language || undefined} className="font-mono font-bold">{code}</code>
          </pre>
        );
      }

      index += 1;
      continue;
    }

    if (horizontalRulePattern.test(trimmed)) {
      blocks.push(<hr key={`hr-${index}`} className="my-8 border-0 border-t border-slate-200" />);
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      const headers = splitTableRow(lines[index]);
      const rows: string[][] = [];
      index += 2;

      while (index < lines.length && lines[index].trim() && lines[index].includes('|')) {
        const row = splitTableRow(lines[index]);
        rows.push(headers.map((_, cellIndex) => row[cellIndex] || ''));
        index += 1;
      }

      blocks.push(
        <div key={`table-${index}`} className="mx-auto w-full max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_-34px_rgba(15,23,42,0.55)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed border-separate border-spacing-0 text-left">
            <colgroup>
              {headers.map((header, headerIndex) => (
                <col key={`col-${header}-${headerIndex}`} style={{ width: getTableColumnWidth(headerIndex, headers.length) }} />
              ))}
            </colgroup>
            <thead className="border-b border-slate-200 bg-amber-50/80 text-slate-900">
              <tr>
                {headers.map((header, headerIndex) => (
                  <th key={`${header}-${headerIndex}`} className="border-b border-slate-200 px-4 py-3 text-sm font-black leading-5">
                    {renderInline(header, `table-${index}-head-${headerIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`} className="transition-colors odd:bg-white even:bg-slate-50/70 hover:bg-amber-50/60">
                  {row.map((cell, cellIndex) => (
                    <td key={`${rowIndex}-${cellIndex}`} className="border-b border-slate-100 px-4 py-3 align-top last:border-r-0">
                      <div className={tableCellClassName} title={cell}>
                        {renderInline(cell, `table-${index}-row-${rowIndex}-${cellIndex}`)}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      );
      continue;
    }

    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      const caption = readImageCaption(lines, index);

      blocks.push(renderImageBlock(
        `image-${index}`,
        toUploadImageSrc(imageMatch[2]),
        imageMatch[1],
        undefined,
        caption?.caption
      ));
      index = caption?.nextIndex ?? index + 1;
      continue;
    }

    const obsidianImageMatch = trimmed.match(/^!\[\[([^\]]+)\]\]$/);
    if (obsidianImageMatch) {
      const [rawTarget, rawAlt] = obsidianImageMatch[1].split('|');
      const target = rawTarget.trim();
      const imageSize = parseImageSize(rawAlt);
      const fallbackAlt = target.split('/').pop() || target;

      const caption = readImageCaption(lines, index);

      blocks.push(renderImageBlock(
        `obsidian-image-${index}`,
        toUploadImageSrc(target),
        (imageSize.alt || fallbackAlt).trim(),
        imageSize.style,
        caption?.caption
      ));
      index = caption?.nextIndex ?? index + 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = renderInline(headingMatch[2], `heading-${index}`);

      if (level === 1) {
        blocks.push(<h1 key={`h1-${index}`} className="pt-8 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{content}</h1>);
      } else if (level === 2) {
        blocks.push(<h2 key={`h2-${index}`} className="pt-7 text-2xl font-black tracking-tight text-slate-950">{content}</h2>);
      } else if (level === 3) {
        blocks.push(<h3 key={`h3-${index}`} className="pt-6 text-2xl font-black tracking-tight text-slate-900">{content}</h3>);
      } else {
        blocks.push(<h4 key={`h4-${index}`} className="pt-4 text-xl font-black tracking-tight text-slate-900">{content}</h4>);
      }

      index += 1;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }

      blocks.push(
        <blockquote key={`quote-${index}`} className="rounded-r-2xl border border-slate-300 border-l-[6px] border-l-[#FFFF00] bg-white px-6 py-5 text-lg font-medium leading-8 text-slate-700 shadow-[0_16px_38px_-32px_rgba(15,23,42,0.55)]">
          {renderInline(quoteLines.join(' '), `quote-${index}`)}
        </blockquote>
      );
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];

      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''));
        index += 1;
      }

      blocks.push(
        <ul key={`ul-${index}`} className="space-y-3 pl-6 text-lg leading-relaxed text-slate-700">
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`} className="list-disc marker:text-[#854D0E]">
              {renderInline(item, `ul-${index}-${itemIndex}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];

      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ''));
        index += 1;
      }

      blocks.push(
        <ol key={`ol-${index}`} className="space-y-3 pl-6 text-lg leading-relaxed text-slate-700">
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`} className="list-decimal marker:font-black marker:text-[#854D0E]">
              {renderInline(item, `ol-${index}-${itemIndex}`)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length && lines[index].trim() && !isBlockStart(lines, index)) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push(
      <p key={`p-${index}`} className="text-lg font-medium leading-9 text-slate-600">
        {renderInline(paragraphLines.join(' '), `p-${index}`)}
      </p>
    );
  }

  return blocks;
};
