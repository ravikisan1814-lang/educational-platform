"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CORE_SUBJECTS,
  DASHBOARD_PILLARS,
  DASHBOARD_VIEWS,
  subjectLearnHref,
  trackLearnHref,
  type DashboardTrack,
  type DashboardViewId,
} from "@/lib/dashboard-structure";

function TrackBlock({ track }: { track: DashboardTrack }) {
  const [open, setOpen] = useState(false);

  if (track.directLink) {
    return (
      <div className="dash-track">
        <Link href={trackLearnHref(track)} className="dash-track-head dash-track-head--link">
          {track.label}
          <span className="dash-track-arrow" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className={`dash-track${open ? " dash-track--open" : ""}`}>
      <button
        type="button"
        className="dash-track-head"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {track.label}
        <span className="dash-track-caret" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <div className="dash-subject-grid">
          {CORE_SUBJECTS.map((subject) => (
            <Link
              key={subject.slug}
              href={subjectLearnHref(track.examGroupSlug, subject.slug)}
              className="dash-subject-card"
            >
              {subject.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function PillarSection({
  title,
  tracks,
}: {
  title: string;
  tracks: DashboardTrack[];
}) {
  const [open, setOpen] = useState(true);

  return (
    <section className="dash-pillar">
      <button
        type="button"
        className="dash-pillar-title"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <span className="dash-pillar-caret" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <div className="dash-tracks">
          {tracks.map((track) => (
            <TrackBlock key={track.examGroupSlug + track.label} track={track} />
          ))}
        </div>
      )}
    </section>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <div className="coming-soon">
      <span>{label} — coming soon</span>
    </div>
  );
}

export default function HomeDashboard() {
  const [view, setView] = useState<DashboardViewId>("home");

  return (
    <div className="home-dashboard">
      <div className="dash-switcher" role="tablist" aria-label="Dashboard views">
        {DASHBOARD_VIEWS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={view === item.id}
            className={`dash-switch${view === item.id ? " dash-switch--active" : ""}`}
            onClick={() => setView(item.id)}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {view === "home" && (
        <div className="dash-pillars">
          {DASHBOARD_PILLARS.map((pillar) => (
            <PillarSection key={pillar.id} title={pillar.title} tracks={pillar.tracks} />
          ))}
        </div>
      )}

      {view === "notes" && (
        <div className="dash-notes">
          <h2 className="dash-view-title">All Notes</h2>
          <p className="dash-view-sub">Browse published notes across every class and subject.</p>
          <div className="dash-notes-grid">
            {DASHBOARD_PILLARS.flatMap((pillar) =>
              pillar.tracks.map((track) => (
                <Link
                  key={track.examGroupSlug}
                  href={trackLearnHref(track)}
                  className="dash-note-card"
                >
                  <span className="dash-note-pillar">{pillar.title}</span>
                  <span className="dash-note-track">{track.label}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {view === "syllabus" && (
        <div className="dash-syllabus">
          <h2 className="dash-view-title">Syllabus Overview</h2>
          <p className="dash-view-sub">Exam group → subject → chapter → topic map.</p>
          <Link href="/learn" className="btn btn-primary">Open syllabus explorer</Link>
        </div>
      )}

      {view === "favorites" && <ComingSoon label="Favorites" />}
      {view === "recent" && <ComingSoon label="Recent" />}
      {view === "official" && <ComingSoon label="Official notes" />}
    </div>
  );
}
