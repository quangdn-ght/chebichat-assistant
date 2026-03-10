#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh — Three-phase deployment for chebichat-assistant.
#
#   Phase 1 — Build & verify locally:
#             docker compose build, spin up a local verification container,
#             wait for healthy, then tear it down.
#   Phase 2 — Push to Docker Hub:
#             docker push giahungtechnology/chebichat-assistant:latest
#   Phase 3 — Deploy to remote host:
#             SSH, docker pull, docker compose up (no rebuild).
#
# Usage:
#   ./scripts/deploy.sh [user@host]
#   Default host: ght@10.168.1.59
#
# Env-var overrides:
#   HOST             user@host target          (default: ght@10.168.1.59)
#   REMOTE_DIR       working dir on remote     (default: /home/ght/chebichat-assistant)
#   IMAGE            full Docker Hub image ref  (default: giahungtechnology/chebichat-assistant:latest)
#   APP              container name            (default: chebichat-assistant)
#   APP_PORT         port to health-check      (default: 3000)
#   HEALTH_TIMEOUT   seconds to await OK       (default: 120)
#   HEALTH_INTERVAL  poll interval (s)         (default: 5)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

HOST="${1:-${HOST:-ght@10.168.1.59}}"
REMOTE_DIR="${REMOTE_DIR:-/home/ght/chebichat-assistant}"
IMAGE="${IMAGE:-giahungtechnology/chebichat-assistant:latest}"
APP="${APP:-chebichat-assistant}"
APP_PORT="${APP_PORT:-3000}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-120}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-5}"

LOCAL_VERIFY_CONTAINER="chebichat-verify-$$"

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ── Helper: poll health of a local container ──────────────────────────────
wait_healthy_local() {
  local cname="$1"
  local timeout="$HEALTH_TIMEOUT"
  local interval="$HEALTH_INTERVAL"
  local elapsed=0

  echo "  Polling local container health (timeout ${timeout}s) ..."
  while [ "$elapsed" -lt "$timeout" ]; do
    local status
    status=$(docker inspect --format '{{.State.Health.Status}}' "$cname" 2>/dev/null || echo unknown)
    printf "  [%3ds] status=%s\n" "$elapsed" "$status"

    if [ "$status" = "healthy" ]; then
      echo "  Local container is healthy."
      return 0
    fi

    if [ "$status" = "unhealthy" ]; then
      echo "❌  Local container is unhealthy. Last 50 log lines:"
      docker logs --tail 50 "$cname"
      return 1
    fi

    sleep "$interval"
    elapsed=$(( elapsed + interval ))
  done

  echo "⚠️  Timed out waiting for local container to become healthy."
  docker logs --tail 50 "$cname"
  return 1
}

echo "===> chebichat-assistant deploy: $(date)"
echo "     image  : ${IMAGE}"
echo "     remote : ${HOST}:${REMOTE_DIR}"
echo ""

# ════════════════════════════════════════════════════════════════════════════
# PHASE 1 — Build locally and verify health
# ════════════════════════════════════════════════════════════════════════════
echo "[1/3] Building image locally ..."
cd "$PROJECT_ROOT"
docker compose build

echo ""
echo "[1/3] Verifying image health with a temporary container ..."

# Determine env file to pass into the verification container
ENV_FILE=""
if [ -f "${PROJECT_ROOT}/.env.local" ]; then
  ENV_FILE="${PROJECT_ROOT}/.env.local"
elif [ -f "${PROJECT_ROOT}/.env" ]; then
  ENV_FILE="${PROJECT_ROOT}/.env"
fi

ENV_ARG=()
if [ -n "$ENV_FILE" ]; then
  ENV_ARG=(--env-file "$ENV_FILE")
  echo "  Using env file: ${ENV_FILE}"
else
  echo "  No .env / .env.local found — starting verification container without env file."
fi

# Start temporary verification container (not exposed externally)
docker run -d --name "$LOCAL_VERIFY_CONTAINER" \
  "${ENV_ARG[@]}" \
  -p 127.0.0.1:13000:3000 \
  "$IMAGE"

# Ensure cleanup on exit
cleanup_local() {
  echo ""
  echo "  Removing local verification container ..."
  docker rm -f "$LOCAL_VERIFY_CONTAINER" &>/dev/null || true
}
trap cleanup_local EXIT

if ! wait_healthy_local "$LOCAL_VERIFY_CONTAINER"; then
  echo "❌  Local health check failed. Aborting deployment."
  exit 1
fi

echo "✅  Local build verified healthy."
# Cleanup happens via trap; remove immediately so port is freed
docker rm -f "$LOCAL_VERIFY_CONTAINER" &>/dev/null || true
trap - EXIT

# ════════════════════════════════════════════════════════════════════════════
# PHASE 2 — Push image to Docker Hub
# ════════════════════════════════════════════════════════════════════════════
echo ""
echo "[2/3] Pushing ${IMAGE} to Docker Hub ..."
docker push "$IMAGE"
echo "✅  Image pushed."

# ════════════════════════════════════════════════════════════════════════════
# PHASE 3 — Deploy to remote host
# ════════════════════════════════════════════════════════════════════════════
echo ""
echo "[3/3] Deploying to ${HOST}:${REMOTE_DIR} ..."

# ── 3a. Ensure remote directory and sync compose file + env ───────────────
ssh "$HOST" mkdir -p "$REMOTE_DIR"

echo "  Syncing docker-compose.yml to remote ..."
scp "${PROJECT_ROOT}/docker-compose.yml" "${HOST}:${REMOTE_DIR}/docker-compose.yml"

echo "  Uploading env file ..."
if [ -f "${PROJECT_ROOT}/.env.local" ]; then
  scp "${PROJECT_ROOT}/.env.local" "${HOST}:${REMOTE_DIR}/.env"
  echo "  .env.local → ${REMOTE_DIR}/.env"
elif [ -f "${PROJECT_ROOT}/.env" ]; then
  scp "${PROJECT_ROOT}/.env" "${HOST}:${REMOTE_DIR}/.env"
  echo "  .env → ${REMOTE_DIR}/.env"
else
  echo "  No local .env / .env.local found — relying on existing ${REMOTE_DIR}/.env on server."
fi

# ── 3b. Pull image and recreate container on remote ───────────────────────
ssh "$HOST" bash -s <<ENDSSH
  set -euo pipefail
  cd ${REMOTE_DIR}

  if ! docker info &>/dev/null; then
    echo "ERROR: Docker daemon is not running on the remote server."
    exit 1
  fi

  echo "  Pulling latest image: ${IMAGE} ..."
  docker pull ${IMAGE}

  echo "  Recreating container ..."
  docker compose up -d --no-build --remove-orphans

  echo "  Pruning dangling images ..."
  docker image prune -f
ENDSSH

# ── 3c. Remote health check ───────────────────────────────────────────────
echo ""
echo "  Waiting for remote container to be healthy ..."

ssh "$HOST" bash -s <<ENDSSH
  set +e
  timeout=${HEALTH_TIMEOUT}
  interval=${HEALTH_INTERVAL}
  elapsed=0

  echo "  Polling health status (timeout \${timeout}s) ..."
  while [ \$elapsed -lt \$timeout ]; do
    status=\$(docker inspect --format '{{.State.Health.Status}}' ${APP} 2>/dev/null || echo unknown)
    http_ok=false
    curl -sf "http://localhost:${APP_PORT}/api/config" -o /dev/null 2>/dev/null && http_ok=true

    printf "  [%3ds] container=%-12s http=%s\n" \$elapsed "\${status}" "\$http_ok"

    if [ "\$status" = "healthy" ] && [ "\$http_ok" = "true" ]; then
      echo ""
      echo "✅  Deployment successful! App is live at http://${HOST##*@}:${APP_PORT}"
      exit 0
    fi

    if [ "\$status" = "unhealthy" ]; then
      echo ""
      echo "❌  Remote container is unhealthy. Last 50 log lines:"
      docker logs --tail 50 ${APP}
      exit 1
    fi

    sleep \$interval
    elapsed=\$(( elapsed + interval ))
  done

  echo ""
  echo "⚠️  Timed out after \${timeout}s waiting for healthy status."
  echo "   container: \$(docker inspect --format '{{.State.Health.Status}}' ${APP} 2>/dev/null || echo 'not found')"
  echo "   Last 50 log lines:"
  docker logs --tail 50 ${APP}
  exit 1
ENDSSH
