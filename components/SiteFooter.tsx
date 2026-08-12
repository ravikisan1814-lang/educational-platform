import Link from "next/link";

/**
 * Footer shown ONLY on the home page. Credits the platform owner.
 */
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p className="footer-brand">EduPlatform</p>
        <p className="footer-credit">
          Built with care by{" "}
          <a
            href="mailto:ravikisan1814@gmail.com"
            className="footer-credit-link"
          >
            Ravikisan
          </a>
          . All rights reserved.
        </p>
        <nav className="footer-nav" aria-label="Footer">
          <Link href="/">Home</Link>
          <Link href="/learn">Learn</Link>
          <Link href="mailto:ravikisan1814@gmail.com">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}