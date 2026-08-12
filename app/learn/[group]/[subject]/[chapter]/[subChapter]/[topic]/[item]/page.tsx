import SiteHeader from "@/components/SiteHeader";
import ContentItemViewer from "@/components/learn/ContentItemViewer";
import type { BreadcrumbEntry } from "@/lib/types";

export const metadata = {
  title: "Topic Content — EduPlatform",
  description:
    "In-content viewer: 10% public concept always visible, 90% locked notes gated by access tier.",
};

export default async function TopicItemPage({
  params,
}: {
  params: Promise<{
    group: string;
    subject: string;
    chapter: string;
    subChapter: string;
    topic: string;
    item: string;
  }>;
}) {
  const { group, subject, chapter, subChapter, topic, item } = await params;

  const breadcrumbs: BreadcrumbEntry[] = [
    { label: "All groups", href: "/learn" },
    { label: decodeURIComponent(group), href: `/learn/${group}` },
    {
      label: decodeURIComponent(subject),
      href: `/learn/${group}/${subject}`,
    },
    {
      label: decodeURIComponent(chapter),
      href: `/learn/${group}/${subject}/${chapter}`,
    },
    {
      label: decodeURIComponent(subChapter),
      href: `/learn/${group}/${subject}/${chapter}/${subChapter}`,
    },
    {
      label: decodeURIComponent(topic),
      href: `/learn/${group}/${subject}/${chapter}/${subChapter}/${topic}`,
    },
  ];

  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        <section className="content-section viewer-section">
          <ContentItemViewer itemId={item} breadcrumbs={breadcrumbs} />
        </section>
      </main>
    </div>
  );
}