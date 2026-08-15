"use client";

import { useEffect, useRef, useState } from "react";
import type { Data, Layout, Config } from "plotly.js";

interface PlotlyChartProps {
  data: Data[];
  layout: Partial<Layout>;
  config?: Partial<Config>;
  height?: number;
  className?: string;
}

/**
 * Minimal Plotly wrapper around plotly.js-dist-min (MIT, 0 runtime deps).
 *
 * - Imported via dynamic import inside the effect, so the ~4 MB Plotly
 *   bundle is only fetched when a chart is actually rendered.
 * - Renders server-side safe (plain div; the graph is painted in an effect).
 * - Re-plots when the serialized figure changes (purge + newPlot) and
 *   purges the DOM/WebGL resources on unmount.
 */
export default function PlotlyChart({
  data,
  layout,
  config,
  height = 320,
  className,
}: PlotlyChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [figureKey, setFigureKey] = useState(() =>
    JSON.stringify({ data, layout, config })
  );

  useEffect(() => {
    setFigureKey(JSON.stringify({ data, layout, config }));
  }, [data, layout, config]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let plotly: typeof import("plotly.js-dist-min") | null = null;
    let graph: unknown = null;

    (async () => {
      const Plotly = await import("plotly.js-dist-min");
      if (cancelled || !container) return;
      plotly = Plotly;
      graph = await Plotly.newPlot(container, data, layout, config);
    })().catch(() => {
      if (!cancelled) {
        container.textContent = "Chart failed to render.";
      }
    });

    return () => {
      cancelled = true;
      if (graph && plotly) plotly.purge(graph as never);
      graph = null;
    };
    // Data/layout/config are captured above; figureKey guards re-plots.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [figureKey]);

  return (
    <div
      ref={containerRef}
      className={className ?? "plotly-chart"}
      style={{ minHeight: height }}
      role="img"
      aria-label="Interactive chart"
    />
  );
}