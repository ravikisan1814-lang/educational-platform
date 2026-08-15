import Link from "next/link";

/**
 * Footer shown ONLY on the home page.
 */
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p className="footer-brand">Made with curiosity by Ravikisan</p>

        <p className="footer-credit">
          <strong>Academic Compliance</strong>
        </p>
        <p className="footer-credit">
          This platform strictly adheres to the latest curriculum, guidelines,
          and evaluation standards set by the National Examinations Board (NEB)
          and the Curriculum Development Centre (CDC), Nepal.
        </p>

        <p className="footer-credit">
          <strong>Contact & Support</strong>
        </p>
        <p className="footer-credit">
          Have questions or feedback? Reach out to us at{" "}
          <a
            href="mailto:ravikisan1814@gmail.com"
            className="footer-credit-link"
          >
            ravikisan1814@gmail.com
          </a>
          .
        </p>

        <p className="footer-credit">Designed and developed by Ravikishan</p>

        <p className="footer-glow footer-glow-tagline" style={{ fontStyle: "italic" }}>
          Knowledge is power
        </p>
      </div>
    </footer>
  );
}
