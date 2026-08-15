"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import GlobalSearch from "./GlobalSearch";
import { createClient } from "@/lib/supabase/client";
import { ACCESS_LEVEL_LABELS } from "@/lib/types";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/info", label: "Information" },
];

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [session, setSession] = useState<{ email: string; access_level: number } | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data }) => {
        if (!cancelled && data.session?.user) {
          setSession({
            email: data.session.user.email ?? "",
            access_level: 4,
          });
        }
      });
    } catch {
      // Env vars not configured — run in signed-out mode.
    }
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
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
        EduPlatform
      </Link>
      <GlobalSearch />
      <nav
        id="site-nav"
        aria-label="Primary"
        className={`site-nav${open ? " site-nav-open" : ""}`}
      >
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="nav-link">
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <ThemeToggle />
        {!session ? (
          <>
            <Link href="/login" className="btn-upgrade" style={{ background: "var(--accent)" }}>
              Sign in
            </Link>
          </>
        ) : (
          <>
            <a
              href="mailto:ravikisan1814@gmail.com"
              className="btn-upgrade"
              title="Contact owner for premium access"
            >
              Upgrade to Premium
            </a>
            <div className="profile-menu" ref={profileRef}>
              <button
                type="button"
                className="profile-trigger"
                aria-label="Profile menu"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((value) => !value)}
              >
                <span className="avatar" aria-hidden="true">
                  {session.email?.[0]?.toUpperCase() ?? "U"}
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{tierLabel}</span>
                <ChevronDownIcon />
              </button>
              {profileOpen && (
                <div className="profile-dropdown">
                  <div style={{ padding: "0.5rem 0.7rem", fontSize: "0.82rem", color: "var(--muted)" }}>
                    {session.email}
                  </div>
                  {isOwner && (
                    <Link href="/admin" onClick={() => setProfileOpen(false)}>
                      Member management
                    </Link>
                  )}
                  <button
                    type="button"
                    className="profile-logout"
                    onClick={handleSignOut}
                  >
                    Sign out
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
          onClick={() => setOpen((value) => !value)}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
      </div>
    </header>
  );
}
