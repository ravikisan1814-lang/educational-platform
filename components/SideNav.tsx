"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/learn", label: "Learn", icon: "📚" },
  { href: "/content", label: "Content", icon: "📖" },
  { href: "/info", label: "Information", icon: "ℹ️" },
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="side-nav">
      <div className="side-nav-header">
        <Link href="/" className="side-nav-brand">
          <span className="brand-icon">🎓</span>
          <span className="brand-text">EduPlatform</span>
        </Link>
      </div>

      <ul className="side-nav-list">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/" && pathname.startsWith(item.href));
          
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`side-nav-item${isActive ? " active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {isActive && <span className="nav-indicator" />}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="side-nav-footer">
        <p className="side-nav-tagline">Learn • Explore • Master</p>
      </div>
    </nav>
  );
}
