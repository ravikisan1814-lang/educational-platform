"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Profile {
  id: string;
  email: string;
  status: string;
  access_level: number;
  approved_at: string | null;
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  pending: { bg: "#fef3c7", fg: "#92400e" },
  active: { bg: "#dcfce7", fg: "#166534" },
  rejected: { bg: "#fee2e2", fg: "#991b1b" },
  hold: { bg: "#ffedd5", fg: "#9a3412" },
};

export default function AdminPanel() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to load users");
      }
      setRows(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function updateUser(userId: string, patch: Partial<Pick<Profile, "status" | "access_level">>) {
    setSaving(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...patch }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Update failed");
      }
      setRows((prev) =>
        prev.map((r) => (r.id === userId ? { ...r, ...json.data } : r))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p style={{ color: "#dc2626", margin: "0 0 1rem", fontSize: "0.9rem" }}>{error}</p>
      )}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th style={{ textAlign: "left", padding: "0.6rem", color: "var(--muted)" }}>Email</th>
              <th style={{ textAlign: "left", padding: "0.6rem", color: "var(--muted)" }}>Status</th>
              <th style={{ textAlign: "left", padding: "0.6rem", color: "var(--muted)" }}>Tier</th>
              <th style={{ textAlign: "left", padding: "0.6rem", color: "var(--muted)" }}>Approved</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const statusColor = STATUS_COLORS[row.status] ?? STATUS_COLORS.pending;
              const isSaving = saving === row.id;
              return (
                <tr key={row.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.75rem 0.6rem" }}>{row.email}</td>
                  <td style={{ padding: "0.75rem 0.6rem" }}>
                    <select
                      value={row.status}
                      disabled={isSaving}
                      onChange={(e) =>
                        updateUser(row.id, { status: e.target.value })
                      }
                      style={{
                        padding: "0.35rem 0.5rem",
                        borderRadius: 6,
                        border: "1px solid var(--border)",
                        background: statusColor.bg,
                        color: statusColor.fg,
                        fontWeight: 600,
                        fontSize: "0.85rem",
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="rejected">Rejected</option>
                      <option value="hold">Hold</option>
                    </select>
                  </td>
                  <td style={{ padding: "0.75rem 0.6rem" }}>
                    <select
                      value={row.access_level}
                      disabled={isSaving}
                      onChange={(e) =>
                        updateUser(row.id, {
                          access_level: Number(e.target.value) as 1 | 2 | 3 | 4,
                        })
                      }
                      style={{
                        padding: "0.35rem 0.5rem",
                        borderRadius: 6,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        color: "var(--fg)",
                        fontSize: "0.85rem",
                      }}
                    >
                      <option value="1">Owner 1</option>
                      <option value="2">Member 2</option>
                      <option value="3">Co-member 3</option>
                      <option value="4">Public 4</option>
                    </select>
                  </td>
                  <td style={{ padding: "0.75rem 0.6rem", color: "var(--muted)", fontSize: "0.85rem" }}>
                    {row.approved_at ? new Date(row.approved_at).toLocaleString() : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <Link href="/" className="btn btn-secondary">
          Back to home
        </Link>
      </div>
    </div>
  );
}
