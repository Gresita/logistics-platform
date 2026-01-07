# stop-all.ps1
$ErrorActionPreference = "Stop"
cd C:\Users\Lenovo\Desktop\together\logistics-platform

kubectl delete -k .\k8s\overlays\prod
docker compose -f .\docker-compose.infra.yml down
