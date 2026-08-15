"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import VizPanel from "./VizPanel";
import type { ExamGroupNode } from "@/lib/types";
import { ACCESS_LEVEL_LABELS } from "@/lib/types";
import type { Data, Layout } from "plotly.js";

const PlotlyChart = dynamic(
  () => import("@/components/visuals/PlotlyChart"),
  {
    ssr: false,
    loading: () => <div className="viz-loading">Preparing charts…</div>,
  }
);

interface GroupStats {
  name: string;
  topics: number;
  items: number;
  tierCounts: number[];
}

function computeStats(tree: ExamGroupNode[] | null): GroupStats[] {
  return (tree ?? []).map((group) => {
    const topics: string[] = [];
    const tierCounts = [0, 0, 0, 0];
    let items = 0;

    for (const subject of group.subjects ?? []) {
      for (const chapter of subject.chapters ?? []) {
        for (const sub of chapter.sub_chapters ?? []) {
          for (const topic of sub.topics ?? []) {
            topics.push(topic.id);
            for (const item of topic.content_items ?? []) {
              items += 1;
              const tier = Math.min(Math.max(item.access_level, 1), 4) - 1;
              tierCounts[tier] += 1;
            }
          }
        }
      }
    }

    return {
      name: group.name,
      topics: topics.length,
      items,
      tierCounts,
    };
  });
}

/**
 * Real-data syllabus analytics: bar chart of topics/notes per exam group and
 * a donut of content notes per access tier, computed from the fetched
 * /api/hierarchy tree. Plotly is only loaded when the panel is opened.
 */
export default function SyllabusAnalytics({
  tree,
}: {
  tree: ExamGroupNode[] | null;
}) {
  const stats = useMemo(() => computeStats(tree), [tree]);

  const barFigure = useMemo(() => {
    const data: Data[] = [
      {
        type: "bar",
        name: "Topics",
        x: stats.map((s) => s.name),
        y: stats.map((s) => s.topics),
        marker: { color: "rgba(59, 130, 246, 0.85)" },
      },
      {
        type: "bar",
        name: "Content notes",
        x: stats.map((s) => s.name),
        y: stats.map((s) => s.items),
        marker: { color: "rgba(139, 152, 171, 0.85)" },
      },
    ];
    const layout: Partial<Layout> = {
      barmode: "group",
      title: { text: "Syllabus size per exam group", font: { size: 14 } },
      height: 340,
      margin: { t: 48, b: 90, l: 48, r: 16 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: "inherit" },
    };
    return { data, layout };
  }, [stats]);

  const pieFigure = useMemo(() => {
    const labels = Object.values(ACCESS_LEVEL_LABELS).map((label) => `Tier ${label}`);
    const values = [0, 1, 2, 3].map(
      (i) => stats.reduce((sum, s) => sum + (s.tierCounts[i] ?? 0), 0)
    );
    const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6"];
    const data: Data[] = [
      {
        type: "pie",
        labels,
        values,
        hole: 0.45,
        marker: { colors },
        textinfo: "label+percent",
        textfont: { size: 12 },
      },
    ];
    const layout: Partial<Layout> = {
      title: { text: "Content notes by access tier", font: { size: 14 } },
      height: 340,
      margin: { t: 48, b: 32, l: 16, r: 16 },
      paper_bgcolor: "rgba(0,0,0,0)",
      font: { family: "inherit" },
      showlegend: false,
    };
    return { data, layout };
  }, [stats]);

  return (
    <VizPanel title="Syllabus analytics (interactive charts)" testId="viz-analytics">
      <p className="viz-note">
        Computed live from the syllabus map — topics, notes and access-tier
        distribution across the whole hierarchy.
      </p>
      <PlotlyChart data={barFigure.data} layout={barFigure.layout} />
      <PlotlyChart data={pieFigure.data} layout={pieFigure.layout} />
    </VizPanel>
  );
}