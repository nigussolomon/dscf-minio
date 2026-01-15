#!/bin/sh
# Wait for DB to be ready
until nc -z "$DATABASE_HOST" "$DATABASE_PORT"; do
  echo "Waiting for Postgres..."
  sleep 2
done

# Migrate DB
bun run migration:run

# Seed DB
bun seed

# Start API
bun run start
