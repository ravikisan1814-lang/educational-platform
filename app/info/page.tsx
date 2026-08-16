import Link from "next/link";

const OWNER_EMAIL = "ravikisan1814@gmail.com";

const TIERS = [
  {
    level: 1,
    name: "Owner",
    visibility: "100%",
    note: "Full access to every topic and content item on the platform.",
  },
  {
    level: 2,
    name: "Member",
    visibility: "50%",
    note: "About half of the catalog, including Class 11/12 core notes and practice sets.",
  },
  {
    level: 3,
    name: "Co-member",
    visibility: "25%",
    note: "A quarter of the catalog — select topics, formulas and past-year questions.",
  },
  {
    level: 4,
    name: "Public",
    visibility: "10%",
    note: "Free for every visitor: teaser notes, sample sets and the syllabus map.",
  },
];

const OFFICIAL_NOTICES = [
  {
    date: "Always active",
    title: "Login is shown only after the owner's approval",
    text: "Creating an account puts you in a pending state. Until the owner approves your account from the member management page, you can browse free public content only. Contact the owner to know how this website works.",
  },
  {
    date: "Always active",
    title: "Content is shown as teasers first",
    text: "Locked topics show a 10% public teaser so visitors can judge the material. The full notes, worked examples and past-year questions open for the tier you are approved to.",
  },
  {
    date: "Always active",
    title: "Tier access is assigned by the owner",
    text: "Member (50%), Co-member (25%) and Owner (100%) visibility are granted manually by the owner; there is no automatic upgrade.",
  },
];

const RULES = [
  "Every visitor can explore the syllabus map and read the 10% public teasers without an account.",
  "Creating an account does not unlock content — the owner must approve your account first.",
  "Approval and tier assignment are managed by the owner from the member management page.",
  "Locked items always show a \"Contact with owner\" button; write to the owner email with any request.",
  "The site respects the tier percentages: Public 10%, Co-member 25%, Member 50%, Owner 100%.",
];

export default function InfoPage() {
  return (
    <div className="info-page">
      <section className="info-hero">
        <p className="info-eyebrow">EduPlatform — How this website works</p>
        <h1>The rules and official notices</h1>
        <p className="info-hero-text">
          Read before signing in: how access works and the official notices of
          this platform. Login is enabled only after the owner&apos;s approval.
        </p>
      </section>

      <section className="info-section">
        <h2>Website rules</h2>
        <div className="coming-soon">Coming</div>
      </section>

      <section className="info-section">
        <h2>Official notices</h2>
        <div className="coming-soon">Coming</div>
      </section>

      <section className="info-section info-contact">
        <h2>How to get access</h2>
        <p>
          Get access via owner. Your login becomes active only after the owner
          approves your account. Write to the owner with your account email and
          the tier you need (Member / Co-member), then check{" "}
          <Link href="/login">the login page</Link>.
        </p>
      </section>
    </div>
  );
}