"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import GlobalSearch from "./GlobalSearch";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/learn", label: "Learn" },
  { href: "/#contents", label: "Contents" },
  { href: "/#upgrade", label: "Pricing" },
  { href: "/#contact", label: "Contact" },
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
  const profileRef = useRef<HTMLDivElement>(null);

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
        <button
          type="button"
          className="icon-btn"
          aria-label="Notifications"
          title="Notifications"
        >
          <BellIcon />
          <span className="icon-badge" aria-hidden="true">
            3
          </span>
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Saved items"
          title="Saved"
        >
          <BookmarkIcon />
        </button>
        <Link href="/#upgrade" className="btn-upgrade">
          Upgrade to Premium
        </Link>
        <div className="profile-menu" ref={profileRef}>
          <button
            type="button"
            className="profile-trigger"
            aria-label="Profile menu"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((value) => !value)}
          >
            <span className="avatar" aria-hidden="true">
              R
            </span>
            <ChevronDownIcon />
          </button>
          {profileOpen && (
            <div className="profile-dropdown">
              <Link href="/#contact" onClick={() => setProfileOpen(false)}>
                Profile
              </Link>
              <Link href="/#contact" onClick={() => setProfileOpen(false)}>
                Settings
              </Link>
              <Link href="/#upgrade" onClick={() => setProfileOpen(false)}>
                Upgrade to Premium
              </Link>
              <button
                type="button"
                className="profile-logout"
                onClick={() => setProfileOpen(false)}
              >
                Logout
              </button>
            </div>
          )}
        </div>
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