import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NatureInspiration from "@/components/NatureInspiration";
import HomeDashboard from "@/components/HomeDashboard";

export const metadata = {
  title: "Ravikisan's Platform — NEB Class 11 & 12 Study Material",
  description:
    "Premium notes for Class 11, Class 12, Loksewa and general knowledge — aligned with NEB and CDC Nepal.",
};

export default function Home() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="home-main">
        <NatureInspiration />
        <HomeDashboard />
      </main>
      <SiteFooter />
    </div>
  );
}
