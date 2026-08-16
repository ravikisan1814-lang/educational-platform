"use client";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import dynamic from "next/dynamic";

const ThreeScene = dynamic(() => import("@/components/visuals/ThreeScene"), {
  ssr: false,
});

const SUBJECTS = [
  {
    slug: "physics",
    label: "Physics",
    figures: [
      { key: "trajectory", label: "Trajectory / graph" },
      { key: "vectorfield", label: "Vector field / force" },
      { key: "wave", label: "Wave / oscillation" },
      { key: "abstract", label: "Abstract" },
    ],
  },
  {
    slug: "chemistry",
    label: "Chemistry",
    figures: [
      { key: "molecular", label: "Molecular / orbital" },
      { key: "barchart", label: "Bar chart / comparison" },
      { key: "abstract", label: "Abstract" },
    ],
  },
  {
    slug: "mathematics",
    label: "Mathematics",
    figures: [
      { key: "trajectory", label: "Graph / plot" },
      { key: "barchart", label: "Bar chart / comparison" },
      { key: "abstract", label: "Abstract" },
    ],
  },
];

export default function GraphsPage() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="home-main">
        <section className="hero hero-premium">
          <span className="hero-badge">Graphs &amp; Figures</span>
          <h1>Subject-wise figures</h1>
          <p>Pick a subject to preview the 3D figure styles used in notes.</p>
        </section>
        <section className="content-section">
          <div className="notes-list">
            {SUBJECTS.map((subject) => (
              <article key={subject.slug} className="note-card">
                <h3 className="note-card-title">{subject.label}</h3>
                <div className="note-card-teaser">
                  {subject.figures.map((fig) => (
                    <div key={fig.key} className="graph-row">
                      <span className="graph-label">{fig.label}</span>
                      <ThreeScene figureType={fig.key} topicTitle={`${subject.label} — ${fig.label}`} />
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
