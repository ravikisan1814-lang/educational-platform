import { getAdminClient } from "@/lib/api-helpers";
import Link from "next/link";

interface TopicData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  chapter_id: string;
  order: number;
}

interface Resource {
  id: string;
  title: string;
  type: string;
  content_type: string;
  content: any;
}

interface PageProps {
  params: Promise<{ classSlug: string; subjectSlug: string; chapterSlug: string; topicSlug: string }>;
}

export async function generateStaticParams() {
  const sb = getAdminClient();
  const { data: topics } = await sb
    .from("topics")
    .select("slug, chapter_id")
    .eq("is_active", true);

  const params = [];
  for (const topic of topics ?? []) {
    const { data: chapter } = await sb
      .from("chapters")
      .select("slug, subject_id")
      .eq("id", topic.chapter_id)
      .single();
    if (chapter) {
      const { data: subject } = await sb
        .from("subjects")
        .select("slug, class_id")
        .eq("id", chapter.subject_id)
        .single();
      if (subject) {
        const { data: cls } = await sb
          .from("classes")
          .select("slug")
          .eq("id", subject.class_id)
          .single();
        if (cls) {
          params.push({ classSlug: cls.slug, subjectSlug: subject.slug, chapterSlug: chapter.slug, topicSlug: topic.slug });
        }
      }
    }
  }
  return params;
}

export default async function TopicPage({ params }: PageProps) {
  const { classSlug, subjectSlug, chapterSlug, topicSlug } = await params;
  const sb = getAdminClient();

  const { data: topicData, error: topicError } = await sb
    .from("topics")
    .select("*")
    .eq("slug", topicSlug)
    .eq("is_active", true)
    .single();

  if (topicError || !topicData) {
    return (
      <div className="page-shell">
        <main className="error-page">
          <h1>Topic Not Found</h1>
          <p>The topic {topicSlug} was not found.</p>
          <Link href={`/learn/${classSlug}/${subjectSlug}/${chapterSlug}`} className="btn btn-primary">
            Back to Chapter
          </Link>
        </main>
      </div>
    );
  }

  const { data: resources, error: resourcesError } = await sb
    .from("resources")
    .select("*")
    .eq("topic_id", topicData.id)
    .eq("is_published", true);

  return (
    <div className="page-shell">
      <main className="topic-page">
        <section className="hero">
          <div className="hero-content">
            <span className="hero-badge">Tier 4-5: Topic & Core Concept</span>
            <nav className="breadcrumb">
              <Link href={`/class/${classSlug}`}>{classSlug}</Link>
              <span className="breadcrumb-sep">›</span>
              <Link href={`/learn/${classSlug}/${subjectSlug}`}>{subjectSlug}</Link>
              <span className="breadcrumb-sep">›</span>
              <Link href={`/learn/${classSlug}/${subjectSlug}/${chapterSlug}`}>{chapterSlug}</Link>
              <span className="breadcrumb-sep">›</span>
              <span>{topicData.title}</span>
            </nav>
            <h1>{topicData.title}</h1>
            <p>{topicData.description || "Master this topic with detailed notes and practice"}</p>
          </div>
        </section>

        <section className="content-section">
          <div className="tabs">
            <button className="tab active">📝 Notes</button>
            <button className="tab">🔧 Formulas</button>
            <button className="tab">✅ PYQs</button>
            <button className="tab">📊 Practice</button>
          </div>

          {resourcesError ? (
            <div className="error-message">Failed to load resources</div>
          ) : resources && resources.length > 0 ? (
            <div className="resources-content">
              {resources.map((resource: Resource) => (
                <div key={resource.id} className="resource-block">
                  <div className="resource-header">
                    <span className="resource-type">{getResourceType(resource.type)}</span>
                    <h3>{resource.title}</h3>
                  </div>
                  <div className="resource-body">
                    {renderContent(resource.content)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No learning assets available for this topic yet.</p>
              <p className="empty-hint">Content is being added. Check back soon!</p>
            </div>
          )}
        </section>

        <section className="content-section">
          <h2>Related Topics</h2>
          <div className="related-topics">
            <Link href={`/learn/${classSlug}/${subjectSlug}/${chapterSlug}`} className="related-card">
              ← Back to {chapterSlug}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function getResourceType(type: string): string {
  const types: Record<string, string> = {
    "NOTES": "📝 Notes",
    "MINDMAP": "🗺️ Mind Map",
    "SUMMARY": "📋 Summary",
    "FORMULA": "🔧 Formula Sheet",
    "PYQ": "✅ Previous Year Question",
    "PRACTICE": "📊 Practice Problems",
  };
  return types[type] || type;
}

function renderContent(content: any) {
  if (!content) return null;

  return (
    <div className="content-renderer">
      {content.body && (
        <div className="content-body">
          <p>{content.body}</p>
        </div>
      )}
      {content.key_formulas && content.key_formulas.length > 0 && (
        <div className="content-formulas">
          <h4>Key Formulas</h4>
          <ul>
            {content.key_formulas.map((formula: string, i: number) => (
              <li key={i}><code>{formula}</code></li>
            ))}
          </ul>
        </div>
      )}
      {content.examples && content.examples.length > 0 && (
        <div className="content-examples">
          <h4>Examples</h4>
          {content.examples.map((ex: any, i: number) => (
            <div key={i} className="example-block">
              <p><strong>Problem:</strong> {ex.problem}</p>
              <p><strong>Solution:</strong> {ex.solution}</p>
            </div>
          ))}
        </div>
      )}
      {content.practice_questions && content.practice_questions.length > 0 && (
        <div className="content-practice">
          <h4>Practice Questions</h4>
          <ol>
            {content.practice_questions.map((q: string, i: number) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
