import Link from "next/link";

/**
 * Footer shown ONLY on the home page. Credits the platform owner, describes
 * the NEB/CDC curriculum coverage, and offers a feedback mailto link.
 */
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p className="footer-brand">Ravikisan</p>

        {/* Owner intro */}
        <p className="footer-credit">
          {"Hi, I'm "}
          <strong>Ravikisan</strong>
          {
            " — a passionate educator and developer building this platform to make NEB Class 11 & 12 study material clear, structured and accessible for every student."
          }
        </p>

        {/* NEB / CDC description */}
        <p className="footer-credit">
          {"This platform follows the "}
          <strong>NEB (National Examination Board)</strong>
          {" and "}
          <strong>CDC (Curriculum Development Centre)</strong>
          {
            " curriculum for Nepal's Class 11 & 12 — covering syllabus, notes, past year questions, MCQs, numericals and formulas across seven subjects."
          }
        </p>

        {/* Feedback */}
        <p className="footer-credit">
          {"Have feedback or a question? "}
          <a
            href="mailto:ravikisan1814@gmail.com?subject=EduPlatform%20Feedback"
            className="footer-credit-link"
          >
            Send feedback
          </a>
          .
        </p>

        <nav className="footer-nav" aria-label="Footer">
          <Link href="/">Home</Link>
          <Link href="/learn">Learn</Link>
          <Link href="mailto:ravikisan1814@gmail.com">Contact</Link>
        </nav>

        {/* Glowing credit line */}
        <p className="footer-glow">Designed and developed by Ravikisan</p>

        {/* Glowing tagline at the very bottom */}
        <p className="footer-glow footer-glow-tagline">Knowledge is Power</p>
      </div>
    </footer>
  );
}