"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CORE_SUBJECTS,
  DASHBOARD_PILLARS,
  subjectLearnHref,
  trackLearnHref,
  type DashboardTrack,
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

export default function HomeDashboard() {
  return (
    <div className="home-dashboard">
      {DASHBOARD_PILLARS.map((pillar) => (
        <PillarSection key={pillar.id} title={pillar.title} tracks={pillar.tracks} />
      ))}
    </div>
  );
}
