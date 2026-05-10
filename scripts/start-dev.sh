#!/usr/bin/env bash
# Levanta backend y frontend (desarrollo). Uso: ./scripts/start-dev.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

_py=""
if [[ -f "$BACKEND/venv/bin/python" ]]; then
  _py="$BACKEND/venv/bin/python"
elif [[ -f "$BACKEND/venv/Scripts/python.exe" ]]; then
  _py="$BACKEND/venv/Scripts/python.exe"
else
  echo "No se encontró backend/venv con Python. Crea e instala:" >&2
  echo "  cd backend && python -m venv venv && pip install -r requirements.txt" >&2
  exit 1
fi

if [[ ! -d "$FRONTEND/node_modules" ]]; then
  echo "Aviso: ejecuta npm install en frontend/" >&2
fi

cleanup() {
  kill "$BACK_PID" "$FE_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

(
  cd "$BACKEND"
  exec "$_py" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
) &
BACK_PID=$!

(
  cd "$FRONTEND"
  exec npm run dev
) &
FE_PID=$!

echo ""
echo "Backend: http://127.0.0.1:8000  (Ctrl+C aquí cierra ambos)"
echo "Frontend: http://localhost:5173/"
echo ""
wait "$BACK_PID" "$FE_PID"
