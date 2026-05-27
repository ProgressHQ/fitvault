#!/bin/sh
set -e
migrate -path /app/db/migrations -database "$DATABASE_URL" up
exec node server.js
