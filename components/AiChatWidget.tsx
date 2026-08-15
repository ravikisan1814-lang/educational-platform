"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const WELCOME_MESSAGE =
  "👋 Hi! I'm the EduPlatform assistant. Ask me about any chapter, topic, or note on this site — I'll give you a direct link to it.";
const WELCOME_HINT = 'Try: "Where can I find Vector Addition notes?"';

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatResponse {
  data?: {
    content: string;
    provider: string;
    model: string;
  };
  error?: string;
}

/**
 * Floating AI chat widget (bottom-right corner, all pages).
 *
 * - Opens a chat panel with a message history.
 * - Sends messages to POST /api/ai/chat which injects the full syllabus map
 *   (with /learn/ URLs) into the system prompt so the AI can answer questions
 *   about the website content and return clickable links to chapters, topics
 *   and notes.
 * - The AI is restricted to platform-only questions; out-of-scope queries get
 *   the "official site" fallback reply.
 * - Renders markdown links ([text](/path)) as clickable Next.js <Link>s.
 */
export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to the latest message.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Focus the input when the panel opens.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

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
      const json = (await res.json()) as ChatResponse;
      if (!res.ok) {
        throw new Error(json.error ?? `API responded with ${res.status}`);
      }
      const reply = json.data?.content ?? "";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get a reply");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-chat" data-testid="ai-chat">
      {open && (
        <div className="ai-chat-panel" data-testid="ai-chat-panel">
          <header className="ai-chat-header">
            <div className="ai-chat-title">
              <span className="ai-chat-avatar" aria-hidden="true">
                ✦
              </span>
              <div>
                <strong>EduPlatform AI</strong>
                <span className="ai-chat-sub">Ask about syllabus, notes & topics</span>
              </div>
            </div>
            <button
              type="button"
              className="ai-chat-close"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </header>

          <div className="ai-chat-messages" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="ai-chat-welcome">
                <p>{WELCOME_MESSAGE}</p>
                <p className="ai-chat-hint">{WELCOME_HINT}</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`ai-chat-msg ai-chat-msg-${msg.role}`}
                >
                  <MarkdownText content={msg.content} />
                </div>
              ))
            )}
            {loading && (
              <div className="ai-chat-msg ai-chat-msg-assistant ai-chat-typing">
                <span className="ai-chat-dot" />
                <span className="ai-chat-dot" />
                <span className="ai-chat-dot" />
              </div>
            )}
            {error && <p className="ai-chat-error">{error}</p>}
          </div>

          <form
            className="ai-chat-form"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className="ai-chat-input"
              placeholder="Ask about a chapter, topic or note..."
              aria-label="Ask the AI assistant"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="ai-chat-send"
              aria-label="Send message"
              disabled={loading || input.trim().length === 0}
            >
              ➤
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="ai-chat-fab"
        aria-label={open ? "Close AI chat" : "Open AI chat"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "✕" : "✦"}
      </button>
    </div>
  );
}

/**
 * Renders a chat message, converting markdown links ([text](/path)) into
 * clickable Next.js <Link>s. Plain text is preserved.
 */
function MarkdownText({ content }: { content: string }) {
  const parts = content.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (match) {
          const [, label, href] = match;
          // Only render internal /learn or /catalog links as Next.js Links;
          // external links open in a new tab.
          if (href.startsWith("/")) {
            return (
              <Link key={index} href={href} className="ai-chat-link">
                {label}
              </Link>
            );
          }
          return (
            <a
              key={index}
              href={href}
              className="ai-chat-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {label}
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}