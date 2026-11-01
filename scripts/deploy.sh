#!/usr/bin/env bash
# Build the site (syncing the vault first) and rsync dist/ to the VPS over NetBird.
# Usage: npm run deploy            (sync + build + upload)
#        npm run deploy -- --dry   (show what rsync would change, upload nothing)
# Override the target with DEPLOY_HOST / DEPLOY_PATH.
set -euo pipefail

HOST="${DEPLOY_HOST:-billotais@lab.billotais.local}"
REMOTE_PATH="${DEPLOY_PATH:-/srv/billotais.ch/}"

cd "$(dirname "$0")/.."

npm run build:all

[ -f dist/index.html ] || { echo "dist/index.html missing, refusing to deploy" >&2; exit 1; }

extra=()
[ "${1:-}" = "--dry" ] && extra+=(--dry-run)

rsync -az --delete --itemize-changes ${extra[@]+"${extra[@]}"} dist/ "$HOST:$REMOTE_PATH"
echo "Deployed to $HOST:$REMOTE_PATH"
