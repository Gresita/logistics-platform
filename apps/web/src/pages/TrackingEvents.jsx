import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, RefreshCw, Search, Activity } from "lucide-react";
import toast from "react-hot-toast";

import DashboardLayout from "../components/DashboardLayout";
import { apiFetch, TRACKING_API } from "../lib/api";

function Pill({ children }) {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
      {children}
    </span>
  );
}

export default function TrackingEvents() {
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);

  const limit = Number(sp.get("limit") || 20);
  const offset = Number(sp.get("offset") || 0);
  const q = sp.get("q") || ""; // shipment_id filter

  const [qInput, setQInput] = useState(q);

  const canPrev = offset > 0;
  const canNext = total == null ? items.length === limit : offset + limit < total;

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      if (q.trim()) params.set("shipment_id", q.trim()); // server-side filter

      const res = await apiFetch(`${TRACKING_API}/events?${params.toString()}`, { auth: true });
      setItems(res?.items || []);
      setTotal(res?.total ?? null);
    } catch (e) {
      toast.error(e?.message || "Failed to load tracking events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, offset, q]);

  const submitSearch = (e) => {
    e.preventDefault();
    setSp((prev) => {
      const next = new URLSearchParams(prev);
      const v = qInput.trim();
      if (v) next.set("q", v);
      else next.delete("q");
      next.set("offset", "0");
      next.set("limit", String(limit));
      return next;
    });
  };

  const goPrev = () =>
    setSp((prev) => new URLSearchParams({ ...Object.fromEntries(prev), offset: String(Math.max(0, offset - limit)) }));

  const goNext = () =>
    setSp((prev) => new URLSearchParams({ ...Object.fromEntries(prev), offset: String(offset + limit) }));

  const setLimit = (v) =>
    setSp((prev) => new URLSearchParams({ ...Object.fromEntries(prev), limit: String(v), offset: "0" }));

  const page = Math.floor(offset / limit) + 1;
  const pages = total != null ? Math.max(1, Math.ceil(total / limit)) : null;

  return (
    <DashboardLayout title="Tracking Events">
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center gap-3">
        <form onSubmit={submitSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400"
            placeholder="Filter by shipment_id (server-side)"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white outline-none"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>

          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-600" />
            <div className="font-semibold">Events</div>
            {total != null ? <div className="text-xs text-slate-500">Total: {total}</div> : null}
          </div>

          <div className="text-xs text-slate-500">
            Offset: {offset} · Limit: {limit} · Showing: {items.length} · Page: {page}
            {pages != null ? <> / {pages}</> : null}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-4 text-sm text-slate-500">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">No events found</div>
          ) : (
            items.map((ev) => (
              <div key={ev.id} className="p-4 hover:bg-slate-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Pill>{ev.event_type}</Pill>
                    <span className="text-sm font-semibold text-slate-900">
                      Shipment: <span className="font-mono">{ev.shipment_id}</span>
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ""}
                  </div>
                </div>

                {ev.payload ? (
                  <pre className="mt-2 text-xs bg-slate-950 text-slate-100 rounded-xl p-3 overflow-x-auto">
{JSON.stringify(ev.payload, null, 2)}
                  </pre>
                ) : null}

                <div className="mt-2">
                  <button
                    className="text-indigo-700 font-semibold hover:underline text-sm"
                    onClick={() => nav(`/shipments/${ev.shipment_id}`)}
                  >
                    View shipment
                  </button>
                </div>
              </div>
            ))
          )}
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

