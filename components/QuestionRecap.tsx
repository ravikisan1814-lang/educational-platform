"use client";

import { useEffect, useState } from "react";

interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  subject: string;
  answer: string;
}

export default function QuestionRecap() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [selected, setSelected] = useState<Record<number, number>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/quiz");
        const json = await res.json();
        if (json.data) {
          setQuestions(json.data);
        }
      } catch {
        // ignore — show empty state
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  function handleSelect(questionIndex: number, optionIndex: number) {
    if (showAnswers) return;
    setSelected((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  }

  function getUserAnswer(questionIndex: number): number | undefined {
    return selected[questionIndex];
  }

  if (loading) {
    return (
      <section className="content-section quiz-section" data-testid="question-recap">
        <h2>Question Recap</h2>
        <div className="quiz-card card">
          <div className="card-skeleton" />
          <div className="card-skeleton" />
          <div className="card-skeleton" />
        </div>
      </section>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  return (
    <section className="content-section quiz-section" data-testid="question-recap">
      <h2>Question Recap</h2>
      <p className="quiz-sub">
        Test yourself — {questions.length} questions from the platform content. Select your answer, then reveal the correct answers at the end.
      </p>

      <div className="quiz-card card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
          {!showAnswers ? (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowAnswers(true)}
              disabled={Object.keys(selected).length === 0}
            >
              Show Answers
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setShowAnswers(false);
                setSelected({});
              }}
            >
              Retry
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {questions.map((q, idx) => {
            const userAnswer = getUserAnswer(idx);
            const isCorrect = showAnswers && userAnswer === q.answerIndex;
            const isWrong = showAnswers && userAnswer !== undefined && userAnswer !== q.answerIndex;

            return (
              <div key={idx} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <span className="quiz-subject">{q.subject}</span>
                  <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                    Q{idx + 1}
                  </span>
                  {showAnswers && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: isCorrect ? "#166534" : isWrong ? "#991b1b" : "var(--muted)",
                      }}
                    >
                      {isCorrect ? "Correct" : isWrong ? "Wrong" : "Skipped"}
                    </span>
                  )}
                </div>

                <h3 className="quiz-question" style={{ marginBottom: "0.75rem" }}>
                  {q.question}
                </h3>

                <div className="quiz-options">
                  {q.options.map((option, optIdx) => {
                    let className = "quiz-option";
                    if (showAnswers) {
                      if (optIdx === q.answerIndex) {
                        className += " quiz-option-correct";
                      } else if (optIdx === userAnswer) {
                        className += " quiz-option-wrong";
                      } else {
                        className += " quiz-option-dim";
                      }
                    }
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        className={className}
                        onClick={() => handleSelect(idx, optIdx)}
                        disabled={showAnswers}
                      >
                        <span className="quiz-option-letter">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        {option}
                      </button>
                    );
                  })}
                </div>

                {showAnswers && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      padding: "0.5rem 0.75rem",
                      borderRadius: 8,
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      fontSize: "0.9rem",
                    }}
                  >
                    <strong>Answer:</strong> {q.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
