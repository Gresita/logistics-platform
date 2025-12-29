import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

export default function App() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  const loadEvents = async () => {
    setError(null);
    try {
      const res = await fetch(`${API}/api/tracking/events`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEvents(await res.json());
    } catch (e) {
      setError(e.message);
    }
  };

  const createShipment = async () => {
    setError(null);
    try {
      const res = await fetch(`${API}/api/shipments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json();
      await loadEvents(); // refresh
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div style={{ fontFamily: "system-ui", padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>Logistics Platform</h1>

      <button onClick={createShipment}>Create shipment</button>
      <button onClick={loadEvents} style={{ marginLeft: 8 }}>Refresh events</button>

      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      <h2 style={{ marginTop: 16 }}>Tracking Events</h2>
      <pre>{JSON.stringify(events, null, 2)}</pre>
    </div>
  );
}