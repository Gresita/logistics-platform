import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { RefreshCw, Save } from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import { apiFetch } from "../lib/api";

const ROLES = ["user", "shipman", "admin"];

export default function AdminUsers() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [selectedRole, setSelectedRole] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/v1/admin/users", { auth: true });
      const list = res?.items || [];
      setItems(list);
      const next = {};
      for (const u of list) next[u.id] = u.role;
      setSelectedRole(next);
    } catch (e) {
      toast.error(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async (userId) => {
    const role = selectedRole[userId];
    if (!role) return;

    setSavingId(userId);
    try {
      await apiFetch(`/api/v1/admin/users/${userId}/role`, {
        method: "PATCH",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      toast.success("Role updated");
      await load();
    } catch (e) {
      toast.error(e?.message || "Failed to update role");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <DashboardLayout title="Users (Admin)">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Manage roles: <span className="font-semibold">admin / user / shipman</span>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 text-sm text-slate-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Username</th>
                  <th className="text-left p-3">Role</th>
                  <th className="text-right p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-3 font-medium">{u.id}</td>
                    <td className="p-3 font-mono">{u.username}</td>
                    <td className="p-3">
                      <select
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none"
                        value={selectedRole[u.id] || u.role}
                        onChange={(e) => setSelectedRole((p) => ({ ...p, [u.id]: e.target.value }))}
                        disabled={savingId === u.id}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-semibold disabled:opacity-60"
                        onClick={() => save(u.id)}
                        disabled={savingId === u.id}
                      >
                        <Save className="w-4 h-4" />
                        {savingId === u.id ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
