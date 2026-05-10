# Levanta backend (FastAPI) y frontend (Vite) en ventanas nuevas de consola.
# Uso (desde la raíz del repo):
#   .\scripts\start-dev.ps1
# Requisitos: backend\venv con dependencias, frontend con node_modules (npm install).

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $RepoRoot "backend"
$Frontend = Join-Path $RepoRoot "frontend"
$Python = Join-Path $Backend "venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
    Write-Host "No se encontró $Python" -ForegroundColor Red
    Write-Host "Crea el entorno e instala dependencias:" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor Gray
    Write-Host "  python -m venv venv" -ForegroundColor Gray
    Write-Host "  .\venv\Scripts\pip install -r requirements.txt" -ForegroundColor Gray
    exit 1
}

if (-not (Test-Path (Join-Path $Frontend "node_modules"))) {
    Write-Host "Aviso: no hay frontend/node_modules. Ejecuta: cd frontend; npm install" -ForegroundColor Yellow
}

$backendCmd = "& '$Python' -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
Start-Process powershell.exe -WorkingDirectory $Backend -ArgumentList @(
    "-NoExit", "-NoProfile", "-Command", $backendCmd
)

Start-Process powershell.exe -WorkingDirectory $Frontend -ArgumentList @(
    "-NoExit", "-NoProfile", "-Command", "npm run dev"
)

Write-Host ""
Write-Host "Se abrieron dos ventanas: backend y frontend." -ForegroundColor Green
Write-Host "  API:    http://127.0.0.1:8000  (docs: /docs)" -ForegroundColor Cyan
Write-Host "  App:    http://localhost:5173/" -ForegroundColor Cyan
Write-Host ""
