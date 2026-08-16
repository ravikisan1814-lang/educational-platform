"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const VISITOR_LIMIT = 2;

function cleanAiText(text: string): string {
  const links: string[] = [];
  let preserved = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match) => {
    links.push(match);
    return `__LINK_${links.length - 1}__`;
  });

  preserved = preserved
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/```/g, "")
    .replace(/`/g, "")
    .replace(/~~/g, "")
    .replace(/^>\s+/gm, "");

  preserved = preserved.replace(/__LINK_(\d+)__/g, (_, i) => links[Number(i)]);

  return preserved.trim();
}

/** Turn markdown [text](/path) into clickable Next.js links. */
function renderContent(text: string) {
  const cleaned = cleanAiText(text);
  const parts = cleaned.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (match) {
      const [, label, href] = match;
      if (href.startsWith("/")) {
        return (
          <Link key={i} href={href} className="ai-chat-link">
            {label}
          </Link>
        );
      }
      return (
        <a key={i} href={href} className="ai-chat-link" target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: cleanAiText(
        "Hi! I can help you find syllabus topics, notes, and study material on Ravikisan's Platform. Ask me about Class 11, Class 12, or Knowledge sections."
      ),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visitorCount, setVisitorCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setLimitReached(false);
      }
    });
  }, [open]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const nextCount = visitorCount + 1;
      setVisitorCount(nextCount);
      if (nextCount >= VISITOR_LIMIT) {
        setLimitReached(true);
      }
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: cleanAiText(json.data.content as string) },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach AI");
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || !input.trim() || (!limitReached && visitorCount >= VISITOR_LIMIT);

  return (
    <div className={`ai-chat-widget${open ? " ai-chat-widget--open" : ""}`}>
      {open && (
        <div className="ai-chat-panel" role="dialog" aria-label="Platform assistant">
          <header className="ai-chat-panel-head">
            <span>Study assistant</span>
            <button
              type="button"
              className="ai-chat-close"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </header>
          <div className="ai-chat-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`ai-chat-bubble ai-chat-bubble--${msg.role}`}
              >
                {renderContent(msg.content)}
              </div>
            ))}
            {limitReached && (
              <div className="ai-chat-bubble ai-chat-bubble--assistant">
                <p>You have reached the free trial limit of {VISITOR_LIMIT} messages.</p>
                <p>
                  <Link href="/login" className="ai-chat-link">Sign in</Link> to continue using the assistant.
                </p>
              </div>
            )}
            {loading && (
              <div className="ai-chat-bubble ai-chat-bubble--assistant ai-chat-typing">
                Thinking…
              </div>
            )}
            {error && <p className="ai-chat-error">{error}</p>}
            <div ref={endRef} />
          </div>
          <form className="ai-chat-form" onSubmit={(e) => void handleSend(e)}>
            <input
              type="text"
              className="ai-chat-input"
              placeholder={limitReached ? "Sign in to continue chatting…" : "Ask about syllabus or notes…"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || limitReached}
            />
            <button type="submit" className="btn btn-primary" disabled={disabled}>
              Send
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        className="ai-chat-fab"
        aria-label={open ? "Close study assistant" : "Open study assistant"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}
