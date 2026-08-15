"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "error" | "info"; text: string } | null>(
    null
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (!res.ok) {
        setNotice({ kind: "error", text: json.error ?? "Something went wrong" });
        return;
      }

      if (mode === "signup") {
        setNotice({
          kind: "info",
          text: "Account created. Your access is enabled only after the owner approves you — contact the owner at ravikisan1814@gmail.com.",
        });
        setMode("signin");
        setPassword("");
        return;
      }

      const profile = json.data?.profile;
      if (profile && profile.status !== "approved") {
        setNotice({
          kind: "info",
          text: "Signed in, but your account is still waiting for the owner's approval. Until then you can browse the free public content only — contact the owner at ravikisan1814@gmail.com.",
        });
      }
      router.push("/learn");
      router.refresh();
    } catch {
      setNotice({ kind: "error", text: "Network error — please try again" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <h1>EduPlatform access</h1>
        <p>
          Sign in to read your purchased content. Login access is enabled
          only after the owner&apos;s approval — see the{" "}
          <Link href="/info">rules &amp; notices</Link> page for how this
          website works.
        </p>
      </div>

      <div className="auth-card" data-testid="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Auth mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
            className={mode === "signin" ? "auth-tab auth-tab-active" : "auth-tab"}
            onClick={() => {
              setMode("signin");
              setNotice(null);
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            className={mode === "signup" ? "auth-tab auth-tab-active" : "auth-tab"}
            onClick={() => {
              setMode("signup");
              setNotice(null);
            }}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              placeholder="••••••••"
            />
          </label>
          <button type="submit" className="btn btn-primary auth-submit" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : "Create account (pending approval)"}
          </button>
        </form>

        {notice && (
          <p
            className={`auth-notice ${notice.kind === "error" ? "auth-notice-error" : ""}`}
            role={notice.kind === "error" ? "alert" : "status"}
          >
            {notice.text}
          </p>
        )}

        <p className="auth-contact">
          Login is shown on the site only after the owner&apos;s approval.
          To know how this website works, contact the owner directly:{" "}
          <a href="mailto:ravikisan1814@gmail.com">ravikisan1814@gmail.com</a>
        </p>
      </div>
    </div>
  );
}