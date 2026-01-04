import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PlusCircle, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

import DashboardLayout from "../components/DashboardLayout";
import { apiFetch, SHIPMENT_API } from "../lib/api";
import { useAuth } from "../context/AuthContext";

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

export default function Shipments() {
  const nav = useNavigate();
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [sp, setSp] = useSearchParams();

  const limit = Math.min(200, Math.max(1, Number(sp.get("limit") || 20)));
  const offset = Math.max(0, Number(sp.get("offset") || 0));
  const q = sp.get("q") || "";
  const status = sp.get("status") || "ALL";

  const [qInput, setQInput] = useState(q);
  const [statusInput, setStatusInput] = useState(status);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);

  const canPrev = offset > 0;
  const canNext = total == null ? items.length === limit : offset + limit < total;

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      if (q.trim()) params.set("q", q.trim());
      if (status !== "ALL") params.set("status", status);

      const res = await apiFetch(`${SHIPMENT_API}/shipments?${params.toString()}`, { auth: true });
      setItems(res?.items || []);
      setTotal(res?.total ?? null);
    } catch (e) {
      toast.error(e?.message || "Failed to load shipments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, offset, q, status]);

  const submitFilters = (e) => {
    e.preventDefault();
    setSp((prev) => {
      const next = new URLSearchParams(prev);
      const qq = qInput.trim();
      if (qq) next.set("q", qq);
      else next.delete("q");

      if (statusInput && statusInput !== "ALL") next.set("status", statusInput);
      else next.delete("status");

      next.set("offset", "0");
      next.set("limit", String(limit));
      return next;
    });
  };

  const setLimit = (v) =>
    setSp((prev) => new URLSearchParams({ ...Object.fromEntries(prev), limit: String(v), offset: "0" }));

  const goPrev = () =>
    setSp((prev) =>
      new URLSearchParams({ ...Object.fromEntries(prev), offset: String(Math.max(0, offset - limit)) })
    );

  const goNext = () =>
    setSp((prev) => new URLSearchParams({ ...Object.fromEntries(prev), offset: String(offset + limit) }));

  const del = async (id) => {
    if (!isAdmin) return;
    if (!confirm("Delete shipment? (admin only)")) return;
    try {
      await apiFetch(`${SHIPMENT_API}/shipments/${id}`, { method: "DELETE", auth: true });
      toast.success("Shipment deleted");
      await load();
    } catch (e) {
      toast.error(e?.message || "Delete failed");
    }
  };

  const page = Math.floor(offset / limit) + 1;
  const pages = total != null ? Math.max(1, Math.ceil(total / limit)) : null;

  return (
    <DashboardLayout title="Shipments">
      <form onSubmit={submitFilters} className="mb-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400"
            placeholder="Search (tracking, origin, destination, id...)"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
          />
        </div>

        <select
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white outline-none"
          value={statusInput}
          onChange={(e) => setStatusInput(e.target.value)}
        >
          <option value="ALL">All statuses</option>
          <option value="CREATED">CREATED</option>
          <option value="IN_TRANSIT">IN_TRANSIT</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="DELAYED">DELAYED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        <select
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white outline-none"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
        >
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>

        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold"
        >
          Apply
        </button>

        {isAdmin ? (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-semibold"
            onClick={() => nav("/shipments/new")}
          >
            <PlusCircle className="w-4 h-4" />
            Create
          </button>
        ) : null}
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Offset: {offset} · Limit: {limit}
            {total != null ? <> · Total: {total}</> : null}
          </div>
          <div className="text-xs text-slate-500">
            Page: {page}
            {pages != null ? <> / {pages}</> : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 border-b border-slate-100">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Tracking #</th>
                <th className="text-left p-3">Route</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={5}>Loading...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={5}>No shipments found</td>
                </tr>
              ) : (
                items.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-3 font-medium">{s.id}</td>
                    <td className="p-3 font-medium">{s.tracking_number}</td>
                    <td className="p-3 text-slate-600">{s.origin} → {s.destination}</td>
                    <td className="p-3"><StatusPill status={s.status} /></td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button className="text-indigo-700 font-semibold hover:underline" onClick={() => nav(`/shipments/${s.id}`)}>
                        View
                      </button>
                      {isAdmin ? (
                        <button
                          className="ml-3 inline-flex items-center gap-1 text-red-600 font-semibold hover:underline"
                          onClick={() => del(s.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <button
            disabled={!canPrev || loading}
            onClick={goPrev}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>

          <button
            disabled={!canNext || loading}
            onClick={goNext}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold disabled:opacity-50"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
