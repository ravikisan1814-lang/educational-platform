import SiteHeader from "@/components/SiteHeader";
import HierarchyExplorer from "@/components/learn/HierarchyExplorer";

export const metadata = {
  title: "Learn — Syllabus Explorer | EduPlatform",
  description:
    "Explore the full syllabus map: Loksewa, General Knowledge and Academic Core. Every cover is open — only the 90% in-content notes are tier-gated.",
};

export default function LearnPage() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        <section className="hero hero-premium">
          <span className="hero-badge">Deep Learning Map</span>
          <h1>Explore the syllabus freely</h1>
          <p>
            Exam Group → Subject → Chapter → Sub-Chapter → Topic. All titles,
            cards and covers are open to everyone. Open any topic to read the
            10% public concept — the 90% notes are tier-gated inside.
          </p>
        </section>
        <section className="content-section">
          <HierarchyExplorer />
        </section>
      </main>
    </div>
  );
}