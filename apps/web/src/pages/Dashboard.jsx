import React, { useEffect, useMemo, useState } from "react";
import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Activity, Package, RefreshCw } from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import { apiFetch, SHIPMENT_API, TRACKING_API } from "../lib/api";

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/70 ${className}`} />;
}

function KpiCard({ title, value, subtitle, tone = "default", loading }) {
  const tones = {
    default: "border-slate-200",
    good: "border-emerald-200 bg-emerald-50/40",
    warn: "border-amber-200 bg-amber-50/40",
    bad: "border-red-200 bg-red-50/40",
  };
  return (
    <div className={`rounded-2xl border ${tones[tone]} bg-white p-4 shadow-sm`}>
      <div className="text-sm text-slate-500">{title}</div>
      {loading ? <Skeleton className="h-9 w-20 mt-2" /> : <div className="mt-1 text-3xl font-bold">{value}</div>}
      {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
    </div>
  );
}

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

export default function Dashboard() {
  const nav = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const s = await apiFetch(`${SHIPMENT_API}/shipments`, { auth: true });
      const shipmentsList = Array.isArray(s) ? s : s?.items || [];
      setShipments(shipmentsList);

      const e = await apiFetch(`${TRACKING_API}/events?limit=10&offset=0`, { auth: true });
      setEvents(e?.items || []);

      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusCounts = useMemo(() => {
    const c = { CREATED: 0, IN_TRANSIT: 0, DELIVERED: 0, DELAYED: 0, CANCELLED: 0, OTHER: 0 };
    for (const s of shipments) {
      const st = (s.status || "OTHER").toUpperCase();
      if (c[st] !== undefined) c[st] += 1;
      else c.OTHER += 1;
    }
    return c;
  }, [shipments]);

  const total = shipments.length;
  const inTransit = statusCounts.IN_TRANSIT;
  const delivered = statusCounts.DELIVERED;
  const delayed = statusCounts.DELAYED;

  const pieData = useMemo(() => {
    const entries = Object.entries(statusCounts)
      .filter(([k, v]) => v > 0 && k !== "OTHER")
      .map(([name, value]) => ({ name, value }));
    return entries.length ? entries : [{ name: "CREATED", value: 0 }];
  }, [statusCounts]);

  const COLORS = {
    CREATED: "#64748b",
    IN_TRANSIT: "#3b82f6",
    DELIVERED: "#22c55e",
    DELAYED: "#ef4444",
    CANCELLED: "#6b7280",
  };

  const alerts = useMemo(() => {
    const out = [];
    for (const s of shipments) {
      const st = (s.status || "").toUpperCase();
      if (st === "DELAYED") {
        out.push({
          id: `delayed-${s.id}`,
          type: "DELAYED",
          ref: s.tracking_number || s.id,
          shipmentId: s.id,
          msg: "Shipment marked as DELAYED",
        });
      }
    }
    return out.slice(0, 8);
  }, [shipments]);

  const recentShipments = useMemo(() => shipments.slice(0, 8), [shipments]);

  function onSearch(q) {
    if (!q) return;
    nav(`/shipments`);
  }

  return (
    <DashboardLayout title="Dashboard" onSearch={onSearch}>
      {/* Top actions */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          {lastRefreshed ? `Last refreshed: ${lastRefreshed.toLocaleTimeString()}` : " "}
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="font-semibold">Could not load dashboard</div>
          <div className="mt-1">{error}</div>
        </div>
      ) : null}

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Shipments" value={total} subtitle="All shipments in system" loading={loading} />
        <KpiCard title="In Transit" value={inTransit} subtitle="Currently moving" tone="default" loading={loading} />
        <KpiCard title="Delivered" value={delivered} subtitle="Completed" tone="good" loading={loading} />
        <KpiCard
          title="Delayed / Exceptions"
          value={delayed}
          subtitle="Needs attention"
          tone={!loading && delayed ? "bad" : "good"}
          loading={loading}
        />
      </div>

      {/* Middle grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status overview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
          <div>
            <div className="font-semibold">Status Overview</div>
            <div className="text-xs text-slate-500 mt-0.5">Distribution by shipment status</div>
          </div>

          <div className="mt-4 h-65">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} innerRadius={55}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={COLORS[entry.name] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent shipments */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">Recent Shipments</div>
              <div className="text-xs text-slate-500 mt-0.5">Latest items from shipment-service</div>
            </div>
            <button className="text-sm font-semibold text-indigo-700 hover:underline" onClick={() => nav("/shipments")}>
              View all
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : recentShipments.length === 0 ? (
              <div className="text-sm text-slate-500 flex items-center gap-2">
                <Package className="w-4 h-4" /> No shipments yet
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="text-left py-2">Tracking #</th>
                    <th className="text-left py-2">Route</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentShipments.map((s) => (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 font-medium">{s.tracking_number || s.id}</td>
                      <td className="py-2 text-slate-600">
                        {(s.origin || "-")} → {(s.destination || "-")}
                      </td>
                      <td className="py-2">
                        <StatusPill status={s.status} />
                      </td>
                      <td className="py-2">
                        <button className="text-indigo-700 font-semibold hover:underline" onClick={() => nav(`/shipments/${s.id}`)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-semibold"
              onClick={() => nav("/shipments/new")}
            >
              Create shipment
            </button>
          </div>
        </div>
      </div>

      {/* Bottom grid */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tracking events */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4" /> Recent Tracking Events
              </div>
              <div className="text-xs text-slate-500 mt-0.5">From tracking-service</div>
            </div>
            <button className="text-sm font-semibold text-indigo-700 hover:underline" onClick={() => nav("/tracking-events")}>
              View all
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : events.length === 0 ? (
              <div className="text-sm text-slate-500">No events yet</div>
            ) : (
              events.map((ev) => (
                <div key={ev.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{ev.event_type}</div>
                    <div className="text-xs text-slate-500">
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ""}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Shipment: <span className="font-mono">{ev.shipment_id}</span>
                  </div>
                  {ev.payload ? (
                    <div className="mt-1 text-xs text-slate-500">
                      {JSON.stringify(ev.payload).slice(0, 140)}
                      {JSON.stringify(ev.payload).length > 140 ? "..." : ""}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
          <div className="font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Alerts & Exceptions
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Simple rules (MVP)</div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : alerts.length === 0 ? (
              <div className="text-sm text-slate-600">All clear. No issues detected.</div>
            ) : (
              alerts.map((a) => (
                <button
                  key={a.id}
                  className="w-full text-left rounded-xl border border-red-100 bg-red-50/50 p-3 hover:bg-red-50"
                  onClick={() => nav(`/shipments/${a.shipmentId}`)}
                >
                  <div className="text-xs font-semibold text-red-700">{a.type}</div>
                  <div className="text-sm font-semibold text-slate-900 mt-1">{a.ref}</div>
                  <div className="text-xs text-slate-600 mt-1">{a.msg}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

