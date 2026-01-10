import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import RequireAuth from "./components/RequireAuth";
import PublicOnly from "./components/PublicOnly";
import RequireRole from "./components/RequireRole";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Shipments from "./pages/Shipments";
import CreateShipment from "./pages/CreateShipment";
import ShipmentDetails from "./pages/ShipmentDetails";
import TrackingEvents from "./pages/TrackingEvents";
import AdminUsers from "./pages/AdminUsers";
import ShipmanShipments from "./pages/ShipmanShipments";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public only */}
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

      {/* Admin/User area (shipman redirected to /shipman) */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <RequireRole allow={["admin", "user"]} redirectTo="/shipman">
              <Dashboard />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/shipments"
        element={
          <RequireAuth>
            <RequireRole allow={["admin", "user"]} redirectTo="/shipman">
              <Shipments />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/shipments/new"
        element={
          <RequireAuth>
            <RequireRole allow={["admin"]} redirectTo="/shipman">
              <CreateShipment />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/shipments/:id"
        element={
          <RequireAuth>
            <RequireRole allow={["admin", "user"]} redirectTo="/shipman">
              <ShipmentDetails />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/tracking-events"
        element={
          <RequireAuth>
            <RequireRole allow={["admin", "user"]} redirectTo="/shipman">
              <TrackingEvents />
            </RequireRole>
          </RequireAuth>
        }
      />

      {/* Shipman-only */}
      <Route
        path="/shipman"
        element={
          <RequireAuth>
            <RequireRole allow={["shipman"]} redirectTo="/dashboard">
              <ShipmanShipments />
            </RequireRole>
          </RequireAuth>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireAuth>
            <RequireRole allow={["admin"]} redirectTo="/dashboard">
              <AdminUsers />
            </RequireRole>
          </RequireAuth>
        }
      />

      <Route path="*" element={<div style={{ padding: 24 }}>404</div>} />
    </Routes>
  );
}
