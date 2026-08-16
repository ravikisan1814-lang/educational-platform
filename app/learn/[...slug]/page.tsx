import SiteHeader from "@/components/SiteHeader";
import SimpleHierarchy from "@/components/learn/SimpleHierarchy";

export const metadata = {
  title: "Learn — Notes | Ravikisan's Platform",
  description: "Browse notes for this section.",
};

export default async function LearnSlugPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;

  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        <section className="hero hero-premium">
          <span className="hero-badge">Notes</span>
          <h1>{slug[slug.length - 1]?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</h1>
          <p>Browse the notes published in this section.</p>
        </section>
        <section className="content-section">
          <SimpleHierarchy path={slug} />
        </section>
      </main>
    </div>
  );
}
