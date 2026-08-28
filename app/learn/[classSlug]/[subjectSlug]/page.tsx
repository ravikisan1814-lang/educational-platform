import { getAdminClient } from "@/lib/api-helpers";
import Link from "next/link";

interface SubjectData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  class_id: string;
  order: number;
}

interface Chapter {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  order: number;
}

interface PageProps {
  params: Promise<{ classSlug: string; subjectSlug: string }>;
}

export async function generateStaticParams() {
  const sb = getAdminClient();
  const { data: classes } = await sb
    .from("classes")
    .select("slug")
    .eq("is_active", true);

  const { data: subjects } = await sb
    .from("subjects")
    .select("slug, class_id")
    .eq("is_active", true);

  const params = [];
  for (const cls of classes ?? []) {
    for (const subj of subjects ?? []) {
      if (subj.class_id) {
        params.push({ classSlug: cls.slug, subjectSlug: subj.slug });
      }
    }
  }
  return params;
}

export default async function SubjectPage({ params }: PageProps) {
  const { classSlug, subjectSlug } = await params;
  const sb = getAdminClient();

  const { data: classData } = await sb
    .from("classes")
    .select("id, name")
    .eq("slug", classSlug)
    .single();

  const { data: subjectData, error: subjectError } = await sb
    .from("subjects")
    .select("*")
    .eq("slug", subjectSlug)
    .eq("is_active", true)
    .single();

  if (subjectError || !subjectData) {
    return (
      <div className="page-shell">
        <main className="error-page">
          <h1>Subject Not Found</h1>
          <p>The subject {subjectSlug} was not found.</p>
          <Link href="/learn" className="btn btn-primary">
            Back to Learn
          </Link>
        </main>
      </div>
    );
  }

  const { data: chapters, error: chaptersError } = await sb
    .from("chapters")
    .select("*")
    .eq("subject_id", subjectData.id)
    .eq("is_active", true)
    .order("order", { ascending: true });

  return (
    <div className="page-shell">
      <main className="subject-page">
        <section className="hero">
          <div className="hero-content">
            <span className="hero-badge">Tier 2: Subject</span>
            <nav className="breadcrumb">
              <Link href="/class/{classSlug}">{classData?.name || classSlug}</Link>
              <span className="breadcrumb-sep">›</span>
              <span>{subjectData.name}</span>
            </nav>
            <h1>{subjectData.name}</h1>
            <p>{subjectData.description || "Master this subject with comprehensive notes and practice"}</p>
          </div>
        </section>

        <section className="content-section">
          <div className="section-header">
            <h2>Chapters</h2>
            <span className="chapter-count">{chapters?.length || 0} chapters</span>
          </div>

          {chaptersError ? (
            <div className="error-message">Failed to load chapters</div>
          ) : chapters && chapters.length > 0 ? (
            <div className="chapters-list">
              {chapters.map((chapter: Chapter, index: number) => (
                <Link
                  key={chapter.id}
                  href={`/learn/${classSlug}/${subjectSlug}/${chapter.slug}`}
                  className="chapter-card"
                >
                  <div className="chapter-number">0{index + 1}</div>
                  <div className="chapter-info">
                    <h3>{chapter.title}</h3>
                    {chapter.description && <p>{chapter.description}</p>}
                  </div>
                  <div className="chapter-arrow">→</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No chapters available for this subject yet.</p>
            </div>
          )}
        </section>

        <section className="content-section">
          <h2>Quick Stats</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{chapters?.length || 0}</div>
              <div className="stat-label">Chapters</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">📚</div>
              <div className="stat-label">Learning Assets</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">✅</div>
              <div className="stat-label">PYQs Available</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
