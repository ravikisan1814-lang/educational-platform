import Link from "next/link";
import ContentGrid from "@/components/ContentGrid";
import { createClient } from "@/lib/supabase";
import type { ExamGroupNode } from "@/lib/types";

export const metadata = {
  title: "Content Catalog — EduPlatform",
  description:
    "Browse all educational content organized by exam groups and subjects. Locked cards show masked titles and never expose raw file URLs.",
};

/**
 * Catalog landing page — shows an overview grid of available Exam Groups
 * and quick-access cards for popular subjects.
 *
 * This page lives inside the catalog layout which provides the sidebar.
 */
export default async function CatalogPage() {
  let examGroups: ExamGroupNode[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("exam_groups")
      .select(
        `id, slug, name, description, sort_order,
         subjects(
           id, slug, name, description, sort_order
         )`
      )
      .order("sort_order");

    if (!error && data) {
      examGroups = (data as unknown as ExamGroupNode[]) ?? [];
    }
  } catch {
    // If Supabase isn't configured, we'll show a message
  }

  // Collect all subjects across all exam groups for the "popular subjects" section
  const allSubjects = examGroups.flatMap((group) =>
    (group.subjects ?? []).map((subject) => ({
      ...subject,
      examGroupSlug: group.slug,
      examGroupName: group.name,
    }))
  );

  // Sort subjects by a simple heuristic (could be enhanced with popularity data)
  const popularSubjects = allSubjects.slice(0, 6);

  return (
    <div className="catalog-page">
      <section className="catalog-hero">
        <h1>Content Catalog</h1>
        <p>
          Browse the complete syllabus hierarchy. Click through exam groups,
          subjects, chapters, and topics to find the content you need.
        </p>
      </section>

      {examGroups.length === 0 ? (
        <section className="catalog-empty content-section">
          <h2>No content available yet</h2>
          <p className="catalog-empty-text">
            The catalog is being populated. Check back soon or reach out to
            learn more.
          </p>
          <Link href="/" className="btn btn-primary">
            Return home
          </Link>
        </section>
      ) : (
        <>
          <section className="content-section">
            <h2>Exam Groups</h2>
            <div className="exam-group-grid">
              {examGroups.map((group) => (
                <Link
                  key={group.id}
                  href={`/catalog/${group.slug}`}
                  className="exam-group-card card"
                >
                  <h3 className="exam-group-card-title">{group.name}</h3>
                  {group.description && (
                    <p className="exam-group-card-desc">{group.description}</p>
                  )}
                  <div className="exam-group-card-meta">
                    <span className="exam-group-card-count">
                      {group.subjects?.length ?? 0} subject
                      {(group.subjects?.length ?? 0) !== 1 ? "s" : ""}
                    </span>
                    <span className="exam-group-card-arrow">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {popularSubjects.length > 0 && (
            <section className="content-section">
              <h2>Popular Subjects</h2>
              <div className="subject-grid">
                {popularSubjects.map((subject) => (
                  <Link
                    key={subject.id}
                    href={`/catalog/${subject.examGroupSlug}/${subject.slug}`}
                    className="subject-card card"
                  >
                    <h3>{subject.name}</h3>
                    {subject.description && (
                      <p className="card-description">{subject.description}</p>
                    )}
                    <span className="subject-card-group">
                      {subject.examGroupName}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section className="content-section">
        <h2>Contents</h2>
        <ContentGrid />
      </section>

      <section id="upgrade" className="content-section cta-section">
        <h2>Unlock more</h2>
        <p>
          Get access to premium notes. Reach out to upgrade your access tier
          and unlock the full content library.
        </p>
        <div className="hero-actions">
          <Link href="mailto:ravikisan1814@gmail.com" className="btn btn-primary btn-lg">
            Contact us
          </Link>
          <Link href="/" className="btn btn-secondary btn-lg">
            Learn more
          </Link>
        </div>
      </section>
    </div>
  );
}