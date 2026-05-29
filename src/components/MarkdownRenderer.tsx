import React from 'react';

/**
 * Custom ultra-safe lightweight Markdown parser for React 19 compatibility.
 * Safely converts typical headings, bold highlights, reviews, bullet lists, and paragraphs.
 */
export function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split('\n');

  return (
    <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty line
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header ###
        if (trimmed.startsWith('###')) {
          const text = trimmed.replace(/^###\s*/, '');
          return (
            <h4 key={idx} className="text-base font-bold text-indigo-800 pt-2 tracking-tight">
              {parseBoldText(text)}
            </h4>
          );
        }

        // Header ##
        if (trimmed.startsWith('##')) {
          const text = trimmed.replace(/^##\s*/, '');
          return (
            <h3 key={idx} className="text-lg font-bold text-slate-800 pt-3 border-b border-slate-100 pb-1 tracking-tight">
              {parseBoldText(text)}
            </h3>
          );
        }

        // Header #
        if (trimmed.startsWith('#')) {
          const text = trimmed.replace(/^#\s*/, '');
          return (
            <h2 key={idx} className="text-xl font-bold text-slate-950 pt-4 border-b border-slate-100 pb-1 tracking-tight">
              {parseBoldText(text)}
            </h2>
          );
        }

        // Bullet point * or -
        if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
          const text = trimmed.replace(/^[*+-]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-3">
              <span className="text-indigo-500 font-bold mt-0.5">•</span>
              <p className="flex-1 text-slate-700">{parseBoldText(text)}</p>
            </div>
          );
        }

        // Standard line / Paragraph
        return (
          <p key={idx} className="text-slate-600 pl-1">
            {parseBoldText(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

// Inline helper to render "**text**" as bold markup safely
function parseBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldVal = part.slice(2, -2);
      return (
        <strong key={i} className="font-extrabold text-slate-900 bg-indigo-50/60 px-1 rounded">
          {boldVal}
        </strong>
      );
    }
    return part;
  });
}
