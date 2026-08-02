"use client";

import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A tiny, safe Markdown renderer for short notes. It never uses
 * dangerouslySetInnerHTML — inline spans are built as React nodes — so user
 * text can't inject markup. Supports headings, bullet/number/checkbox lists,
 * quotes, code, and inline bold / italic / code / links. Deliberately minimal.
 */
export function Markdown({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: ReactNode[] } | null = null;

  const flushList = (key: string) => {
    if (!list) return;
    const items = list.items;
    blocks.push(
      list.ordered ? (
        <ol key={key} className="ml-4 list-decimal space-y-0.5">
          {items}
        </ol>
      ) : (
        <ul key={key} className="ml-1 space-y-0.5">
          {items}
        </ul>
      ),
    );
    list = null;
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    const key = `l${i}`;

    // Checkbox item
    const check = /^[-*]\s+\[([ xX])\]\s+(.*)$/.exec(line);
    if (check) {
      if (list && list.ordered) flushList(`${key}-pre`);
      if (!list) list = { ordered: false, items: [] };
      const done = check[1].toLowerCase() === "x";
      list.items.push(
        <li key={key} className="flex items-start gap-2">
          <span
            className={cn(
              "mt-[3px] flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border text-[9px] leading-none",
              done ? "border-current bg-current/20" : "border-current/40",
            )}
          >
            {done ? "✓" : ""}
          </span>
          <span className={cn(done && "line-through opacity-60")}>
            {inline(check[2])}
          </span>
        </li>,
      );
      return;
    }

    // Bullet item
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      if (list && list.ordered) flushList(`${key}-pre`);
      if (!list) list = { ordered: false, items: [] };
      list.items.push(
        <li key={key} className="flex items-start gap-2">
          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-current opacity-70" />
          <span>{inline(bullet[1])}</span>
        </li>,
      );
      return;
    }

    // Ordered item
    const ordered = /^(\d+)\.\s+(.*)$/.exec(line);
    if (ordered) {
      if (list && !list.ordered) flushList(`${key}-pre`);
      if (!list) list = { ordered: true, items: [] };
      list.items.push(<li key={key}>{inline(ordered[2])}</li>);
      return;
    }

    flushList(`${key}-flush`);

    if (line === "") return;

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const size = level === 1 ? "text-base font-semibold" : level === 2 ? "text-sm font-semibold" : "text-sm font-medium";
      blocks.push(
        <p key={key} className={cn(size, "text-current")}>
          {inline(heading[2])}
        </p>,
      );
      return;
    }

    if (line.startsWith("> ")) {
      blocks.push(
        <p key={key} className="border-l-2 border-current/30 pl-2 italic opacity-80">
          {inline(line.slice(2))}
        </p>,
      );
      return;
    }

    blocks.push(<p key={key}>{inline(line)}</p>);
  });

  flushList("end");

  return (
    <div className={cn("space-y-1 whitespace-pre-wrap break-words text-current", className)}>
      {blocks}
    </div>
  );
}

/** Render inline emphasis, code and links as React nodes. */
function inline(text: string): ReactNode {
  // Tokenize on the supported inline patterns, preserving order.
  const pattern =
    /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const out: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) out.push(<Fragment key={idx++}>{text.slice(last, match.index)}</Fragment>);
    const tok = match[0];
    if ((tok.startsWith("**") && tok.endsWith("**")) || (tok.startsWith("__") && tok.endsWith("__"))) {
      out.push(<strong key={idx++}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("`") && tok.endsWith("`")) {
      out.push(
        <code key={idx++} className="rounded bg-current/10 px-1 py-0.5 font-mono text-[0.85em]">
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.startsWith("[")) {
      const m = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok);
      if (m) {
        out.push(
          <a
            key={idx++}
            href={m[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            {m[1]}
          </a>,
        );
      }
    } else {
      out.push(<em key={idx++}>{tok.slice(1, -1)}</em>);
    }
    last = match.index + tok.length;
  }
  if (last < text.length) out.push(<Fragment key={idx++}>{text.slice(last)}</Fragment>);
  return out;
}
