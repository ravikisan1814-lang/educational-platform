"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import GlobalSearch from "./GlobalSearch";
import { createClient } from "@/lib/supabase/client";
import { ACCESS_LEVEL_LABELS } from "@/lib/types";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/learn", label: "Learn", icon: "📚" },
  { href: "/content", label: "Content", icon: "📖" },
  { href: "/info", label: "Information", icon: "ℹ️" },
];

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [session, setSession] = useState<{ email: string; access_level: number; full_name: string } | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(async ({ data }) => {
        if (!cancelled && data.session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("access_level, full_name")
            .eq("id", data.session.user.id)
            .single();
          setSession({
            email: data.session.user.email ?? "",
            access_level: profile?.access_level ?? 4,
            full_name: profile?.full_name ?? "",
          });
        }
      });
    } catch {
      // Env vars not configured - run in signed-out mode
    }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await fetch("/api/auth/signout", { method: "POST" });
    await supabase.auth.signOut();
    setSession(null);
    setProfileOpen(false);
    window.location.href = "/";
  }, []);

  const isOwner = session?.access_level === 1;
  const tierLabel = session
    ? ACCESS_LEVEL_LABELS[session.access_level as keyof typeof ACCESS_LEVEL_LABELS] ?? "Public"
    : "Public";

  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <span className="brand-icon">🎓</span>
        <span className="brand-text">EduPlatform</span>
      </Link>

      <nav id="site-nav" aria-label="Primary" className={`site-nav${open ? " site-nav-open" : ""}`}>
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="nav-link">
            <span className="nav-icon">{link.icon}</span>
            <span className="nav-label">{link.label}</span>
          </Link>
        ))}
      </nav>

      <GlobalSearch />

      <div className="header-actions">
        <ThemeToggle />

        {!session ? (
          <>
            <Link href="/login" className="btn btn-secondary btn-sm">
              Sign In
            </Link>
            <Link href="/signup" className="btn btn-primary btn-sm">
              Get Started
            </Link>
          </>
        ) : (
          <>
            <button type="button" className="icon-btn" aria-label="Bookmarks" title="Bookmarks">
              <BookmarkIcon />
            </button>

            <div className="profile-menu" ref={profileRef}>
              <button
                type="button"
                className="profile-trigger"
                aria-label="Profile menu"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((v) => !v)}
              >
                <span className="avatar">{session.full_name?.[0]?.toUpperCase() ?? session.email?.[0]?.toUpperCase() ?? "U"}</span>
                <span className="profile-name">{session.full_name || session.email.split("@")[0]}</span>
                <ChevronDownIcon />
              </button>

              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-header">
                    <span className="profile-email">{session.email}</span>
                    <span className="profile-tier">{tierLabel}</span>
                  </div>
                  {isOwner && (
                    <Link href="/admin" onClick={() => setProfileOpen(false)}>
                      Admin Panel
                    </Link>
                  )}
                  <Link href="/bookmarks" onClick={() => setProfileOpen(false)}>
                    My Bookmarks
                  </Link>
                  <button type="button" className="profile-logout" onClick={handleSignOut}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        <button
          type="button"
          className="hamburger"
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
      </div>
    </header>
  );
}
