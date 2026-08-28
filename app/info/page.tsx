import SiteHeader from "@/components/SiteHeader";
import TaxonomyTree from "@/components/TaxonomyTree";
import { EDUCATION_TAXONOMY, toTreeString } from "@/lib/taxonomy";

export const metadata = {
  title: "Information - Taxonomy Overview | EduPlatform",
  description: "Understanding our hierarchical classification system",
};

export default function InfoPage() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        <section className="hero hero-premium">
          <span className="hero-badge">Information</span>
          <h1>Taxonomy System</h1>
          <p>
            Our content follows a strict hierarchical classification system inspired
            by biological taxonomy. Understanding the structure helps you learn better.
          </p>
        </section>
        <section className="content-section">
          <div className="taxonomy-info">
            <h2>Classification Levels</h2>
            <div className="tier-grid">
              <div className="tier-card domain">
                <span className="tier-icon">🌍</span>
                <h3>Domain</h3>
                <p>Biggest category - NEB, Loksewa, World Knowledge</p>
              </div>
              <div className="tier-card kingdom">
                <span className="tier-icon">👑</span>
                <h3>Kingdom</h3>
                <p>Major divisions - Class 11, Class 12</p>
              </div>
              <div className="tier-card phylum">
                <span className="tier-icon">🔬</span>
                <h3>Phylum</h3>
                <p>Groups - Science, Management, Humanities</p>
              </div>
              <div className="tier-card class">
                <span className="tier-icon">📊</span>
                <h3>Class</h3>
                <p>Subjects - Physics, Chemistry, Math, Biology</p>
              </div>
              <div className="tier-card order">
                <span className="tier-icon">📋</span>
                <h3>Order</h3>
                <p>Topics - Mechanics, Optics, Algebra, Calculus</p>
              </div>
              <div className="tier-card family">
                <span className="tier-icon">👨‍👩‍👧‍👦</span>
                <h3>Family</h3>
                <p>Subtopics - Kinematics, Reflection, Equations</p>
              </div>
              <div className="tier-card genus">
                <span className="tier-icon">🏷️</span>
                <h3>Genus</h3>
                <p>Specific concepts - Types of Motion, Mirror Formula</p>
              </div>
              <div className="tier-card species">
                <span className="tier-icon">🌱</span>
                <h3>Species</h3>
                <p>Individual lessons - Linear Motion, Circular Motion</p>
              </div>
            </div>
          </div>
        </section>
        <section className="content-section">
          <h2>Visual Taxonomy Tree</h2>
          <div className="tree-container">
            <pre className="tree-text">{toTreeString(EDUCATION_TAXONOMY)}</pre>
          </div>
        </section>
        <section className="content-section">
          <TaxonomyTree />
        </section>
      </main>
    </div>
  );
}
