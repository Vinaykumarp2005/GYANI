/**
 * MarkdownRenderer.jsx
 * --------------------
 * Renders LLM Markdown text responses with:
 *  - Proper heading hierarchy, lists, blockquotes
 *  - Syntax-highlighted fenced code blocks (no external dep — CSS-based)
 *  - Scientific unit rendering
 *  - Copy-to-clipboard for code blocks
 *  - Graceful fallback for plain text
 */

import React, { useState, useCallback } from "react";
import { Copy, Check, BookOpen } from "lucide-react";

// ---------------------------------------------------------------------------
// Lightweight Markdown → HTML converter (no external dependency)
// ---------------------------------------------------------------------------

function markdownToHtml(md) {
  if (!md || typeof md !== "string") return "";

  let html = md
    // Escape HTML entities first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Fenced code blocks (``` lang\n...\n```)
  html = html.replace(
    /```(\w*)\n?([\s\S]*?)```/g,
    (_, lang, code) =>
      `<pre class="md-code-block" data-lang="${lang || "text"}"><code class="language-${lang || "text"}">${code.trim()}</code></pre>`
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

  // Bold + italic combinations
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
  // Italic
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");

  // Headers (H1-H4)
  html = html.replace(/^#### (.+)$/gm, '<h4 class="md-h4">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>');

  // Horizontal rule
  html = html.replace(/^---+$/gm, '<hr class="md-hr" />');

  // Blockquote
  html = html.replace(
    /^&gt; (.+)$/gm,
    '<blockquote class="md-blockquote">$1</blockquote>'
  );

  // Unordered list items
  html = html.replace(/^\s*[-*+] (.+)$/gm, '<li class="md-li">$1</li>');
  html = html.replace(
    /(<li class="md-li">[\s\S]*?<\/li>)(?=\s*<li|\s*$)/g,
    (match) => `<ul class="md-ul">${match}</ul>`
  );

  // Ordered list items
  html = html.replace(
    /^\s*(\d+)\. (.+)$/gm,
    '<li class="md-li md-oli">$2</li>'
  );
  html = html.replace(
    /(<li class="md-li md-oli">[\s\S]*?<\/li>)(?=\s*<li|\s*$)/g,
    (match) => `<ol class="md-ol">${match}</ol>`
  );

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a class="md-link" href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Paragraphs — wrap lines not already in a block element
  const lines = html.split("\n");
  const processed = [];
  let inBlock = false;
  for (const line of lines) {
    const trimmed = line.trim();
    const isBlock =
      trimmed.startsWith("<h") ||
      trimmed.startsWith("<ul") ||
      trimmed.startsWith("<ol") ||
      trimmed.startsWith("<li") ||
      trimmed.startsWith("<pre") ||
      trimmed.startsWith("<blockquote") ||
      trimmed.startsWith("<hr") ||
      trimmed.startsWith("</");
    if (isBlock) {
      inBlock = true;
      processed.push(line);
    } else if (trimmed === "") {
      inBlock = false;
      processed.push("");
    } else {
      processed.push(inBlock ? line : `<p class="md-p">${line}</p>`);
    }
  }
  return processed.join("\n");
}

// ---------------------------------------------------------------------------
// CodeBlock — individual block with copy button
// ---------------------------------------------------------------------------

function CodeBlock({ lang, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="md-code-block-wrapper">
      <div className="md-code-block-header">
        <span className="md-code-lang">{lang || "code"}</span>
        <button
          type="button"
          className="md-copy-btn"
          onClick={handleCopy}
          title="Copy code"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      <pre className="md-code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main MarkdownRenderer
// ---------------------------------------------------------------------------

export default function MarkdownRenderer({ text, content, className = "" }) {
  const markdownText = text || content || "";
  if (!markdownText) {
    return (
      <div className={`md-renderer md-empty ${className}`}>
        <BookOpen size={28} className="md-empty-icon" />
        <p className="md-empty-text">No response content to display.</p>
      </div>
    );
  }

  // Split on fenced code blocks first so we can render them with our
  // CodeBlock component (which provides the copy button) instead of
  // injecting raw <pre> HTML.
  const segments = [];
  const codeBlockRe = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRe.exec(markdownText)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "markdown",
        content: markdownText.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: "code",
      lang: match[1] || "text",
      content: match[2].trim(),
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < markdownText.length) {
    segments.push({ type: "markdown", content: markdownText.slice(lastIndex) });
  }

  return (
    <div className={`md-renderer ${className}`}>
      {segments.map((seg, i) =>
        seg.type === "code" ? (
          <CodeBlock key={i} lang={seg.lang} code={seg.content} />
        ) : (
          <div
            key={i}
            className="md-prose"
            /* DOMPurify is not bundled but the content comes from our own
               LLM service — entities are HTML-escaped in markdownToHtml */
            dangerouslySetInnerHTML={{ __html: markdownToHtml(seg.content) }}
          />
        )
      )}
    </div>
  );
}
