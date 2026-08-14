import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import HomeExplorer from "@/components/home/HomeExplorer";
import QuickQuiz from "@/components/QuickQuiz";

export const metadata = {
  title: "EduPlatform — Class 11, Class 12 & Knowledge",
  description:
    "Class 11 notes, Class 11E, Class 11 more — Class 12 notes, Class 12E, Class 12 more — Loksewa knowledge and world knowledge. All in one place.",
};

export default function Home() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="hero hero-premium">
          <span className="hero-badge">NEB Class 11 & 12 · Loksewa · GK</span>
          <h1>Class 11, Class 12 & Knowledge</h1>
          <p>
            Notes, mind-maps, conceptual points, examples, past year questions,
            MCQs, numericals and formulas — organized under three sections.
            Open any section freely; locks only appear inside content items.
          </p>
          <div className="hero-actions">
            <Link href="#class-11" className="btn btn-primary btn-lg">
              Class 11
            </Link>
            <Link href="#class-12" className="btn btn-secondary btn-lg">
              Class 12
            </Link>
            <Link href="#knowledge" className="btn btn-secondary btn-lg">
              Knowledge
            </Link>
          </div>
        </section>

        {/* The 3 home sections — Class 11, Class 12, Knowledge */}
        <section id="home-sections" className="content-section">
          <HomeExplorer />
        </section>

        {/* Quick quiz — one MCQ at a time with a 4s timer */}
        <QuickQuiz />

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
      </main>
      <SiteFooter />
    </div>
  );
}