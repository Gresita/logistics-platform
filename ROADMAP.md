# Logistics Platform — Enterprise Checklist (A–G)

> Status: ✅ DONE | 🟡 PARTIAL | ❌ TODO  
> Proof: link to file(s) / command(s) / screenshot(s)

## A) Event-driven Architecture (Kafka, Schema Registry, AsyncAPI)
- ✅ Kafka pub/sub (shipment.created, shipment.status_changed)  
  Proof: `services/shipment-service/app/kafka/producer.py`, `services/tracking-service/app/kafka/consumer.py`, `services/analytics-service/app/kafka_consumer.py`
- 🟡 DLQ for failed events (shipment.created.dlq)  
  Proof: (verify/adjust) `services/tracking-service/app/kafka/*` (retry logic / DLQ if implemented)
- ✅ Kafka Schema Registry (schema-registry + subjects registered)  
  Proof: `docker-compose.infra.yml` (schema-registry service), `schemas/`
- ✅ Avro + Schema Registry (encode/decode + JSON fallback)  
  Proof: `services/*/app/kafka/avro_codec.py`, `services/analytics-service/app/kafka_consumer.py`
- ❌ AsyncAPI documentation for topics  
  Proof (when done): `docs/asyncapi.yaml`

## B) Observability (Metrics, Tracing, Logs)
- ✅ OpenTelemetry instrumentation (FastAPI)  
  Proof: `services/*/app/observability.py`, `services/*/app/main.py`, `services/*/requirements.txt`
- ✅ Jaeger tracing  
  Proof: `docker-compose.infra.yml` (jaeger), OTLP endpoint wiring in k8s env
- 🟡 Prometheus + Grafana dashboards  
  Proof: `docker-compose.infra.yml` (prometheus, grafana), `infra/prometheus/`  
- ❌ Centralized logging (ELK/EFK)

## C) Containers & Orchestration (Kubernetes)
- ✅ Docker Compose for local infra/dev  
  Proof: `docker-compose.infra.yml`
- ✅ Kubernetes manifests (deployments/services/ingress)  
  Proof: `k8s/`
- ✅ Helm charts or Kustomize  
  Proof: `k8s/overlays/prod` (Kustomize)
- ✅ Auto-healing (liveness/readiness)  
  Proof: probes in `k8s/base/*-deploy.yaml`
- ❌ Autoscaling (HPA)

## D) Service Mesh
- ❌ Istio/Linkerd install + policies  
- ❌ mTLS service-to-service  
- ❌ Traffic management (retries, timeouts, circuit-breaking policies)

## E) Security
- 🟡 JWT auth + RBAC (admin/user/shipman)  
  Proof: `services/shipment-service/app/api/dependencies.py`, auth endpoints
- ❌ OAuth2/OIDC provider (Keycloak)  
- ❌ Secrets management (Vault)  
- ❌ SIEM/SOAR integration  
- ❌ Immutable audit logs / governance

## F) Performance & Delivery
- ❌ Redis/Memcached caching  
- ❌ API Gateway / L7 load balancer (NGINX/Envoy)  
- ❌ Blue-green / Canary deployments

## G) Data Engineering / Advanced Analytics
- ✅ Analytics service (risk scoring + anomalies + ETA heuristic)  
  Proof: `services/analytics-service/app/*`
- ❌ ETL/ELT (Airflow/Prefect/Dagster)  
- ❌ Spark streaming/batch  
- ❌ Lakehouse/Trino
