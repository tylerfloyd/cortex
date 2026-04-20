#!/bin/bash
# Cortex startup script — builds and starts all services, then monitors logs
# Usage: ./scripts/start.sh [--no-build] [--no-logs]

set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-/opt/cortex/docker-compose.prod.yml}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUILD=true
FOLLOW_LOGS=true

for arg in "$@"; do
  case "$arg" in
    --no-build) BUILD=false ;;
    --no-logs)  FOLLOW_LOGS=false ;;
  esac
done

# Use local compose file if running from project dir
if [[ -f "$PROJECT_DIR/docker-compose.prod.yml" ]]; then
  COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[cortex]${NC} $*"; }
success() { echo -e "${GREEN}[cortex]${NC} $*"; }
warn()    { echo -e "${YELLOW}[cortex]${NC} $*"; }
error()   { echo -e "${RED}[cortex]${NC} $*" >&2; }

# ── Pre-flight checks ─────────────────────────────────────────────────────────

info "Running pre-flight checks..."

if ! command -v docker &>/dev/null; then
  error "Docker is not installed. Run: curl -fsSL https://get.docker.com | sh"
  exit 1
fi

if ! docker compose version &>/dev/null; then
  error "Docker Compose plugin not found. Run: apt install docker-compose-plugin -y"
  exit 1
fi

ENV_FILE="$(dirname "$COMPOSE_FILE")/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  error ".env not found at $ENV_FILE"
  error "Copy .env.example and fill in your values: cp .env.example .env"
  exit 1
fi

# Validate required env vars are set and non-empty
source "$ENV_FILE"

MISSING=()
for var in DB_PASSWORD OPENROUTER_API_KEY JINA_API_KEY API_KEY; do
  if [[ -z "${!var:-}" ]]; then
    MISSING+=("$var")
  fi
done

if [[ ${#MISSING[@]} -gt 0 ]]; then
  error "Missing required env vars in .env: ${MISSING[*]}"
  exit 1
fi

# Warn about obvious placeholder values
if [[ "${DB_PASSWORD:-}" == "password" ]]; then
  warn "DB_PASSWORD is still set to 'password' — change this before running in production!"
fi
if [[ "${API_KEY:-}" == "ABC123" ]]; then
  warn "API_KEY is still set to 'ABC123' — change this before running in production!"
fi
if [[ "${NEXT_PUBLIC_APP_URL:-}" == *"localhost"* ]]; then
  warn "NEXT_PUBLIC_APP_URL is still pointing to localhost. Update it to your server's IP/domain."
fi

success "Pre-flight checks passed."
echo ""

# ── Start services ────────────────────────────────────────────────────────────

cd "$(dirname "$COMPOSE_FILE")"

if [[ "$BUILD" == true ]]; then
  info "Building and starting all services (this may take a few minutes on first run)..."
  docker compose -f "$COMPOSE_FILE" up -d --build
else
  info "Starting all services (skipping build)..."
  docker compose -f "$COMPOSE_FILE" up -d
fi

echo ""
info "Waiting for services to become healthy..."

# Poll health status for up to 3 minutes
TIMEOUT=180
INTERVAL=5
ELAPSED=0
ALL_HEALTHY=false

while [[ $ELAPSED -lt $TIMEOUT ]]; do
  sleep $INTERVAL
  ELAPSED=$((ELAPSED + INTERVAL))

  # Count services that are unhealthy or still starting
  UNHEALTHY=$(docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null \
    | grep -c '"Health":"unhealthy"' || true)
  STARTING=$(docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null \
    | grep -c '"Health":"starting"' || true)

  if [[ $UNHEALTHY -gt 0 ]]; then
    error "One or more services are unhealthy. Check logs with:"
    echo "  docker compose -f $COMPOSE_FILE logs --tail=50"
    docker compose -f "$COMPOSE_FILE" ps
    exit 1
  fi

  if [[ $STARTING -eq 0 ]]; then
    ALL_HEALTHY=true
    break
  fi

  info "Still waiting... (${ELAPSED}s elapsed, ${STARTING} service(s) starting)"
done

echo ""
if [[ "$ALL_HEALTHY" == true ]]; then
  success "All services are up!"
else
  warn "Timed out waiting for health checks — services may still be starting."
fi

docker compose -f "$COMPOSE_FILE" ps
echo ""

APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost}"
success "Cortex is running at $APP_URL"
echo ""

# ── Follow logs ───────────────────────────────────────────────────────────────

if [[ "$FOLLOW_LOGS" == true ]]; then
  info "Following logs (Ctrl+C to stop)..."
  echo ""
  docker compose -f "$COMPOSE_FILE" logs -f --tail=50
fi
