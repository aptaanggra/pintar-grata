import React from 'react';
import { JournalReference } from '../types';

interface MarkdownRendererProps {
  content: string;
  journals?: JournalReference[];
}

/**
 * Normalizes common AI markdown output anomalies (mismatched asterisks, orphaned bullet dividers, unclosed bold tags)
 */
function normalizeMarkdown(content: string): string {
  if (!content) return '';

  return content
    .replace(/\r\n/g, '\n')
    // 1. Fix bullet dividers like "* --", "- ---", "* ***", "* --" -> "---"
    .replace(/^[*+-]\s+(\-{2,4}|\*{3,4}|\_{3,4})\s*$/gm, '---')
    // 2. Fix mismatched bold at start of list items: "* *Text**" -> "* **Text**"
    .replace(/^([*+-]\s+)\*([^\*\n]+)\*\*/gm, '$1**$2**')
    // 3. Fix mismatched bold at start of list items: "* **Text*" -> "* **Text**"
    .replace(/^([*+-]\s+)\*\*([^\*\n]+)\*/gm, '$1**$2**')
    // 4. Fix missing closing bold on list headers: "* **Text:" -> "* **Text:**"
    .replace(/^([*+-]\s+)\*\*([^\*\:\n]+)\:(?!\*)/gm, '$1**$2:**')
    // 5. Fix single asterisk bold attempts at start of list item: "* *Text:" -> "* **Text:**"
    .replace(/^([*+-]\s+)\*([^\*\:\n]+)\:/gm, '$1**$2:**')
    // 6. Fix standalone "*Text**" anywhere -> "**Text**"
    .replace(/(^|\s)\*([a-zA-Z0-9_\-A-Z\(\)\?\:\s]+)\*\*/g, '$1**$2**')
    // 7. Fix standalone "**Text*" anywhere -> "**Text**"
    .replace(/(^|\s)\*\*([a-zA-Z0-9_\-A-Z\(\)\?\:\s]+)\*/g, '$1**$2**');
}

/**
 * Custom ultra-safe, highly styled Markdown parser for AI responses, assignment reviews, and tutoring.
 * Features clean heading hierarchy, bullet & numbered lists, bold/italic text, inline code, and horizontal dividers.
 */
export function MarkdownRenderer({ content, journals }: MarkdownRendererProps) {
  if (!content) return null;

  const normalizedContent = normalizeMarkdown(content);
  const lines = normalizedContent.split('\n');

  return (
    <div className="space-y-2.5 text-xs sm:text-[13px] text-slate-700 leading-relaxed font-sans">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // 1. Empty line
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // 2. Horizontal Rules / Dividers (e.g. ---, --, ***, ___ )
        if (/^(\-{2,4}|\*{3,4}|\_{3,4})$/.test(trimmed)) {
          return <hr key={idx} className="my-3.5 border-t border-slate-200/80" />;
        }

        // 3. Header # (H1)
        if (trimmed.startsWith('# ')) {
          const text = trimmed.replace(/^#\s+/, '');
          return (
            <h2 key={idx} className="text-base sm:text-lg font-extrabold text-indigo-950 pt-3 pb-1 border-b border-indigo-100/70 tracking-tight flex items-center gap-2 font-display">
              {parseFormattedText(text, journals)}
            </h2>
          );
        }

        // 4. Header ## (H2)
        if (trimmed.startsWith('## ')) {
          const text = trimmed.replace(/^##\s+/, '');
          return (
            <h3 key={idx} className="text-sm sm:text-base font-extrabold text-slate-900 pt-2.5 pb-0.5 tracking-tight font-display">
              {parseFormattedText(text, journals)}
            </h3>
          );
        }

        // 5. Header ### (H3) or ####
        if (trimmed.startsWith('###')) {
          const text = trimmed.replace(/^#{3,6}\s+/, '');
          return (
            <h4 key={idx} className="text-xs sm:text-sm font-extrabold text-indigo-900 pt-2 tracking-tight font-display">
              {parseFormattedText(text, journals)}
            </h4>
          );
        }

        // 6. Numbered List Item (e.g. "1. ", "2. ")
        const numMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (numMatch) {
          const num = numMatch[1];
          const text = numMatch[2];
          return (
            <div key={idx} className="flex items-start gap-2.5 my-1 pl-1">
              <span className="flex items-center justify-center min-w-5 h-5 rounded-md bg-indigo-100/80 text-indigo-800 text-[10px] font-extrabold shrink-0 mt-0.5 font-mono shadow-xs">
                {num}
              </span>
              <div className="flex-1 text-slate-700 leading-relaxed font-sans">
                {parseFormattedText(text, journals)}
              </div>
            </div>
          );
        }

        // 7. Bullet List Item (e.g. "* ", "- ", "+ ")
        const bulletMatch = trimmed.match(/^[*+-]\s+(.+)$/);
        if (bulletMatch) {
          const text = bulletMatch[1];
          return (
            <div key={idx} className="flex items-start gap-2.5 my-1 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2 shadow-xs" />
              <div className="flex-1 text-slate-700 leading-relaxed font-sans">
                {parseFormattedText(text, journals)}
              </div>
            </div>
          );
        }

        // 8. Standard Paragraph
        return (
          <p key={idx} className="text-slate-700 leading-relaxed font-sans">
            {parseFormattedText(trimmed, journals)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Helper parser to convert markdown inline elements (**bold**, *italic*, `code`, [1] citations) into React JSX
 */
function parseFormattedText(text: string, journals?: JournalReference[]): React.ReactNode[] {
  if (!text) return [];

  // Match bold (**text**), italic (*text*), inline code (`code`), and citation tags ([1], [2])
  const tokenRegex = /(\*\*.*?\*\*|__.*?__|`.*?`|\[\d+\]|\*.*?\*|_.*?_)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (!part) return null;

    // Citations e.g. [1], [2]
    const citationMatch = part.match(/^\[(\d+)\]$/);
    if (citationMatch) {
      const num = parseInt(citationMatch[1], 10);
      const journalIdx = num - 1;
      if (journals && journals[journalIdx]) {
        const ref = journals[journalIdx];
        return (
          <a
            key={i}
            href={ref.url.startsWith('http') ? ref.url : `https://scholar.google.com/scholar?q=${encodeURIComponent(ref.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-extrabold px-1.5 py-0.5 mx-0.5 rounded text-[9px] select-none align-baseline border border-solid border-indigo-300/50 no-underline cursor-pointer transition-colors shadow-xs"
            title={`[Ref ${num}] ${ref.title} (${ref.author}, ${ref.year})`}
          >
            [{num}]
          </a>
        );
      }
      return (
        <span key={i} className="text-indigo-600 font-bold font-mono text-[10px]">
          [{num}]
        </span>
      );
    }

    // Bold: **text** or __text__
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      const content = part.slice(2, -2).replace(/^\*+|\*+$/g, '');
      return (
        <strong key={i} className="font-extrabold text-slate-900 font-sans">
          {content}
        </strong>
      );
    }

    // Inline Code: `text`
    if (part.startsWith('`') && part.endsWith('`')) {
      const content = part.slice(1, -1);
      return (
        <code key={i} className="font-mono text-[11px] bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded border border-slate-200/80 font-bold">
          {content}
        </code>
      );
    }

    // Italic: *text* or _text_
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      if (part.length > 2) {
        const content = part.slice(1, -1).replace(/^\*+|\*+$/g, '');
        return (
          <em key={i} className="italic text-slate-800 font-sans">
            {content}
          </em>
        );
      }
    }

    // For plain text fragments, clean up any orphan trailing/leading asterisks
    const cleanedText = part.replace(/^(\*+)(?=\w)/, '').replace(/(?<=\w)(\*+)$/, '');

    return cleanedText;
  });
}
