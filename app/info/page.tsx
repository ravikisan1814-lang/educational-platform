import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "Rules & Notices — EduPlatform",
  description: "Access tiers, official notices and owner contact.",
};

const OWNER_CONTACT = "ravikisan1814@gmail.com";

const TIERS = [
  { level: 1, label: "Owner", percent: "100%" },
  { level: 2, label: "Member", percent: "50%" },
  { level: 3, label: "Co-member", percent: "25%" },
  { level: 4, label: "Public", percent: "10%" },
];

const NOTICES = [
  {
    title: "Platform policy",
    body: "All content is tier-gated. Higher tiers unlock more detailed notes, examples and past year questions.",
  },
  {
    title: "Account approval",
    body: "New accounts are created as Pending. The owner must approve them before login is enabled.",
  },
  {
    title: "Contact",
    body: "For access requests or support, email the owner directly.",
  },
];

export default function InfoPage() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="content-section" style={{ maxWidth: 800, margin: "2rem auto" }}>
        <h1 style={{ margin: "0 0 1rem", fontSize: "1.5rem" }}>Rules & Notices</h1>

        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.15rem" }}>Access tiers</h2>
          <p style={{ color: "var(--muted)", margin: "0 0 0.75rem", fontSize: "0.9rem" }}>
            Content visibility is controlled by your access tier. Public users see the
            introductory concept; higher tiers unlock the full notes.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {TIERS.map((tier) => (
              <div
                key={tier.level}
                className="tier-legend-item"
              >
                <span className="tier-legend-level">{tier.label}</span>
                <strong>{tier.percent}</strong>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.15rem" }}>Official notices</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {NOTICES.map((notice) => (
              <div key={notice.title} className="card" style={{ padding: "1rem" }}>
                <h3 style={{ margin: "0 0 0.35rem", fontSize: "1rem" }}>{notice.title}</h3>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>{notice.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.15rem" }}>Owner contact</h2>
          <div className="card" style={{ padding: "1rem" }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.95rem" }}>
              For access requests, tier upgrades or support:
            </p>
            <a
              href={`mailto:${OWNER_CONTACT}`}
              style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1rem" }}
            >
              {OWNER_CONTACT}
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
