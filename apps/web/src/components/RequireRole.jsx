import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RequireRole({ allow, children, redirectTo = "/shipman" }) {
  const { role, ready } = useAuth();
  if (!ready) return null;
  if (!role) return null;

  if (!allow.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}

