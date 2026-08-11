"use client";

import { useState } from "react";
import { Users, UserPlus, Shield, Trash2, CheckCircle, XCircle } from "lucide-react";
import { adminStore } from "@/app/api/auth/[...nextauth]/options";

interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: "SUPERADMIN" | "EDITOR" | "REVIEWER";
  active: boolean;
}

export default function UsersPage() {
  // Initial state loaded from default store
  const [users, setUsers] = useState<AdminUserRecord[]>([
    {
      id: "admin-super-1",
      name: "Todaynews SuperAdmin",
      email: "admin@todaynews.ng",
      role: "SUPERADMIN",
      active: true,
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"SUPERADMIN" | "EDITOR" | "REVIEWER">("EDITOR");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;

    const newUser: AdminUserRecord = {
      id: `admin-${Date.now()}`,
      name,
      email,
      role,
      active: true,
    };

    setUsers((prev) => [...prev, newUser]);
    setName("");
    setEmail("");
    setPassword("");
    setShowModal(false);
  };

  const toggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u))
    );
  };

  const deleteUser = (id: string) => {
    if (!confirm("Are you sure you want to delete this admin account?")) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#2979ff]" />
            Admin User Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage editorial team accounts and access permissions</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00e676] hover:bg-[#00c853] text-[#060b18] font-bold rounded-lg text-sm transition shadow-lg shadow-[#00e676]/20"
        >
          <UserPlus className="w-4 h-4" /> Add New Admin
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-[#0f1729]/80 border border-white/5 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/[0.02] transition">
                <td className="px-6 py-4 font-semibold text-white">{user.name}</td>
                <td className="px-6 py-4 text-slate-400">{user.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      user.role === "SUPERADMIN"
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : user.role === "EDITOR"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                    }`}
                  >
                    <Shield className="w-3 h-3" />
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.active ? (
                    <span className="text-xs text-[#00e676] flex items-center gap-1">
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
                    onClick={() => toggleStatus(user.id)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-xs rounded text-slate-300 transition"
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f1729] border border-white/10 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#00e676]" /> Create New Admin
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chukwuma Obi"
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00e676]/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="editor@todaynews.ng"
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00e676]/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Temporary password"
                  required
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00e676]/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#1a2336] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00e676]/30"
                >
                  <option value="EDITOR">EDITOR (Can scrape, edit, and publish)</option>
                  <option value="REVIEWER">REVIEWER (Can edit and save drafts only)</option>
                  <option value="SUPERADMIN">SUPERADMIN (Full access including user management)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#00e676] hover:bg-[#00c853] text-[#060b18] font-bold rounded-lg text-sm transition"
                >
                  Create Admin
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium rounded-lg transition"
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
