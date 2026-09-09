import React, { useState } from 'react';
import { MaterialIcon } from './MaterialIcon';
import { sounds } from '../../audio/soundManager';

interface MarkdownViewerProps {
  content: string;
  accentColor?: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, accentColor = '#38bdf8' }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    sounds.playClick();
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to parse inline styles (bold, code, links, italic)
  const parseInline = (text: string): React.ReactNode[] => {
    // Split by links, bold, inline code, italic
    const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
    const parts = text.split(regex);

    return parts.map((part, idx) => {
      if (!part) return null;

      // Link: [text](url)
      if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
        const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (match) {
          const [, linkText, linkUrl] = match;
          return (
            <a
              key={idx}
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 underline underline-offset-2 transition inline-flex items-center gap-0.5"
            >
              <span>{linkText}</span>
              <MaterialIcon name="open_in_new" size={12} className="inline-block" />
            </a>
          );
        }
      }

      // Bold: **text**
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={idx} className="font-bold text-slate-100">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Inline code: `code`
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-800/80 border border-slate-700/60 font-mono text-[11px] text-sky-300 font-medium"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Italic: *text*
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <em key={idx} className="italic text-slate-300">
            {part.slice(1, -1)}
          </em>
        );
      }

      return <span key={idx}>{part}</span>;
    });
  };

  // Process markdown text into structured blocks
  const renderBlocks = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBuffer: string[] = [];
    let codeBlockIndex = 0;
    let tableBuffer: string[] = [];

    const flushCodeBlock = () => {
      if (codeBuffer.length > 0 || inCodeBlock) {
        const fullCode = codeBuffer.join('\n');
        const currentIndex = codeBlockIndex;
        elements.push(
          <div
            key={`code-${currentIndex}`}
            className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-[#090d16] shadow-lg shadow-black/40"
          >
            {/* Terminal Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs font-mono">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <span className="text-slate-400 font-medium ml-1">
                  {codeLanguage || 'terminal'}
                </span>
              </div>
              <button
                onClick={() => handleCopyCode(fullCode, currentIndex)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-sky-300 transition cursor-pointer px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50"
                title="Copiar código"
              >
                {copiedIndex === currentIndex ? (
                  <>
                    <MaterialIcon name="check" size={13} className="text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copiado!</span>
                  </>
                ) : (
                  <>
                    <MaterialIcon name="content_copy" size={13} />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Content */}
            <div className="p-4 overflow-x-auto font-mono text-xs leading-relaxed text-slate-200">
              <pre className="m-0">
                <code>
                  {codeBuffer.map((line, lIdx) => (
                    <div key={lIdx} className="table-row">
                      <span className="table-cell select-none text-slate-600 text-right pr-4 text-[11px]">
                        {lIdx + 1}
                      </span>
                      <span className="table-cell whitespace-pre">{line}</span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        );
        codeBuffer = [];
        codeLanguage = '';
        inCodeBlock = false;
        codeBlockIndex++;
      }
    };

    const flushTable = () => {
      if (tableBuffer.length > 0) {
        const rows = tableBuffer.map((row) =>
          row
            .split('|')
            .map((c) => c.trim())
            .filter((c, i, arr) => (i === 0 && c === '' ? false : i === arr.length - 1 && c === '' ? false : true))
        );

        if (rows.length >= 2) {
          const headers = rows[0];
          const dataRows = rows.slice(2); // Skip separator row

          elements.push(
            <div key={`table-${elements.length}`} className="my-4 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-800">
                    {headers.map((h, i) => (
                      <th key={i} className="p-3 font-semibold text-slate-200 uppercase tracking-wider font-mono text-[11px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-[#0c1017]/60">
                  {dataRows.map((r, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/30 transition">
                      {r.map((c, cIdx) => (
                        <td key={cIdx} className="p-3 text-slate-300">
                          {parseInline(c)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        tableBuffer = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code fence detection
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock();
        } else {
          flushTable();
          inCodeBlock = true;
          codeLanguage = line.trim().slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Table line
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        tableBuffer.push(line.trim());
        continue;
      } else if (tableBuffer.length > 0) {
        flushTable();
      }

      // Empty line
      if (!line.trim()) {
        continue;
      }

      // H1 Header
      if (line.startsWith('# ')) {
        const text = line.slice(2);
        elements.push(
          <div key={`h1-${i}`} className="mt-6 mb-4 pb-2 border-b border-slate-800">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
              <span style={{ color: accentColor }}>#</span>
              <span>{text}</span>
            </h1>
          </div>
        );
        continue;
      }

      // H2 Header
      if (line.startsWith('## ')) {
        const text = line.slice(3);
        elements.push(
          <div key={`h2-${i}`} className="mt-5 mb-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-200 flex items-center gap-2">
              <span className="text-sky-400 font-mono text-sm">##</span>
              <span>{text}</span>
            </h2>
          </div>
        );
        continue;
      }

      // H3 Header
      if (line.startsWith('### ')) {
        const text = line.slice(4);
        elements.push(
          <h3 key={`h3-${i}`} className="text-sm font-semibold text-sky-300 mt-4 mb-2 flex items-center gap-1.5 font-mono">
            <span>›</span>
            <span>{text}</span>
          </h3>
        );
        continue;
      }

      // Blockquote / Callout
      if (line.startsWith('> ')) {
        const text = line.slice(2);
        elements.push(
          <div
            key={`quote-${i}`}
            className="my-3 p-3.5 rounded-xl bg-sky-950/25 border-l-4 border-sky-400 border border-slate-800/80 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5"
          >
            <MaterialIcon name="info" size={16} className="text-sky-400 shrink-0 mt-0.5" />
            <div className="flex-1">{parseInline(text)}</div>
          </div>
        );
        continue;
      }

      // Checklist item: - [x] or - [ ]
      if (line.trim().startsWith('- [x] ') || line.trim().startsWith('- [ ] ')) {
        const checked = line.trim().startsWith('- [x] ');
        const text = line.trim().slice(6);
        elements.push(
          <div key={`check-${i}`} className="flex items-center gap-2.5 py-1 text-xs text-slate-300">
            <div
              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                checked
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : 'bg-slate-800/60 border-slate-700 text-slate-500'
              }`}
            >
              {checked && <MaterialIcon name="check" size={12} />}
            </div>
            <span className={checked ? 'text-slate-200' : 'text-slate-400'}>{parseInline(text)}</span>
          </div>
        );
        continue;
      }

      // Bullet list item
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const text = line.trim().slice(2);
        elements.push(
          <div key={`bullet-${i}`} className="flex items-start gap-2 py-0.5 text-xs text-slate-300 leading-relaxed">
            <span className="text-sky-400 mt-1 text-[8px]">•</span>
            <span className="flex-1">{parseInline(text)}</span>
          </div>
        );
        continue;
      }

      // Horizontal Rule
      if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={`hr-${i}`} className="my-5 border-t border-slate-800" />);
        continue;
      }

      // Normal paragraph
      elements.push(
        <p key={`p-${i}`} className="text-xs text-slate-300 leading-relaxed my-2">
          {parseInline(line)}
        </p>
      );
    }

    flushTable();
    flushCodeBlock();

    return elements;
  };

  return <div className="space-y-1 font-sans">{renderBlocks()}</div>;
};
