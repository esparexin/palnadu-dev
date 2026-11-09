import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function renderInline(text: string): React.ReactNode {
  const clean = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/(?<=\s)\*(?=\s)/g, '-');

  const regex = /(\[[^\]]+\]\([^)]+\)|`[^`]+`)/g;
  const parts = clean.split(regex);
  if (parts.length === 1) return clean;

  return parts.map((part, idx) => {
    if (part.startsWith('[') && part.includes('](')) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        return (
          <Link
            key={idx}
            href={match[2]}
            className="text-palnadu-blue underline underline-offset-2 font-semibold hover:text-palnadu-dark-hover transition-colors"
          >
            {match[1]}
          </Link>
        );
      }
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="px-1.5 py-0.5 rounded bg-palnadu-off-white text-xs font-mono text-palnadu-blue font-semibold">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function isOptimizableImageUrl(url?: string | null): boolean {
  if (!url) return false;
  if (url.startsWith('/')) return true;
  try {
    const parsed = new URL(url, 'https://palnadu.dev');
    const host = parsed.hostname;
    return (
      host === 'res.cloudinary.com' ||
      host === 'cdn.21st.dev' ||
      host === 'images.unsplash.com' ||
      host === 'ui.aceternity.com' ||
      host === 'palnadu.dev' ||
      host.endsWith('.palnadu.dev')
    );
  } catch {
    return false;
  }
}

interface ArticleContentProps {
  paragraphs: string[];
  postTitle: string;
}

export function ArticleContent({ paragraphs, postTitle }: ArticleContentProps) {
  return (
    <div className="py-8 space-y-6 text-sm sm:text-base text-palnadu-body leading-relaxed">
      {paragraphs.map((para: string, idx: number) => {
        const trimmed = para.trim();

        if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
          return <hr key={idx} className="my-8 border-palnadu-border/80" />;
        }

        const imageMatch = trimmed.match(/^!\[([^\]]*)\]\((https?:\/\/[^)]+)\)(?:[\s\n]*(?:\*?Caption:\s*([^*\n]+)\*?))?/);
        if (imageMatch) {
          const [, alt, url, rawCaption] = imageMatch;
          const caption = rawCaption ? rawCaption.replace(/\*/g, '').trim() : '';
          return (
            <figure key={idx} className="my-8 rounded-xl overflow-hidden border border-palnadu-border shadow-sm bg-palnadu-off-white">
              <div className="relative aspect-[16/9] max-h-[500px] w-full">
                <Image
                  src={url}
                  alt={alt || postTitle}
                  fill
                  sizes="(max-width: 1024px) 100vw, 800px"
                  className="object-cover"
                  unoptimized={!isOptimizableImageUrl(url)}
                />
              </div>
              {caption && (
                <figcaption className="px-4 py-2.5 text-center text-xs text-palnadu-secondary bg-palnadu-off-white/80 border-t border-palnadu-border/60">
                  Caption: {caption}
                </figcaption>
              )}
            </figure>
          );
        }

        const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length >= 2 && lines.every((l) => l.startsWith('|') && l.endsWith('|'))) {
          const parseRow = (line: string) =>
            line
              .slice(1, -1)
              .split('|')
              .map((cell) => cell.trim());

          const headerCells = parseRow(lines[0]);
          const bodyRows = lines.slice(1).filter((l) => !l.includes('---')).map(parseRow);

          return (
            <div key={idx} className="my-6 overflow-x-auto rounded-xl border border-palnadu-border shadow-sm">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead className="bg-palnadu-off-white text-palnadu-dark border-b border-palnadu-border font-bold">
                  <tr>
                    {headerCells.map((h, i) => (
                      <th key={i} className="p-3 font-bold">
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-palnadu-border/60 bg-white">
                  {bodyRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-palnadu-light-blue/20">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-3 text-palnadu-body">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (trimmed.startsWith('# ')) {
          return (
            <h2 key={idx} className="text-2xl sm:text-3xl font-bold text-palnadu-dark pt-6 first:pt-0">
              {renderInline(trimmed.replace(/^#\s+/, ''))}
            </h2>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-xl sm:text-2xl font-bold text-palnadu-dark pt-5">
              {renderInline(trimmed.replace(/^##\s+/, ''))}
            </h3>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-lg sm:text-xl font-bold text-palnadu-dark pt-4">
              {renderInline(trimmed.replace(/^###\s+/, ''))}
            </h4>
          );
        }

        if (trimmed.startsWith('```')) {
          const codeContent = trimmed.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
          return (
            <pre key={idx} className="my-6 p-4 rounded-xl bg-palnadu-dark text-palnadu-off-white text-xs font-mono overflow-x-auto">
              <code>{codeContent}</code>
            </pre>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
          const items = trimmed.split('\n').filter(Boolean);
          return (
            <ul key={idx} className="space-y-2 my-4 pl-2">
              {items.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5 text-sm sm:text-base text-palnadu-body">
                  <span className="text-palnadu-blue font-bold shrink-0 mt-0.5">▪</span>
                  <span>{renderInline(item.replace(/^([-*]|\d+\.)\s+/, ''))}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={idx} className="leading-relaxed">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
