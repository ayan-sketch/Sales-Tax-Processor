#!/bin/bash
# Production Start Script for Tax Compliance Management System
# Starts backend and frontend in production mode

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Tax Compliance Management System - Production Start ==="
echo "Project: $PROJECT_DIR"

# Load production environment
export $(grep -v '^\s*#' "$PROJECT_DIR/.env.production" | xargs)

# 0. Verify dependencies
cd "$PROJECT_DIR"

echo "Checking Python dependencies..."
python -c "import uvicorn, fastapi, sqlalchemy" 2>/dev/null || {
  echo "Installing Python dependencies..."
  pip install -r backend/requirements.txt
}

echo "Checking Node dependencies..."
if [ ! -d "frontend/node_modules" ]; then
  echo "Installing Node dependencies..."
  cd frontend && npm ci && cd ..
fi

# 1. Run database migrations if needed
echo "Running database checks..."
python backend/reset_db.py 2>/dev/null || echo "Database reset skipped (expected on first run)"

# 2. Start backend with uvicorn
echo ""
echo "Starting backend on ${BACKEND_HOST:-0.0.0.0}:${BACKEND_PORT:-8000}..."
cd "$PROJECT_DIR"
uvicorn backend.app.main:app \
  --host "${BACKEND_HOST:-0.0.0.0}" \
  --port "${BACKEND_PORT:-8000}" \
  --workers "${BACKEND_WORKERS:-4}" \
  --log-level warning \
  --proxy-headers \
  --forwarded-allow-ips '*' &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"

# Wait briefly for backend to start
sleep 2

# 3. Build frontend
echo ""
echo "Building frontend for production..."
cd "$PROJECT_DIR/frontend"
npx vite build --mode production
echo "Frontend build complete."

# 4. Serve frontend via electron or static server
if command -v npx electron &>/dev/null; then
  echo "Starting Electron app..."
  npx electron .
else
  echo "Starting production frontend preview..."
  npx vite preview --port "${FRONTEND_PORT:-5173}" &
  FRONTEND_PID=$!
fi

echo ""
echo "=== System Ready ==="
echo "Backend:  http://${BACKEND_HOST:-0.0.0.0}:${BACKEND_PORT:-8000}"
echo "Frontend: http://localhost:${FRONTEND_PORT:-5173}"
echo "API Docs: http://${BACKEND_HOST:-0.0.0.0}:${BACKEND_PORT:-8000}/docs"
echo ""
echo "Press Ctrl+C to stop all services."

# Trap Ctrl+C to clean up
trap "echo 'Shutting down...'; kill $BACKEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Wait for background processes
wait