import { getToken, clearToken } from "./auth";

export const SHIPMENT_API = "/api";
export const TRACKING_API = "/tracking";

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch(url, { auth = true, headers, ...options } = {}) {
  const h = { ...(headers || {}) };

  if (auth) {
    const token = getToken();
    if (token) h.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers: h });

  // handle empty body
  const text = await res.text();
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;

  // global 401 handling
  if (res.status === 401) {
    clearToken();
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?next=${next}`;
    throw new ApiError("Session expired. Please login again.", 401, data);
  }

  if (!res.ok) {
    const msg = data?.detail || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }
  return data;
}

