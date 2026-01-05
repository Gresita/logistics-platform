import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { RefreshCw, Save } from "lucide-react";

import { apiFetch, SHIPMENT_API } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const ALLOWED = ["IN_TRANSIT", "DELIVERED", "DELAYED", "CANCELLED"];

function StatusPill({ status }) {
  const st = (status || "CREATED").toUpperCase();
  const map = {
    CREATED: "bg-slate-100 text-slate-700",
    IN_TRANSIT: "bg-blue-100 text-blue-700",
    DELIVERED: "bg-emerald-100 text-emerald-700",
    DELAYED: "bg-red-100 text-red-700",
    CANCELLED: "bg-slate-200 text-slate-700",
  };
  const cls = map[st] || "bg-slate-100 text-slate-700";
  return <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${cls}`}>{st}</span>;
}

export default function ShipmanShipments() {
  const { role, logout } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selected, setSelected] = useState({}); // { [shipmentId]: status }

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${SHIPMENT_API}/shipments?limit=50&offset=0`, { auth: true });
      const list = res?.items || [];
      setItems(list);

      // init dropdowns from current status
      const next = {};
      for (const s of list) {
        const st = String(s.status || "").toUpperCase();
        next[s.id] = ALLOWED.includes(st) ? st : "IN_TRANSIT";
      }
      setSelected(next);
    } catch (e) {
      toast.error(e?.message || "Failed to load shipments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (shipmentId) => {
    const st = selected[shipmentId];
    if (!st) return;

    setUpdatingId(shipmentId);
    try {
      await apiFetch(`${SHIPMENT_API}/shipments/${shipmentId}/status`, {
        method: "PATCH",
        auth: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: st }),
      });
      toast.success("Status updated");
      await load();
    } catch (e) {
      toast.error(e?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  // hard block if not shipman
  if (role && role !== "shipman") {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-700">
        This page is for shipman only.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 bg-white border-b border-slate-200">
        <div className="h-16 px-4 flex items-center justify-between">
          <div>
            <div className="font-bold">Shipman</div>
            <div className="text-xs text-slate-500">Assigned shipments</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="font-semibold">My Shipments</div>
            <div className="text-xs text-slate-500">Showing: {items.length}</div>
          </div>

          {loading ? (
            <div className="p-4 text-sm text-slate-500">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">No assigned shipments.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((s) => (
                <div key={s.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      #{s.id} <span className="text-slate-500 font-normal">({s.tracking_number})</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">{s.origin} → {s.destination}</div>
                    <div className="mt-2"><StatusPill status={s.status} /></div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none"
                      value={selected[s.id] || "IN_TRANSIT"}
                      onChange={(e) => setSelected((p) => ({ ...p, [s.id]: e.target.value }))}
                      disabled={updatingId === s.id}
                    >
                      {ALLOWED.map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                    <button
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-semibold disabled:opacity-60"
                      onClick={() => updateStatus(s.id)}
                      disabled={updatingId === s.id}
                    >
                      <Save className="w-4 h-4" />
                      {updatingId === s.id ? "Saving..." : "Update"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

