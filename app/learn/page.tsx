import Link from "next/link";
import SideNav from "@/components/SideNav";

export const metadata = {
  title: "Learn - Explore Content | EduPlatform",
  description: "Browse educational content by class, subject, chapter, and topic",
};

export default function LearnPage() {
  return (
    <div className="learn-page">
      <main className="learn-main">
        <section className="hero hero-premium">
          <span className="hero-badge">Taxonomy Explorer</span>
          <h1>Explore the Syllabus</h1>
          <p>
            Navigate through our structured learning system. From broad domains
            down to specific topics - every concept has its place.
          </p>
          <div className="hero-actions">
            <Link href="/class/class-11" className="btn btn-primary btn-lg">
              Start Class 11
            </Link>
            <Link href="/class/class-12" className="btn btn-secondary btn-lg">
              Start Class 12
            </Link>
          </div>
        </section>

        <section className="content-section">
          <h2>📚 Choose Your Class</h2>
          <div className="class-grid">
            <Link href="/class/class-11" className="class-card">
              <div className="class-icon">📚</div>
              <h3>Class 11</h3>
              <p>First year of +2 education. Science, Management, and Humanities streams.</p>
              <div className="class-stats">
                <span>6 Subjects</span>
                <span>87 Chapters</span>
              </div>
            </Link>
            <Link href="/class/class-12" className="class-card">
              <div className="class-icon">📚</div>
              <h3>Class 12</h3>
              <p>Second year of +2 education. Advanced concepts and exam preparation.</p>
              <div className="class-stats">
                <span>6 Subjects</span>
                <span>Chapters</span>
              </div>
            </Link>
          </div>
        </section>

        <section className="content-section">
          <h2>📊 Taxonomy Overview</h2>
          <div className="taxonomy-grid">
            <div className="taxonomy-card tier-1">
              <span className="tier-badge">Tier 1</span>
              <h3>Class</h3>
              <p>Academic year/grade level</p>
            </div>
            <div className="taxonomy-card tier-2">
              <span className="tier-badge">Tier 2</span>
              <h3>Subject</h3>
              <p>Core field of study</p>
            </div>
            <div className="taxonomy-card tier-3">
              <span className="tier-badge">Tier 3</span>
              <h3>Chapter</h3>
              <p>Main curricular modules</p>
            </div>
            <div className="taxonomy-card tier-4">
              <span className="tier-badge">Tier 4</span>
              <h3>Sub-Chapter</h3>
              <p>Specific sections</p>
            </div>
            <div className="taxonomy-card tier-5">
              <span className="tier-badge">Tier 5</span>
              <h3>Core Concepts</h3>
              <p>Fundamental principles</p>
            </div>
            <div className="taxonomy-card tier-6">
              <span className="tier-badge">Tier 6</span>
              <h3>Learning Assets</h3>
              <p>Notes, Mind Maps, Summaries</p>
            </div>
            <div className="taxonomy-card tier-7">
              <span className="tier-badge">Tier 7</span>
              <h3>Practical Apps</h3>
              <p>Equations, Formulas, Numericals</p>
            </div>
            <div className="taxonomy-card tier-8">
              <span className="tier-badge">Tier 8</span>
              <h3>Assessment</h3>
              <p>PYQs, Mock Items, Practice</p>
            </div>
          </div>
        </section>

        <section className="content-section">
          <h2>📖 Popular Subjects</h2>
          <div className="subjects-preview">
            {["Physics", "Chemistry", "Mathematics", "Biology", "English", "Nepali"].map((subject) => (
              <Link key={subject} href="/class/class-11/physics" className="subject-chip">
                {subject}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
