import SiteHeader from "@/components/SiteHeader";
import ContentBrowser from "@/components/ContentBrowser";

export const metadata = {
  title: "Content - Library | EduPlatform",
  description: "Browse all educational content organized by taxonomy",
};

export default function ContentPage() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main>
        <section className="hero hero-premium">
          <span className="hero-badge">Content Library</span>
          <h1>Browse All Content</h1>
          <p>
            Access notes, practice problems, videos, and more. Content is organized
            following the biological taxonomy system for easy navigation.
          </p>
        </section>
        <section className="content-section">
          <ContentBrowser />
        </section>
      </main>
    </div>
  );
}
