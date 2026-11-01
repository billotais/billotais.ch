#!/usr/bin/env bash
# Pull the latest image (built by GitHub Actions on push to main) on the VPS and restart the container.
# Usage: npm run deploy
# Override the target with DEPLOY_HOST / DEPLOY_DIR (the folder holding compose.yml on the VPS).
set -euo pipefail

HOST="${DEPLOY_HOST:-billotais@lab.billotais.local}"
DIR="${DEPLOY_DIR:-billotais.ch/deploy}"

ssh "$HOST" "cd $DIR && docker compose pull && docker compose up -d && docker image prune -f"
echo "Deployed on $HOST"
