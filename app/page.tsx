"use client";

import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NatureInspiration from "@/components/NatureInspiration";
import HomeDashboard from "@/components/HomeDashboard";
import { type DashboardViewId } from "@/lib/dashboard-structure";

export default function Home() {
  const [view, setView] = useState<DashboardViewId>("home");

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="home-main">
        <NatureInspiration />
        <HomeDashboard view={view} onChangeView={setView} />
      </main>
      {view === "home" && <SiteFooter />}
    </div>
  );
}
