"use client";

import { useCallback, useEffect, useState } from "react";
import { ACCESS_LEVEL_LABELS } from "@/lib/types";

interface AdminUser {
  id: string;
  email: string | null;
  role: string;
  access_level: number;
  status: string;
  created_at: string;
}

interface AdminStats {
  users: {
    total: number;
    pending: number;
    approved: number;
  };
  content: {
    total: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
};

export default function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load users");
        setUsers([]);
        return;
      }
      setUsers(json.data ?? []);
      setError(null);
    } catch {
      setError("Network error while loading users");
      setUsers([]);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const json = await res.json();
      if (!res.ok) {
        console.error("Failed to load stats", json.error);
        return;
      }
      setStats(json.data);
    } catch {
      console.error("Network error while loading stats");
    }
  }, []);

  useEffect(() => {
    void loadUsers();
    void loadStats();
  }, [loadUsers, loadStats]);

  async function patchUser(
    id: string,
    patch: { access_level?: number; status?: string }
  ) {
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Update failed");
      } else {
        setError(null);
        await loadUsers();
        await loadStats();
      }
    } catch {
      setError("Network error while updating user");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-head">
        <h1>Owner dashboard</h1>
        <p>
          Approve new accounts, assign access tiers, and monitor platform
          activity. The first owner account must be set directly in Supabase.
          New signups stay &quot;Pending approval&quot; until you approve them
          here.
        </p>
      </div>

      {error && (
        <p className="auth-notice auth-notice-error" role="alert">
          {error}
        </p>
      )}

      {stats && (
        <div className="admin-stats">
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.users.total}</span>
            <span className="admin-stat-label">Total users</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value admin-stat-pending">
              {stats.users.pending}
            </span>
            <span className="admin-stat-label">Pending approval</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value admin-stat-approved">
              {stats.users.approved}
            </span>
            <span className="admin-stat-label">Approved</span>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-value">{stats.content.total}</span>
            <span className="admin-stat-label">Content items</span>
          </div>
        </div>
      )}

      <div className="admin-section">
        <h2>Members</h2>
        {users === null ? (
          <p className="admin-loading">Loading members…</p>
        ) : users.length === 0 ? (
          <p className="admin-empty">No members yet in the live database.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table" data-testid="admin-users-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Tier (access)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} data-testid={`admin-user-${user.email ?? user.id}`}>
                    <td className="admin-email">{user.email ?? "—"}</td>
                    <td>
                      <span
                        className={`admin-status admin-status-${user.status}`}
                      >
                        {STATUS_LABELS[user.status] ?? user.status}
                      </span>
                    </td>
                    <td>
                      <select
                        className="admin-tier-select"
                        value={String(user.access_level)}
                        disabled={busyId === user.id}
                        aria-label={`Tier for ${user.email ?? user.id}`}
                        onChange={(event) =>
                          void patchUser(user.id, {
                            access_level: Number(event.target.value),
                          })
                        }
                      >
                        {([1, 2, 3, 4] as const).map((level) => (
                          <option key={level} value={String(level)}>
                            {ACCESS_LEVEL_LABELS[level]} (level {level})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="admin-actions">
                      {user.status !== "approved" && (
                        <button
                          type="button"
                          className="btn btn-primary admin-btn"
                          disabled={busyId === user.id}
                          onClick={() =>
                            void patchUser(user.id, { status: "approved" })
                          }
                        >
                          Approve
                        </button>
                      )}
                      {user.status === "approved" && (
                        <button
                          type="button"
                          className="btn btn-secondary admin-btn"
                          disabled={busyId === user.id}
                          onClick={() =>
                            void patchUser(user.id, { status: "pending" })
                          }
                        >
                          Hold
                        </button>
                      )}
                      {user.status !== "rejected" && (
                        <button
                          type="button"
                          className="btn btn-secondary admin-btn admin-btn-danger"
                          disabled={busyId === user.id}
                          onClick={() =>
                            void patchUser(user.id, { status: "rejected" })
                          }
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
