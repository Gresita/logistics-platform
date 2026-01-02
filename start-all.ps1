# start-all.ps1
$ErrorActionPreference = "Stop"

$ROOT = "C:\Users\Lenovo\Desktop\together\logistics-platform"
$TRACKING = Join-Path $ROOT "services\tracking-service"
$SHIPMENT = Join-Path $ROOT "services\shipment-service"
$PY = "C:\Users\Lenovo\AppData\Local\Programs\Python\Python312\python.exe"

function Test-ContainerRunning($name, $runCmd) {
  $running = docker ps --format "{{.Names}}" | Select-String -SimpleMatch $name
  if (-not $running) {
    $exists = docker ps -a --format "{{.Names}}" | Select-String -SimpleMatch $name
    if ($exists) { docker rm -f $name | Out-Null }
    Invoke-Expression $runCmd | Out-Null
  }
}

Write-Host "==> Starting INFRA (Kafka/Zookeeper) ..."
Set-Location $ROOT
docker compose -f .\docker-compose.infra.yml up -d | Out-Null

Write-Host "==> Ensuring MySQL (tracking) on host port 3307 ..."
Test-ContainerRunning "logistics-mysql" @"
docker run -d --name logistics-mysql `
  -e MYSQL_ROOT_PASSWORD=root `
  -e MYSQL_DATABASE=tracking `
  -e MYSQL_USER=app `
  -e MYSQL_PASSWORD=app `
  -p 3307:3306 `
  mysql:8.0 --default-authentication-plugin=mysql_native_password
"@

Write-Host "==> Ensuring MySQL (shipments) on host port 3308 ..."
Test-ContainerRunning "shipments-mysql" @"
docker run -d --name shipments-mysql `
  -e MYSQL_ROOT_PASSWORD=root `
  -e MYSQL_DATABASE=shipments `
  -e MYSQL_USER=app `
  -e MYSQL_PASSWORD=app `
  -p 3308:3306 `
  mysql:8.0 --default-authentication-plugin=mysql_native_password
"@

Write-Host "==> Waiting ports (Kafka 9092, MySQL 3307/3308) ..."
$ports = @(9092,3307,3308)
foreach ($p in $ports) {
  for ($i=0; $i -lt 30; $i++) {
    $ok = Test-NetConnection 127.0.0.1 -Port $p -WarningAction SilentlyContinue
    if ($ok.TcpTestSucceeded) { break }
    Start-Sleep -Seconds 1
  }
}

Write-Host "==> Starting TRACKING service (4002) ..."
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd `"$TRACKING`"; if (!(Test-Path .\.venv)) { & `"$PY`" -m venv .venv }; .\.venv\Scripts\python.exe -m pip install -r requirements.txt; .\.venv\Scripts\python.exe -m pip install alembic; .\.venv\Scripts\alembic.exe -c alembic.ini upgrade head; .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 4002 --log-level info"
)

Write-Host "==> Starting SHIPMENT service (4001) ..."
Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd `"$SHIPMENT`"; if (!(Test-Path .\.venv)) { & `"$PY`" -m venv .venv }; .\.venv\Scripts\python.exe -m pip install -r requirements.txt; .\.venv\Scripts\python.exe -m pip install alembic; .\.venv\Scripts\alembic.exe -c alembic.ini upgrade head; .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 4001 --log-level info"
)

Write-Host ""
Write-Host "==> DONE. Test:"
Write-Host "    http://127.0.0.1:4001/health"
Write-Host "    http://127.0.0.1:4002/health"