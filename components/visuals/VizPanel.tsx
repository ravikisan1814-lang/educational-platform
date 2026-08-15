"use client";

import { useState, type ReactNode } from "react";

interface VizPanelProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  testId?: string;
}

/**
 * Collapsible card used to gate heavy visualization payloads (Plotly,
 * three.js, JSON viewers). The children are only mounted once the panel is
 * opened, so deep-linked chunks (next/dynamic, ssr:false) are fetched on
 * demand instead of on first paint.
 */
export default function VizPanel({
  title,
  children,
  defaultOpen = false,
  testId,
}: VizPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="viz-panel" data-testid={testId}>
      <button
        type="button"
        className="viz-panel-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="viz-panel-caret">{open ? "▾" : "▸"}</span>
        {title}
      </button>
      {open && <div className="viz-panel-body">{children}</div>}
    </div>
  );
}