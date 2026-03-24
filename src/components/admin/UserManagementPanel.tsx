"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCcw, Search, ShieldAlert, Trash2, UserX, UserCheck, KeyRound } from "lucide-react";

interface AdminUser {
  _id: string;
  email?: string;
  username?: string;
  fullName?: string;
  role: "student" | "admin";
  isDisabled?: boolean;
  createdAt?: string;
}

export default function UserManagementPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filteredUsers = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return users;

    return users.filter((user) =>
      [user.email, user.username, user.fullName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [users, query]);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users.");
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateUser = async (id: string, payload: Record<string, unknown>) => {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed.");
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "Action failed.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Delete this account permanently? This cannot be undone.")) return;

    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed.");
      await loadUsers();
    } catch (err: any) {
      setError(err.message || "Delete failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async (id: string) => {
    const newPassword = prompt("Enter new password for this user:");
    if (!newPassword) return;
    await updateUser(id, { action: "reset-password", newPassword });
  };

  return (
    <div className="min-h-dvh bg-[#FCFAF8] px-4 py-6 md:px-6">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-[#292524]">Admin User Management</h1>
            <p className="mt-1 text-sm text-[#57534E]">
              Manage registered users only: disable, delete, and reset passwords.
            </p>
          </div>
          <button
            onClick={loadUsers}
            className="inline-flex items-center gap-2 rounded-lg border border-[#E7E5E4] px-3 py-2 text-sm text-[#57534E] hover:border-[#047857] hover:text-stone-800"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#E7E5E4] bg-[#F8F5F1] px-3 py-2.5">
          <Search size={16} className="text-[#78716C]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email, username, or name"
            className="w-full bg-transparent text-sm text-stone-800 outline-none placeholder:text-[#78716C]"
          />
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            <ShieldAlert size={16} />
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-[#E7E5E4] bg-[#F8F5F1]">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[#E7E5E4] text-left text-xs uppercase tracking-wide text-[#57534E]">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#57534E]">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16} /> Loading users...
                    </span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#57534E]">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const disabled = !!user.isDisabled;
                  const busy = busyId === user._id;
                  return (
                    <tr key={user._id} className="border-b border-[#FFFFFF] text-sm text-stone-700">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#292524]">{user.fullName || "-"}</div>
                        <div className="text-xs text-[#57534E]">{user.email || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-[#57534E]">{user.username || "-"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border border-[#E7E5E4] px-2 py-0.5 text-xs text-[#57534E]">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            disabled
                              ? "bg-red-500/15 text-red-300"
                              : "bg-emerald-500/15 text-emerald-300"
                          }`}
                        >
                          {disabled ? "Disabled" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#57534E]">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            disabled={busy}
                            onClick={() =>
                              updateUser(user._id, {
                                action: "toggle-disable",
                                isDisabled: !disabled,
                              })
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-[#E7E5E4] px-2.5 py-1.5 text-xs text-[#57534E] hover:border-[#047857] hover:text-stone-800 disabled:opacity-50"
                          >
                            {disabled ? <UserCheck size={14} /> : <UserX size={14} />}
                            {disabled ? "Enable" : "Disable"}
                          </button>

                          <button
                            disabled={busy}
                            onClick={() => handleResetPassword(user._id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#E7E5E4] px-2.5 py-1.5 text-xs text-[#57534E] hover:border-[#047857] hover:text-stone-800 disabled:opacity-50"
                          >
                            <KeyRound size={14} /> Reset Password
                          </button>

                          <button
                            disabled={busy}
                            onClick={() => deleteUser(user._id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/40 px-2.5 py-1.5 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
