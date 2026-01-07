# start-all.ps1 (K8s mode)
$ErrorActionPreference = "Stop"

$ROOT = "C:\Users\Lenovo\Desktop\together\logistics-platform"
Set-Location $ROOT

function Wait-Port([int]$port, [int]$seconds=90) {
  for ($i=0; $i -lt $seconds; $i++) {
    $ok = Test-NetConnection 127.0.0.1 -Port $port -WarningAction SilentlyContinue
    if ($ok.TcpTestSucceeded) { return $true }
    Start-Sleep -Seconds 1
  }
  throw "Timeout waiting for port $port"
}

Write-Host "==> 1) Starting INFRA (Kafka/Zookeeper, Schema Registry, MySQL, Jaeger, Prometheus, Grafana) ..."
docker compose -f .\docker-compose.infra.yml up -d

Write-Host "==> 2) Waiting infra ports..."
Wait-Port 9092   120   # Kafka
Wait-Port 8081   120   # Schema Registry
Wait-Port 3308   120   # MySQL shipments
Wait-Port 4318   120   # Jaeger OTLP HTTP

Write-Host "==> 3) Building service images (:local) ..."
docker build -t shipment-service:local  .\services\shipment-service
docker build -t tracking-service:local  .\services\tracking-service
docker build -t analytics-service:local .\services\analytics-service

Write-Host "==> 4) Deploying to Kubernetes (Kustomize overlay: prod) ..."
kubectl apply -k .\k8s\overlays\prod

Write-Host "==> 5) Restarting deployments to pick latest local images ..."
kubectl rollout restart deploy -n logistics shipment-service tracking-service analytics-service | Out-Null

Write-Host "==> 6) Waiting pods (Ready)..."
kubectl wait --for=condition=Ready pod -l app=shipment-service  -n logistics --timeout=180s
kubectl wait --for=condition=Ready pod -l app=tracking-service  -n logistics --timeout=180s
kubectl wait --for=condition=Ready pod -l app=analytics-service -n logistics --timeout=180s

Write-Host ""
Write-Host "==> DONE."
Write-Host ""
Write-Host "Open port-forward (keep terminal open):"
Write-Host "  kubectl -n ingress-nginx port-forward svc/ingress-nginx-controller 8085:80"
Write-Host ""
Write-Host "Test:"
Write-Host "  Invoke-RestMethod http://127.0.0.1:8085/health -Headers @{ Host='logistics.local' }"
Write-Host "  Invoke-RestMethod http://127.0.0.1:4020/api/v1/analytics/summary"
Write-Host ""
Write-Host "Jaeger UI: http://127.0.0.1:16686"
Write-Host "Grafana:   http://127.0.0.1:3001 (admin/admin)"
