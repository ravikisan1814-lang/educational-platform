"use client";

import { useEffect, useRef, useState } from "react";

interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  subject: string;
}

/**
 * Demo question bank sourced from the platform's educational content
 * (Physics, Chemistry, Biology, Mathematics). In a live deployment this
 * could be fetched from /api/contents, but demo data keeps the quiz
 * deterministic and offline-friendly.
 */
const DEMO_QUESTIONS: QuizQuestion[] = [
  {
    question: "What is the SI unit of force?",
    options: ["Joule", "Newton", "Watt", "Pascal"],
    answerIndex: 1,
    subject: "Physics",
  },
  {
    question: "Which gas is most abundant in Earth's atmosphere?",
    options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"],
    answerIndex: 2,
    subject: "Chemistry",
  },
  {
    question: "What is the powerhouse of the cell?",
    options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
    answerIndex: 2,
    subject: "Biology",
  },
  {
    question: "What is the derivative of x²?",
    options: ["x", "2x", "x²", "2"],
    answerIndex: 1,
    subject: "Mathematics",
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Jupiter", "Mars", "Saturn"],
    answerIndex: 2,
    subject: "Physics",
  },
  {
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    answerIndex: 2,
    subject: "Chemistry",
  },
];

const QUESTION_TIME_SECONDS = 4;
const HISTORY_KEY = "eduplatform-quiz-history";
const MAX_HISTORY = 10;

interface QuizHistoryEntry {
  score: number;
  total: number;
  date: string;
}

/**
 * Quick quiz card for the home page.
 *
 * - Shows one multiple-choice question at a time (4 options).
 * - 4-second countdown timer per question.
 * - Auto-advances to the next question after an answer or timeout.
 * - Saves quiz history (score, date) to localStorage, keeping the last 10.
 */
export default function QuickQuiz() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [history, setHistory] = useState<QuizHistoryEntry[]>([]);
  const timeoutHandledRef = useRef(false);

  const question = DEMO_QUESTIONS[currentIndex];
  const isLast = currentIndex === DEMO_QUESTIONS.length - 1;

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored) as QuizHistoryEntry[]);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Countdown timer — resets on each new question
  useEffect(() => {
    if (answered) return;
    timeoutHandledRef.current = false;
    setTimeLeft(QUESTION_TIME_SECONDS);
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentIndex, answered]);

  // Keep a ref to the latest recordAnswer so the timeout effect never
  // captures a stale closure.
  const recordAnswerRef = useRef<(index: number | null) => void>(() => {});
  recordAnswerRef.current = recordAnswer;

  // Auto-advance on timeout
  useEffect(() => {
    if (answered || timeoutHandledRef.current) return;
    if (timeLeft === 0) {
      timeoutHandledRef.current = true;
      recordAnswerRef.current(null);
    }
  }, [timeLeft, answered]);

  // Auto-advance after answering (brief feedback pause)
  useEffect(() => {
    if (!answered) return;
    const t = setTimeout(() => {
      if (isLast) {
        // Quiz complete — restart from the first question
        setCurrentIndex(0);
        setScore(0);
      } else {
        setCurrentIndex((i) => i + 1);
      }
      setSelected(null);
      setAnswered(false);
    }, 1500);
    return () => clearTimeout(t);
  }, [answered, isLast]);

  function recordAnswer(selectedIndex: number | null) {
    if (answered) return;
    setAnswered(true);
    setSelected(selectedIndex);
    const isCorrect =
      selectedIndex !== null && selectedIndex === question.answerIndex;
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);

    // Save history entry (score, date) — keep the last 10 results
    const entry: QuizHistoryEntry = {
      score: newScore,
      total: currentIndex + 1,
      date: new Date().toISOString(),
    };
    const nextHistory = [entry, ...history].slice(0, MAX_HISTORY);
    setHistory(nextHistory);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
    } catch {
      // ignore storage errors
    }
  }

  function handleSelect(index: number) {
    if (answered) return;
    recordAnswer(index);
  }

  return (
    <section className="content-section quiz-section" data-testid="quick-quiz">
      <h2>Quick Quiz</h2>
      <p className="quiz-sub">
        Test yourself — one question at a time, {QUESTION_TIME_SECONDS} seconds
        each.
      </p>

      <div className="quiz-card card">
        <div className="quiz-meta">
          <span className="quiz-subject">{question.subject}</span>
          <span className="quiz-progress">
            {currentIndex + 1} / {DEMO_QUESTIONS.length}
          </span>
        </div>

        <div
          className="quiz-timer"
          role="timer"
          aria-label={`${timeLeft} seconds remaining`}
        >
          <span
            className="quiz-timer-bar"
            style={{
              width: `${(timeLeft / QUESTION_TIME_SECONDS) * 100}%`,
            }}
          />
          <span className="quiz-timer-text">{timeLeft}s</span>
        </div>

        <h3 className="quiz-question">{question.question}</h3>

        <div className="quiz-options">
          {question.options.map((option, index) => {
            let className = "quiz-option";
            if (answered) {
              if (index === question.answerIndex) {
                className += " quiz-option-correct";
              } else if (index === selected) {
                className += " quiz-option-wrong";
              } else {
                className += " quiz-option-dim";
              }
            }
            return (
              <button
                key={index}
                type="button"
                className={className}
                onClick={() => handleSelect(index)}
                disabled={answered}
              >
                <span className="quiz-option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </button>
            );
          })}
        </div>

        {answered && (
          <p className="quiz-feedback">
            {selected === question.answerIndex
              ? "Correct! 🎉"
              : selected === null
              ? "Time's up!"
              : "Not quite."}
          </p>
        )}

        {history.length > 0 && (
          <div className="quiz-history">
            <h4>Recent results</h4>
            <ul>
              {history.slice(0, 5).map((entry, i) => (
                <li key={i}>
                  {new Date(entry.date).toLocaleDateString()} — {entry.score}/
                  {entry.total}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}