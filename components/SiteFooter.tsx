"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const OWNER_EMAIL = "ravikisan1814@gmail.com";

const MOOD_LINES = [
  "Take a breath — learning is a marathon, not a sprint.",
  "Every expert was once a beginner who refused to quit.",
  "Your effort today becomes your confidence tomorrow.",
  "Small steps through the syllabus add up to big results.",
];

const INSPIRATION_QUOTES = [
  "The forest teaches patience — every seed waits for its season.",
  "Rivers never rush their journey; they simply keep moving forward.",
  "Mountains remind us: the view is worth every step of the climb.",
  "Morning dew on a leaf — small wonders hold the deepest lessons.",
  "A tree grows in silence; your progress need not be loud to be real.",
  "Stars appear only when the sky grows dark — keep going.",
  "Every sunset promises a fresh dawn for those who rest and rise again.",
  "Discipline is choosing between what you want now and what you want most.",
  "Your comfort zone is a beautiful place, but nothing ever grows there.",
  "Mistakes are proof that you are trying.",
  "Fall seven times, stand up eight.",
  "Don’t watch the clock; do what it does. Keep going.",
  "Success is the sum of small efforts repeated day in and day out.",
  "The harder you work for something, the greater you’ll feel when you achieve it.",
  "Dream big. Start small. Act now.",
  "One day, all your hard work will pay off.",
  "Focus on the step in front of you, not the whole staircase.",
  "You don’t have to be great to start, but you have to start to be great.",
  "Push yourself because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "The secret of getting ahead is getting started.",
  "Don’t stop when you’re tired. Stop when you’re done.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Do it with passion or not at all.",
  "A little progress each day adds up to big results.",
];

/**
 * Footer shown ONLY on the home page.
 */
export default function SiteFooter() {
  const moodLine = MOOD_LINES[new Date().getDate() % MOOD_LINES.length];

  return (
    <footer className="site-footer site-footer-rich">
      <div className="footer-inner">
        <p className="footer-made-with">
          Made with curiosity by <span className="footer-glow-link">Ravikisan</span>
        </p>

        <section className="footer-inspiration" aria-label="Inspiration">
          <div className="footer-inspiration-track">
            <InspirationTicker quotes={INSPIRATION_QUOTES} />
          </div>
        </section>

        <p className="footer-mood">{moodLine}</p>

        <section className="footer-block">
          <h3 className="footer-block-title">Academic Compliance</h3>
          <p className="footer-block-text">
            This platform strictly adheres to the latest curriculum, guidelines,
            and evaluation standards set by the National Examinations Board (NEB)
            and the Curriculum Development Centre (CDC), Nepal.
          </p>
        </section>

        <section className="footer-block">
          <h3 className="footer-block-title">Contact &amp; Support</h3>
          <p className="footer-block-text">
            Have questions or feedback? Reach out to us at{" "}
            <a href={`mailto:${OWNER_EMAIL}`} className="footer-glow-link">
              {OWNER_EMAIL}
            </a>
            .
          </p>
        </section>

        <p className="footer-designed footer-glow-text">
          Designed and developed by Ravikishan
        </p>

        <p className="footer-power footer-glow-italic">
          <em>Knowledge is power</em>
        </p>

        <nav className="footer-nav" aria-label="Footer">
          <Link href="/">Home</Link>
          <Link href={`mailto:${OWNER_EMAIL}`}>Contact</Link>
        </nav>
      </div>
    </footer>
  );
}

function InspirationTicker({ quotes }: { quotes: string[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % quotes.length);
        setVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  return (
    <div className="inspiration-ticker" aria-live="polite">
      <blockquote
        className={`inspiration-quote${visible ? " inspiration-quote--visible" : " inspiration-quote--hidden"}`}
      >
        {quotes[index]}
      </blockquote>
    </div>
  );
}
