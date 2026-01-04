import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicOnly({ children }) {
  const { isAuthenticated } = useAuth();
  const loc = useLocation();

  if (isAuthenticated) {
    const next = new URLSearchParams(loc.search).get("next");
    return <Navigate to={next || "/dashboard"} replace />;
  }
  return children;
}
