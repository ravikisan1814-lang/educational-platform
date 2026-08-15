import Link from "next/link";

const OWNER_EMAIL = "ravikisan1814@gmail.com";

const MOOD_LINES = [
  "Take a breath — learning is a marathon, not a sprint.",
  "Every expert was once a beginner who refused to quit.",
  "Your effort today becomes your confidence tomorrow.",
  "Small steps through the syllabus add up to big results.",
];

/**
 * Footer shown ONLY on the home page.
 */
export default function SiteFooter() {
  const moodLine = MOOD_LINES[new Date().getDate() % MOOD_LINES.length];

  return (
    <footer className="site-footer site-footer-rich">
      <div className="footer-inner">
        <p className="footer-made-with">
          Made with curiosity by{" "}
          <a href={`mailto:${OWNER_EMAIL}`} className="footer-glow-link">
            Ravikishan
          </a>
        </p>
        <p className="footer-mood">{moodLine}</p>

        <section className="footer-block">
          <h3 className="footer-block-title">Academic Compliance</h3>
          <p className="footer-block-text">
            This platform strictly adheres to the latest curriculum, guidelines,
            and evaluation standards set by the National Examinations Board (NEB)
            and the Curriculum Development Centre (CDC), Nepal.
          </p>
        </section>

        <section className="footer-block">
          <h3 className="footer-block-title">Contact &amp; Support</h3>
          <p className="footer-block-text">
            Have questions or feedback? Reach out to us at{" "}
            <a href={`mailto:${OWNER_EMAIL}`} className="footer-glow-link">
              {OWNER_EMAIL}
            </a>
            .
          </p>
        </section>

        <p className="footer-designed footer-glow-text">
          Designed and developed by Ravikishan
        </p>

        <p className="footer-power footer-glow-italic">
          <em>Knowledge is power</em>
        </p>

        <nav className="footer-nav" aria-label="Footer">
          <Link href="/">Home</Link>
          <Link href="/learn">Learn</Link>
          <Link href={`mailto:${OWNER_EMAIL}`}>Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
