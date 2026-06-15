import { useEffect, useId, useRef, useState } from 'react';

type Mermaid = typeof import('mermaid')['default'];

let mermaidPromise: Promise<Mermaid> | undefined;

const getMermaid = () => {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        themeVariables: {
          background: '#ffffff',
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          lineColor: '#854D0E',
          primaryColor: '#ffffff',
          primaryBorderColor: '#e2e8f0',
          primaryTextColor: '#020617',
          secondaryColor: '#f8fafc',
          tertiaryColor: '#FFFF00',
        },
      });

      return mermaid;
    });
  }

  return mermaidPromise;
};

type MermaidDiagramProps = {
  chart: string;
};

const cleanId = (id: string) => id.replace(/[^A-Za-z0-9_-]/g, '');

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return String(error);
};

export const MermaidDiagram = ({ chart }: MermaidDiagramProps) => {
  const reactId = useId();
  const renderCount = useRef(0);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    renderCount.current += 1;
    const diagramId = `mermaid-${cleanId(reactId)}-${renderCount.current}`;

    setSvg('');
    setError('');

    const renderDiagram = async () => {
      try {
        const mermaid = await getMermaid();
        await mermaid.parse(chart);
        const result = await mermaid.render(diagramId, chart);

        if (!cancelled) {
          setSvg(result.svg);
        }
      } catch (renderError) {
        if (!cancelled) {
          setError(getErrorMessage(renderError));
        }
      }
    };

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, reactId]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
        <p className="mb-3 text-sm font-black text-red-700">Mermaid 图表解析失败</p>
        <p className="mb-4 whitespace-pre-wrap text-sm font-medium leading-6 text-red-700">{error}</p>
        <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-relaxed text-slate-100">
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      {svg ? (
        <div
          className="w-full [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:w-[70%] [&_svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="flex min-h-[180px] items-center justify-center text-sm font-bold text-slate-400">
          正在渲染 Mermaid 图表...
        </div>
      )}
    </div>
  );
};
