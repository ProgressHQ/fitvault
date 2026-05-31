#!/bin/sh
set -e

migrate -path /app/db/migrations -database "$DATABASE_URL" up 2>/tmp/migrate_err || {
  if grep -q "Dirty database version" /tmp/migrate_err; then
    VERSION=$(grep -oE '[0-9]+' /tmp/migrate_err | head -1)
    echo "Auto-recovering dirty migration at version $VERSION"
    migrate -path /app/db/migrations -database "$DATABASE_URL" force "$((VERSION - 1))"
    migrate -path /app/db/migrations -database "$DATABASE_URL" up
  else
    cat /tmp/migrate_err >&2
    exit 1
  fi
}

exec node server.js
