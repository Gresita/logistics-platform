import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ListChecks, Package, RefreshCw } from "lucide-react";

import DashboardLayout from "../components/DashboardLayout";
import { apiFetch, SHIPMENT_API } from "../lib/api";

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

function Card({ title, subtitle, children, right }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{title}</div>
          {subtitle ? <div className="text-xs text-slate-500 mt-1">{subtitle}</div> : null}
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function ShipmentDetails() {
  const nav = useNavigate();
  const { id } = useParams();

  const [shipments, setShipments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [error, setError] = useState("");
  const [logsError, setLogsError] = useState("");

  const loadShipment = async () => {
    setLoading(true);
    setError("");
    try {
      // MVP approach: fetch list then find by id (since we don't have GET /shipments/{id} endpoint)
      const res = await apiFetch(`${SHIPMENT_API}/shipments?limit=200`, { auth: true });
      const list = Array.isArray(res) ? res : res?.items || [];
      setShipments(list);
    } catch (e) {
      setError(e?.message || "Failed to load shipment");
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    setLogsError("");
    try {
      const res = await apiFetch(`${SHIPMENT_API}/shipment-logs/${id}`, { auth: true });
      // backend might return array; keep generic
      setLogs(Array.isArray(res) ? res : res?.items || []);
    } catch (e) {
      setLogsError(e?.message || "Failed to load shipment logs");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadShipment();
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const shipment = useMemo(() => {
    const n = Number(id);
    return shipments.find((s) => Number(s.id) === n) || null;
  }, [shipments, id]);

  return (
    <DashboardLayout title="Shipment Details">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold"
          onClick={() => nav("/shipments")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Shipments
        </button>

        <button
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold"
          onClick={() => {
            loadShipment();
            loadLogs();
          }}
        >
          <RefreshCw className={`w-4 h-4 ${(loading || loadingLogs) ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Shipment summary */}
        <div className="lg:col-span-2">
          <Card
            title={shipment ? `Shipment #${shipment.id}` : `Shipment #${id}`}
            subtitle="Shipment data from shipment-service"
            right={
              shipment ? (
                <StatusPill status={shipment.status} />
              ) : null
            }
          >
            {loading ? (
              <div className="text-sm text-slate-500">Loading shipment...</div>
            ) : !shipment ? (
              <div className="text-sm text-slate-600">
                Shipment not found in the list. (If you just created it, try Refresh.)
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label="Tracking number" value={shipment.tracking_number} mono />
                <InfoRow label="Origin" value={shipment.origin} />
                <InfoRow label="Destination" value={shipment.destination} />
                <InfoRow label="Status" value={<StatusPill status={shipment.status} />} />
              </div>
            )}
          </Card>
        </div>

        {/* Quick actions */}
        <div className="lg:col-span-1">
          <Card title="Quick Actions" subtitle="Common actions for this shipment">
            <div className="space-y-2">
              <button
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-semibold"
                onClick={() => nav("/shipments/new")}
              >
                <Package className="w-4 h-4" />
                Create another shipment
              </button>

              <button
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold"
                onClick={() => nav("/tracking-events")}
              >
                <ListChecks className="w-4 h-4" />
                View tracking events
              </button>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              Admin-only actions (e.g., delete) are handled in Shipments list.
            </div>
          </Card>
        </div>
      </div>

      {/* Logs */}
      <div className="mt-4">
        <Card title="Shipment Logs" subtitle="Timeline from /shipment-logs/{id}">
          {logsError ? (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{logsError}</div>
          ) : null}

          {loadingLogs ? (
            <div className="text-sm text-slate-500">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-sm text-slate-500">No logs found.</div>
          ) : (
            <div className="relative">
              <div className="absolute left-[14px] top-1 bottom-1 w-px bg-slate-200" />
              <div className="space-y-4">
                {logs.map((l, idx) => (
                  <div key={l.id ?? idx} className="relative pl-10">
                    <div className="absolute left-2 top-1 w-6 h-6 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold">{(l.status || "").toUpperCase()}</div>
                        <div className="text-xs text-slate-500">
                          {l.timestamp ? new Date(l.timestamp).toLocaleString() : ""}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Shipment ID: <span className="font-mono">{l.shipment_id}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-sm font-semibold text-slate-900 ${mono ? "font-mono" : ""}`}>
        {value ?? "-"}
      </div>
    </div>
  );
}
