#!/bin/sh
set -e

# Run Prisma migrations if schema exists
if [ -f ./prisma/schema.prisma ]; then
  echo "[entrypoint] Prisma schema found, running migrations (prisma migrate deploy)..."
  # Use npx so it works with the node_modules inside the image
  npx prisma migrate deploy --schema=./prisma/schema.prisma || {
    echo "[entrypoint] prisma migrate deploy failed"
    exit 1
  }
else
  echo "[entrypoint] No prisma/schema.prisma found, skipping migrations"
fi

# Start the app
echo "[entrypoint] Starting application..."
exec node dist/main.js

