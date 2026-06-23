#!/usr/bin/env bash
#
# Deploy the pleymor.com homepage (index.html) to the VPS web root.
#
# /var/www/pleymor is root-owned, so we rsync to a temp file and then use
# sudo install to place it with the correct ownership/permissions.
#
# The kartz/ game is NOT deployed here — it stays served by GitHub Pages at
# https://pleymor.github.io/pleymor-github-page/kartz/
#
set -euo pipefail

HOST="pleymor@pleymor.com"
SRC="$(cd "$(dirname "$0")" && pwd)/index.html"
STAGE="/tmp/pleymor-deploy-index.html"
DEST="/var/www/pleymor/index.html"

echo "→ Uploading index.html to ${HOST}..."
rsync -avz -e ssh "${SRC}" "${HOST}:${STAGE}"

echo "→ Installing into ${DEST} (sudo)..."
ssh "${HOST}" "sudo install -m 644 -o root -g root '${STAGE}' '${DEST}' && rm -f '${STAGE}'"

echo "✓ Deployed. Live at https://pleymor.com"
