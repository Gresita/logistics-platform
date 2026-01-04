import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearToken, getToken, setToken } from "../lib/auth";

const AuthContext = createContext(null);

function decodeJwt(token) {
  try {
    const part = token.split(".")[1];
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getTokenInfo(token) {
  const payload = token ? decodeJwt(token) : null;
  const expMs = payload?.exp ? payload.exp * 1000 : null;
  const isExpired = expMs ? Date.now() >= expMs : false;

  return {
    payload,
    expMs,
    isExpired,
    user: payload
      ? { username: payload.sub || null, role: payload.role || null }
      : null,
  };
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [ready, setReady] = useState(false);

  // init from storage
  useEffect(() => {
    const t = getToken();
    if (t) {
      const info = getTokenInfo(t);
      if (info.isExpired) {
        clearToken();
        setTokenState(null);
      } else {
        setTokenState(t);
      }
    } else {
      setTokenState(null);
    }
    setReady(true);
  }, []);

  // auto-logout when exp hits
  useEffect(() => {
    if (!token) return;

    const { expMs } = getTokenInfo(token);
    if (!expMs) return;

    const ms = expMs - Date.now();
    if (ms <= 0) {
      clearToken();
      setTokenState(null);
      return;
    }

    const id = setTimeout(() => {
      clearToken();
      setTokenState(null);
      // RequireAuth/apiFetch will redirect; this just clears auth state
    }, ms);

    return () => clearTimeout(id);
  }, [token]);

  // sync between tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== "lp_access_token") return;
      const t = getToken();
      if (!t) {
        setTokenState(null);
        return;
      }
      const info = getTokenInfo(t);
      setTokenState(info.isExpired ? null : t);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const info = useMemo(() => getTokenInfo(token), [token]);

  const value = useMemo(
    () => ({
      token,
      ready,
      isAuthenticated: !!token && !info.isExpired,
      user: info.user,
      role: info.user?.role || null,
      login: (t) => {
        setToken(t);
        const i = getTokenInfo(t);
        setTokenState(i.isExpired ? null : t);
      },
      logout: () => {
        clearToken();
        setTokenState(null);
      },
    }),
    [token, ready, info.isExpired, info.user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
