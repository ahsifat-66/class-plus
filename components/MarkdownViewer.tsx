"use client";

import React from "react";
import DOMPurify from "isomorphic-dompurify";

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export default function MarkdownViewer({
  content,
  className = "",
}: MarkdownViewerProps) {
  const lines = content.split("\n");

  const renderedElements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      renderedElements.push(
        <ul key={key} className="my-2 list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 pl-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-xs sm:text-sm">
              <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatInline(item)) }} />
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const flushCodeBlock = (key: string) => {
    if (codeBlockContent.length > 0) {
      renderedElements.push(
        <pre
          key={key}
          className="my-3 overflow-x-auto rounded-xl bg-slate-900 dark:bg-black p-3.5 text-xs font-mono text-emerald-400 dark:text-emerald-300 shadow-inner leading-relaxed border border-slate-800"
        >
          {codeBlockContent.join("\n")}
        </pre>
      );
      codeBlockContent = [];
    }
  };

  const formatInline = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold text-slate-900 dark:text-slate-100'>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code class='bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-mono text-[11px] border border-slate-200 dark:border-slate-700'>$1</code>");
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        flushCodeBlock(`code-${index}`);
      } else {
        flushList(`list-before-code-${index}`);
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Horizontal divider
    if (trimmed === "---" || trimmed === "***") {
      flushList(`list-before-hr-${index}`);
      renderedElements.push(
        <hr key={`hr-${index}`} className="my-4 border-slate-200 dark:border-slate-800" />
      );
      return;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      flushList(`list-before-h3-${index}`);
      renderedElements.push(
        <h4
          key={`h3-${index}`}
          className="mt-3 mb-1 text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatInline(trimmed.slice(4))) }}
        />
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushList(`list-before-h2-${index}`);
      renderedElements.push(
        <h3
          key={`h2-${index}`}
          className="mt-4 mb-1.5 text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatInline(trimmed.slice(3))) }}
        />
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      flushList(`list-before-h1-${index}`);
      renderedElements.push(
        <h2
          key={`h1-${index}`}
          className="mt-4 mb-2 text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatInline(trimmed.slice(2))) }}
        />
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushList(`list-before-quote-${index}`);
      renderedElements.push(
        <blockquote
          key={`quote-${index}`}
          className="my-2 border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 rounded-r-xl"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatInline(trimmed.slice(2))) }}
        />
      );
      return;
    }

    // Bullet items
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2));
      return;
    }

    // Empty lines
    if (trimmed === "") {
      flushList(`list-before-empty-${index}`);
      return;
    }

    // Regular paragraph
    flushList(`list-before-p-${index}`);
    renderedElements.push(
      <p
        key={`p-${index}`}
        className="my-1 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatInline(trimmed)) }}
      />
    );
  });

  flushList("list-final");
  flushCodeBlock("code-final");

  return <div className={`space-y-1 ${className}`}>{renderedElements}</div>;
}
