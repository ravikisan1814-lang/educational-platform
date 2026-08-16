"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ACCESS_LEVEL_LABELS } from "@/lib/types";
import ThemeToggle from "./ThemeToggle";
import GlobalSearch from "./GlobalSearch";

const OWNER_EMAIL = "ravikisan1814@gmail.com";
const UPGRADE_MAILTO = `mailto:${OWNER_EMAIL}?subject=Upgrade%20to%20Premium`;

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/info", label: "Rules & Notices" },
];

interface SessionUser {
  id: string;
  email: string;
  access_level: number;
  status: string | null;
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function SiteHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    async function refresh() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser?.email) {
        setUser(null);
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("access_level, status")
        .eq("id", authUser.id)
        .maybeSingle();
      setUser({
        id: authUser.id,
        email: authUser.email,
        access_level: profile?.access_level ?? 4,
        status: profile?.status ?? null,
      });
      setLoading(false);
    }

    void refresh();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => subscription.unsubscribe();
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

  async function handleSignOut() {
    setProfileOpen(false);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
    } finally {
      setUser(null);
      router.refresh();
    }
  }

  const approved = user !== null && user.status === "approved";
  const pending = user !== null && user.status === "pending";
  const isOwner = approved && user.access_level === 1;
  const initials = user ? (user.email[0] ?? "?").toUpperCase() : "?";

  return (
    <header className="site-header">
      <Link href="/" className="brand brand-ravikisan">
        Ravikisan&apos;s Platform
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
        <Link href="/graphs" className="nav-link">
          Graphs
        </Link>
        {!loading && !approved && !pending && (
          <Link href="/login" className="nav-link nav-link-login">
            Login
          </Link>
        )}
      </nav>

      <div className="header-actions">
        <ThemeToggle />
        <a href={UPGRADE_MAILTO} className="btn-upgrade btn-upgrade-yellow">
          Upgrade to Premium
        </a>
        {loading ? null : approved ? (
          <div className="profile-menu" ref={profileRef}>
            <button
              type="button"
              className="profile-trigger"
              aria-label="Profile menu"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((v) => !v)}
            >
              <span className="avatar" aria-hidden="true">
                {initials}
              </span>
              <ChevronDownIcon />
            </button>
            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-head">
                  <span className="profile-email">{user.email}</span>
                  <span className="profile-tier">
                    {ACCESS_LEVEL_LABELS[(user.access_level as 1 | 2 | 3 | 4) ?? 4]}
                  </span>
                </div>
                {isOwner && (
                  <Link href="/admin" onClick={() => setProfileOpen(false)}>
                    Owner dashboard
                  </Link>
                )}
                <Link href="/info" onClick={() => setProfileOpen(false)}>
                  Rules &amp; Notices
                </Link>
                <a href={UPGRADE_MAILTO} onClick={() => setProfileOpen(false)}>
                  Upgrade to Premium
                </a>
                <button type="button" className="profile-logout" onClick={() => void handleSignOut()}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : pending ? (
          <span className="header-pending" title="Owner approval required before full access">
            Pending approval
          </span>
        ) : null}
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
