"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import VizPanel from "./VizPanel";

const ReactJsonView = dynamic(
  () => import("@microlink/react-json-view"),
  {
    ssr: false,
    loading: () => <div className="viz-loading">Loading JSON viewer…</div>,
  }
);

interface JsonInspectorProps {
  data: unknown;
  title?: string;
  collapsed?: number;
}

/**
 * Interactive JSON tree viewer powered by the maintained
 * @microlink/react-json-view fork (MIT). Loaded client-side only — the chunk
 * is fetched when the panel is opened, never on first paint.
 *
 * Security: the caller decides what to pass. In this app the API routes
 * already strip tier-gated payloads, so locked notes can never leak through
 * this viewer (defense in depth on the DB side).
 */
export default function JsonInspector({
  data,
  title = "Raw JSON",
  collapsed = 2,
}: JsonInspectorProps) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setDark(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <VizPanel title={title}>
      <div className="json-inspector">
        <ReactJsonView
          src={(data ?? {}) as object}
          theme={dark ? "monokai" : "rjv-default"}
          collapsed={collapsed}
          iconStyle="triangle"
          indentWidth={2}
          displayDataTypes={false}
          displayObjectSize
          enableClipboard
          style={{
            background: "transparent",
            fontSize: "0.78rem",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          }}
        />
      </div>
    </VizPanel>
  );
}