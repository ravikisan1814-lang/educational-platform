import type { Metadata } from "next";
import "./globals.css";
import SideNav from "@/components/SideNav";
import AiChatWidget from "@/components/AiChatWidget";

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})();`;

export const metadata: Metadata = {
  title: "Educational Platform",
  description: "8-Tier Educational Taxonomy System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <div className="app-layout">
          <SideNav />
          <main className="main-content">
            {children}
          </main>
        </div>
        <AiChatWidget />
      </body>
    </html>
  );
}
