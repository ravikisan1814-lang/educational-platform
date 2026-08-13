import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ContentGrid from "@/components/ContentGrid";
import QuickQuiz from "@/components/QuickQuiz";
import {
  SUBJECTS,
  CLASS_11_SECTIONS,
  CLASS_12_SECTIONS,
  CONTENT_BLOCKS,
} from "@/lib/content-structure";

export const metadata = {
  title: "EduPlatform — Premium Class 11 & 12 Study Material",
  description:
    "Premium notes, mind-maps, conceptual points, examples, past year questions, MCQs, numericals and formulas for Class 11 and Class 12.",
};

export default function Home() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="hero hero-premium">
          <span className="hero-badge">NEB Class 11 & 12</span>
          <h1>Educational content for Class 11 & 12</h1>
          <p>
            Notes, mind-maps, conceptual points, examples, bullet points, past
            year questions with answers, MCQs, short & long questions,
            numericals and formulas — all in one place.
          </p>
          <div className="hero-actions">
            <Link href="/catalog" className="btn btn-primary btn-lg">
              Browse Catalog
            </Link>
            <Link href="#subjects" className="btn btn-secondary btn-lg">
              Explore Subjects
            </Link>
          </div>
        </section>

        {/* Subjects */}
        <section id="subjects" className="content-section">
          <h2>Seven subjects, one platform</h2>
          <div className="subject-grid">
            {SUBJECTS.map((subject) => (
              <div key={subject.slug} className="subject-card">
                <h3>{subject.name}</h3>
                <p>{subject.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Class 11 */}
        <section id="class-11" className="content-section">
          <h2>Class 11</h2>
          <div className="class-grid">
            {CLASS_11_SECTIONS.map((section) => (
              <div key={section.id} className="class-card">
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Class 12 */}
        <section id="class-12" className="content-section">
          <h2>Class 12</h2>
          <div className="class-grid">
            {CLASS_12_SECTIONS.map((section) => (
              <div key={section.id} className="class-card">
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Content blocks */}
        <section id="features" className="content-section">
          <h2>Every topic, fully covered</h2>
          <div className="block-grid">
            {CONTENT_BLOCKS.map((block) => (
              <div key={block.id} className="block-card">
                <h3>{block.label}</h3>
                <p>{block.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section id="upgrade" className="content-section cta-section">
          <h2>Unlock premium content</h2>
          <p>
            Contact the owner to upgrade your access tier and get full notes,
            past papers and solutions.
          </p>
          <a
            href="mailto:ravikisan1814@gmail.com"
            className="btn btn-primary btn-lg"
          >
            Contact us
          </a>
        </section>

        {/* Quick quiz — one MCQ at a time with a 4s timer */}
        <QuickQuiz />

        {/* Contents — content cards (anchor target for the header "Contents" link) */}
        <section id="contents" className="content-section">
          <ContentGrid />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}