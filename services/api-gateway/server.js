// services/api-gateway/server.js
import Fastify from "fastify";
import cors from "@fastify/cors";
import proxy from "@fastify/http-proxy";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

// Gateway health
app.get("/health", async () => ({ status: "ok", service: "api-gateway" }));

// Upstreams (IPv4 to avoid localhost->::1 issues on Windows)
const SHIPMENT_UPSTREAM =
  process.env.SHIPMENT_SERVICE_URL || "http://127.0.0.1:4001";
const TRACKING_UPSTREAM =
  process.env.TRACKING_SERVICE_URL || "http://127.0.0.1:4002";

// --- Shipment routes via gateway ---
await app.register(proxy, {
  upstream: SHIPMENT_UPSTREAM,
  prefix: "/api/shipments",
  rewritePrefix: "/shipments",
});

await app.register(proxy, {
  upstream: SHIPMENT_UPSTREAM,
  prefix: "/api/shipment-health",
  rewritePrefix: "/health",
});

// --- Tracking routes via gateway ---
await app.register(proxy, {
  upstream: TRACKING_UPSTREAM,
  prefix: "/api/tracking",
  // keep same paths:
  // /api/tracking/health  -> /health
  // /api/tracking/events  -> /events
  rewritePrefix: "",
});

const PORT = Number(process.env.GATEWAY_PORT || 3000);

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}