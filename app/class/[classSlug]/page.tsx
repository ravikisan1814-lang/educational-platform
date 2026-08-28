import { getAdminClient } from "@/lib/api-helpers";
import Link from "next/link";

interface ClassData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  education_level_id: string;
}

interface Subject {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  order: number;
}

interface PageProps {
  params: Promise<{ classSlug: string }>;
}

export async function generateStaticParams() {
  const sb = getAdminClient();
  const { data: classes } = await sb
    .from("classes")
    .select("id, slug, name, description, education_level_id")
    .eq("is_active", true)
    .order("order", { ascending: true });

  return (classes ?? []).map((c: ClassData) => ({
    classSlug: c.slug,
  }));
}

export default async function ClassPage({ params }: PageProps) {
  const { classSlug } = await params;
  const sb = getAdminClient();

  const { data: classData, error: classError } = await sb
    .from("classes")
    .select("*")
    .eq("slug", classSlug)
    .eq("is_active", true)
    .single();

  if (classError || !classData) {
    return (
      <div className="page-shell">
        <main className="error-page">
          <h1>Class Not Found</h1>
          <p>The class {classSlug} does not exist.</p>
          <Link href="/learn" className="btn btn-primary">
            Back to Learn
          </Link>
        </main>
      </div>
    );
  }

  const { data: subjects, error: subjectsError } = await sb
    .from("subjects")
    .select("id, slug, name, description, order")
    .eq("class_id", classData.id)
    .eq("is_active", true)
    .order("order", { ascending: true });

  return (
    <div className="page-shell">
      <main className="class-page">
        <section className="hero">
          <div className="hero-content">
            <span className="hero-badge">Tier 1: Class</span>
            <h1>{classData.name}</h1>
            <p>{classData.description || "Explore subjects and content"}</p>
          </div>
        </section>

        <section className="content-section">
          <div className="section-header">
            <h2>Subjects</h2>
            <span className="subject-count">{subjects?.length || 0} subjects available</span>
          </div>

          {subjectsError ? (
            <div className="error-message">Failed to load subjects</div>
          ) : subjects && subjects.length > 0 ? (
            <div className="subjects-grid">
              {subjects.map((subject: Subject) => (
                <Link
                  key={subject.id}
                  href={`/learn/${classSlug}/${subject.slug}`}
                  className="subject-card"
                >
                  <div className="subject-icon">📖</div>
                  <h3>{subject.name}</h3>
                  {subject.description && <p>{subject.description}</p>}
                  <div className="subject-arrow">→</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No subjects available for this class yet.</p>
            </div>
          )}
        </section>

        <section className="content-section">
          <h2>Browse by Chapter</h2>
          <div className="chapter-preview">
            {subjects?.slice(0, 3).map((subject: Subject) => (
              <div key={subject.id} className="chapter-card">
                <h3>{subject.name}</h3>
                <Link href={`/learn/${classSlug}/${subject.slug}`} className="btn btn-secondary btn-sm">
                  View Chapters
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
