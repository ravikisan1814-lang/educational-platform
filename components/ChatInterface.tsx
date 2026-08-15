"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

/** Turn markdown [text](/path) into clickable links. */
function renderContent(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (match) {
      const [, label, href] = match;
      if (href.startsWith("/")) {
        return (
          <a key={i} href={href} className="ai-chat-link">
            {label}
          </a>
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

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.data.content as string },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Study assistant</h2>
        <p className="chat-subtitle">
          Ask about syllabus topics on this site — answers include named links.
        </p>
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <p>
              Try: &ldquo;Where are Class 11 Physics notes?&rdquo; or &ldquo;Link me to
              Loksewa topics.&rdquo;
            </p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`message message-${msg.role}`}>
            <div className="message-badge">{msg.role === "user" ? "You" : "Assistant"}</div>
            <div className="message-content">{renderContent(msg.content)}</div>
          </div>
        ))}
        {loading && (
          <div className="message message-assistant">
            <div className="message-badge">Assistant</div>
            <div className="message-content loading">Thinking...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && <div className="chat-error">{error}</div>}

      <form className="chat-input-form" onSubmit={(e) => void handleSend(e)}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a subject or topic on this site…"
          disabled={loading}
          className="chat-input"
        />
        <button type="submit" disabled={loading || !input.trim()} className="btn btn-primary">
          Send
        </button>
      </form>
    </div>
  );
}
