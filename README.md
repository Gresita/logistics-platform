# Logistics Platform (local dev)

## Prerequisites
- Docker Desktop
- Python 3.12
- PowerShell

## Start infra (Kafka + MySQL)
```powershell
cd "C:\Users\Lenovo\Desktop\together\logistics-platform"
docker compose -f .\docker-compose.dev.yml up -d
docker ps