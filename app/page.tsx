import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import HomeExplorer from "@/components/home/HomeExplorer";
import QuickQuiz from "@/components/QuickQuiz";
import QuestionRecap from "@/components/QuestionRecap";

const SUBJECTS = [
  {
    name: "Physics",
    slug: "physics",
    description: "Mechanics, optics, heat, electricity and modern physics.",
    icon: "⚛️",
  },
  {
    name: "Chemistry",
    slug: "chemistry",
    description: "Physical, organic and inorganic chemistry.",
    icon: "🧪",
  },
  {
    name: "Biology",
    slug: "biology",
    description: "Cell biology, genetics and ecology.",
    icon: "🧬",
  },
  {
    name: "Mathematics",
    slug: "mathematics",
    description: "Algebra, calculus, geometry and statistics.",
    icon: "📐",
  },
  {
    name: "English",
    slug: "english",
    description: "Grammar, literature and composition.",
    icon: "📚",
  },
  {
    name: "Nepali",
    slug: "nepali",
    description: "Nepali language, literature and grammar.",
    icon: "🖊️",
  },
];

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
          <span className="hero-badge">NEB Class 11 & 12</span>
          <h1>Class 11, Class 12 & Knowledge</h1>
          <p>
            Open any section freely; locks only appear inside content items.
          </p>
          <div className="hero-actions">
            <Link href="#class-11" className="btn btn-primary btn-lg">
              Class 11
            </Link>
            <Link href="#class-12" className="btn btn-secondary btn-lg">
              Class 12
            </Link>
          </div>
        </section>

        {/* Subject Dashboard */}
        <section id="subjects" className="content-section">
          <h2 style={{ margin: "0 0 1rem", fontSize: "1.4rem" }}>Subjects</h2>
          <div className="content-grid">
            {SUBJECTS.map((subject) => (
              <Link
                key={subject.slug}
                href={`/catalog/class-11/${subject.slug}`}
                className="card subject-card"
              >
                <h3>{subject.name}</h3>
                <p>{subject.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* The 3 home sections — Class 11, Class 12 */}
        <section id="home-sections" className="content-section">
          <HomeExplorer />
        </section>

        {/* Quick quiz — one MCQ at a time with a 4s timer */}
        <QuickQuiz />

        {/* Question Recap — all questions with answers at the end */}
        <QuestionRecap />
      </main>
      <SiteFooter />
    </div>
  );
}