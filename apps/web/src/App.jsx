import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import RequireAuth from "./components/RequireAuth";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Shipments from "./pages/Shipments";
import CreateShipment from "./pages/CreateShipment";
import ShipmentDetails from "./pages/ShipmentDetails";
import TrackingEvents from "./pages/TrackingEvents";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/shipments" element={<RequireAuth><Shipments /></RequireAuth>} />
      <Route path="/shipments/new" element={<RequireAuth><CreateShipment /></RequireAuth>} />
      <Route path="/shipments/:id" element={<RequireAuth><ShipmentDetails /></RequireAuth>} />
      <Route path="/tracking-events" element={<RequireAuth><TrackingEvents /></RequireAuth>} />

      <Route path="*" element={<div style={{ padding: 24 }}>404</div>} />
    </Routes>
  );
}
