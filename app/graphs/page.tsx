import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import dynamic from "next/dynamic";

const ThreeScene = dynamic(() => import("@/components/visuals/ThreeScene"), {
  ssr: false,
});

const FIGURES = [
  { key: "abstract", label: "Abstract" },
  { key: "trajectory", label: "Trajectory / graph" },
  { key: "molecular", label: "Molecular / orbital" },
  { key: "barchart", label: "Bar chart / comparison" },
  { key: "wave", label: "Wave / oscillation" },
  { key: "vectorfield", label: "Vector field / force" },
  { key: "cell", label: "Cell / biology" },
];

export const metadata = {
  title: "Graphs & Figures — Ravikisan's Platform",
  description: "Interactive 3D figure viewer for study material.",
};

export default function GraphsPage() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="home-main">
        <section className="hero hero-premium">
          <span className="hero-badge">Graphs &amp; Figures</span>
          <h1>Interactive 3D figures</h1>
          <p>Click a figure type to preview the viewer used inside notes.</p>
        </section>
        <section className="content-section">
          <div className="notes-list">
            {FIGURES.map((fig) => (
              <article key={fig.key} className="note-card">
                <h3 className="note-card-title">{fig.label}</h3>
                <div className="note-card-teaser">
                  <ThreeScene figureType={fig.key} topicTitle={fig.label} />
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
