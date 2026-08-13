import SiteHeader from "@/components/SiteHeader";
import ContentItemViewer from "@/components/learn/ContentItemViewer";
import type { BreadcrumbEntry } from "@/lib/types";

export const metadata = {
  title: "Content — EduPlatform",
  description:
    "In-content viewer: 10% public concept always visible, 90% locked notes gated by access tier.",
};

/**
 * Content item page at /contents/[id].
 *
 * This is the destination of the unlocked card "Read" link (ContentCard
 * renders `/contents/${item.id}`). It reuses the same SiteHeader +
 * ContentItemViewer stack as the deep /learn hierarchy pages, so the
 * 10%/90% tier-gating and variant tabs behave identically.
 */
export default async function ContentItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const breadcrumbs: BreadcrumbEntry[] = [
    { label: "Home", href: "/" },
    { label: "Contents", href: "/#contents" },
  ];

  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        <section className="content-section viewer-section">
          <ContentItemViewer itemId={id} breadcrumbs={breadcrumbs} />
        </section>
      </main>
    </div>
  );
}