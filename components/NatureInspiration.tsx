"use client";

import { useEffect, useState } from "react";

const NATURE_LINES = [
  "The forest teaches patience — every seed waits for its season.",
  "Rivers never rush their journey; they simply keep moving forward.",
  "Mountains remind us: the view is worth every step of the climb.",
  "Morning dew on a leaf — small wonders hold the deepest lessons.",
  "A tree grows in silence; your progress need not be loud to be real.",
  "Stars appear only when the sky grows dark — keep going.",
  "Every sunset promises a fresh dawn for those who rest and rise again.",
];

export default function NatureInspiration() {
  const [lineIndex, setLineIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setLineIndex((i) => (i + 1) % NATURE_LINES.length);
        setVisible(true);
      }, 400);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="nature-inspire" aria-live="polite">
      <div className="nature-inspire-inner">
        <span className="nature-inspire-icon" aria-hidden="true">
          🌿
        </span>
        <p className={`nature-inspire-line${visible ? " nature-inspire-line--visible" : ""}`}>
          {NATURE_LINES[lineIndex]}
        </p>
      </div>
    </section>
  );
}
