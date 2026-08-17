"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: "SUPERADMIN" | "EDITOR" | "REVIEWER";
  active: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"SUPERADMIN" | "EDITOR" | "REVIEWER">("EDITOR");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to create user");
        return;
      }

      setUsers((prev) => [...prev, data.user]);
      setName("");
      setEmail("");
      setPassword("");
      setShowModal(false);
    } catch (err) {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (user: AdminUserRecord) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !user.active }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u))
        );
      }
    } catch (err) {
      console.error("Toggle status failed:", err);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this admin account?")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    } catch (err) {
      console.error("Delete user failed:", err);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#2979ff]" />
            Admin User Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage editorial team accounts and access permissions</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-lg text-sm transition shadow-lg shadow-[#2563eb]/20"
          >
            <UserPlus className="w-4 h-4" /> Add New Admin
          </button>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
        </div>
      ) : (
        <div className="bg-slate-50/80 border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No admin users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">{user.name}</td>
                    <td className="px-6 py-4 text-slate-400">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.role === "SUPERADMIN"
                            ? "bg-slate-200 text-slate-800 border border-slate-300"
                            : user.role === "EDITOR"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.active ? (
                        <span className="text-xs text-[#2563eb] flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="text-xs text-red-400 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => toggleStatus(user)}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-xs rounded text-slate-700 transition"
                      >
                        {user.active ? "Deactivate" : "Activate"}
                      </button>
                      {user.role !== "SUPERADMIN" && (
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition"
                          title="Delete Admin"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#2563eb]" /> Create New Admin
            </h3>

            {formError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chukwuma Obi"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="editor@todaynews.ng"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                >
                  <option value="EDITOR">EDITOR (Can scrape, edit, and publish)</option>
                  <option value="REVIEWER">REVIEWER (Can edit and save drafts only)</option>
                  <option value="SUPERADMIN">SUPERADMIN (Full access including user management)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-lg text-sm transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {submitting ? "Creating..." : "Create Admin"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormError(null); }}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
