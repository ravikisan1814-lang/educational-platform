import SiteHeader from "@/components/SiteHeader";
import ContentGrid from "@/components/ContentGrid";
import { ACCESS_LEVEL_LABELS } from "@/lib/types";
import type { AccessLevel } from "@/lib/types";

const TIERS: AccessLevel[] = [1, 2, 3, 4];

export const metadata = {
  title: "Content Catalog — EduPlatform",
  description:
    "Browse all educational content across access tiers: Owner, Member, Co-member, and Public.",
};

export default function CatalogPage() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        <section className="hero">
          <h1>Content Catalog</h1>
          <p>
            All educational content across the four access tiers. Locked cards
            show masked titles and never expose raw file URLs.
          </p>
        </section>

        {/* Access tier legend */}
        <section className="content-section" aria-label="Access tier legend">
          <div className="tier-legend">
            {TIERS.map((level) => (
              <div key={level} className="tier-legend-item">
                <span className="badge badge-tier">{ACCESS_LEVEL_LABELS[level]}</span>
                <span className="tier-legend-level">Tier {level}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="contents" className="content-section">
          <h2>All contents</h2>
          <ContentGrid />
        </section>

        <section id="upgrade" className="content-section">
          <h2>Unlock more</h2>
          <p>
            Members and co-members get access to premium notes. Contact the
            owner to upgrade your tier.
          </p>
        </section>
      </main>
      <footer className="site-footer">
        <p>© 2026 Educational Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}