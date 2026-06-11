#!/usr/bin/env bash
set -euo pipefail

# Run on the EC2 host (manually or via GitHub Actions SSH step).
# Required env vars:
#   IMAGE          - full image ref, e.g. ghcr.io/owner/calmpulse:latest
#   GHCR_USERNAME  - GitHub username for docker login
#   GHCR_TOKEN     - PAT with read:packages
# Optional:
#   CONTAINER_NAME - default: calmpulse
#   HOST_PORT      - default: 3000
#   ENV_FILE       - default: /opt/calmpulse/.env

CONTAINER_NAME="${CONTAINER_NAME:-calmpulse}"
HOST_PORT="${HOST_PORT:-3000}"
ENV_FILE="${ENV_FILE:-/opt/calmpulse/.env}"

if [[ -z "${IMAGE:-}" ]]; then
  echo "IMAGE is required"
  exit 1
fi

if [[ -z "${GHCR_USERNAME:-}" || -z "${GHCR_TOKEN:-}" ]]; then
  echo "GHCR_USERNAME and GHCR_TOKEN are required"
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing env file: ${ENV_FILE}"
  echo "Create it on the server with MONGODB_URI, JWT_SECRET, etc."
  exit 1
fi

echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USERNAME}" --password-stdin

docker pull "${IMAGE}"

docker stop "${CONTAINER_NAME}" 2>/dev/null || true
docker rm "${CONTAINER_NAME}" 2>/dev/null || true

docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart unless-stopped \
  -p "${HOST_PORT}:3000" \
  --env-file "${ENV_FILE}" \
  "${IMAGE}"

docker image prune -f

echo "Deployed ${IMAGE} as ${CONTAINER_NAME} on port ${HOST_PORT}"
docker ps --filter "name=${CONTAINER_NAME}"
