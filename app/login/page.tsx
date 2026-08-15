"use client";

import { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

const OWNER_CONTACT = "ravikisan1814@gmail.com";

type Tab = "signin" | "signup";

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPending(false);

    const endpoint = tab === "signin" ? "/api/auth/signin" : "/api/auth/signup";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong");
        return;
      }

      if (tab === "signup") {
        setPending(true);
        setPassword("");
        return;
      }

      if (json.error === "pending") {
        setPending(true);
        setError(null);
        return;
      }

      if (tab === "signin" && json.ok) {
        window.location.href = "/learn";
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="content-section" style={{ maxWidth: 420, margin: "2rem auto" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h1 style={{ margin: "0 0 1rem", fontSize: "1.4rem" }}>Welcome</h1>

          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
            <button
              type="button"
              className={`btn ${tab === "signin" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => { setTab("signin"); setError(null); setPending(false); }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`btn ${tab === "signup" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => { setTab("signup"); setError(null); setPending(false); }}
            >
              Create account
            </button>
          </div>

          {pending ? (
            <div style={{ textAlign: "center", color: "var(--muted)" }}>
              <p style={{ margin: "0 0 0.5rem", fontWeight: 600 }}>
                {tab === "signup"
                  ? "Account created — pending approval"
                  : "Login enabled only after owner approval"}
              </p>
              <p style={{ margin: "0 0 1rem", fontSize: "0.9rem" }}>
                Contact <a href={`mailto:${OWNER_CONTACT}`}>{OWNER_CONTACT}</a> to get access.
              </p>
              <Link href="/" className="btn btn-secondary">
                Back to home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--fg)",
                  fontSize: "0.95rem",
                }}
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.8rem",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--fg)",
                  fontSize: "0.95rem",
                }}
              />
              {error && (
                <p style={{ margin: 0, color: "#dc2626", fontSize: "0.9rem" }}>{error}</p>
              )}
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Please wait..." : tab === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
