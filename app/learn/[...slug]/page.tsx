import SiteHeader from "@/components/SiteHeader";
import HierarchyExplorer from "@/components/learn/HierarchyExplorer";

export const metadata = {
  title: "Learn — Syllabus Explorer | EduPlatform",
  description:
    "Explore the full syllabus map. Every cover is open — only the 90% in-content notes are tier-gated.",
};

/**
 * Catch-all for intermediate hierarchy depths (2-5 segments):
 *   /learn/[group]/[subject]
 *   /learn/[group]/[subject]/[chapter]
 *   /learn/[group]/[subject]/[chapter]/[subChapter]
 *   /learn/[group]/[subject]/[chapter]/[subChapter]/[topic]
 *
 * More specific static routes take precedence:
 *   /learn                                   -> learn/page.tsx
 *   /learn/[group]                           -> learn/[group]/page.tsx
 *   /learn/[group]/[subject]/.../[item]      -> learn/[group]/[subject]/.../[item]/page.tsx
 *
 * All render the same open syllabus-map explorer with a persistent nested
 * sidebar (references the group slug for auto-expansion).
 */
export default async function LearnSlugPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const groupSlug = slug?.[0] ?? null;

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
          <HierarchyExplorer initialGroupSlug={groupSlug} />
        </section>
      </main>
    </div>
  );
}