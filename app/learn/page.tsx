import SiteHeader from "@/components/SiteHeader";
import TaxonomyExplorer from "@/components/TaxonomyExplorer";

export const metadata = {
  title: "Learn - Taxonomy Explorer | EduPlatform",
  description: "Explore the complete educational taxonomy from NEB to individual topics",
};

export default function LearnPage() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        <section className="hero hero-premium">
          <span className="hero-badge">Taxonomy Explorer</span>
          <h1>Structured Learning Path</h1>
          <p>
            Navigate through our hierarchical knowledge system. From broad domains
            down to specific species-level topics - every concept has its place.
          </p>
        </section>
        <section className="content-section">
          <TaxonomyExplorer />
        </section>
      </main>
    </div>
  );
}
