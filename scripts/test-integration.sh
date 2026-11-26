#!/usr/bin/env bash
set -euo pipefail
container_id=""
cleanup() {
  if [[ -n "$container_id" ]]; then docker rm -f "$container_id" >/dev/null; fi
}
trap cleanup EXIT
container_id=$(docker run -d --rm -e POSTGRES_USER=vault_test -e POSTGRES_PASSWORD=vault_test -e POSTGRES_DB=vault_test -p 127.0.0.1::5432 postgres:latest)
for attempt in {1..60}; do
  if docker exec "$container_id" pg_isready -U vault_test -d vault_test >/dev/null 2>&1; then break; fi
  if [[ "$attempt" == 60 ]]; then echo "Test database failed to start" >&2; exit 1; fi
  sleep 1
done
port=$(docker port "$container_id" 5432/tcp | sed -n 's/.*://p' | head -n 1)
export TEST_DATABASE_URL="postgresql://vault_test:vault_test@127.0.0.1:${port}/vault_test"
export DATABASE_URL="$TEST_DATABASE_URL"
export DATABASE_DIRECT_URL="$TEST_DATABASE_URL"
npx prisma migrate deploy
npx vitest run --config vitest.integration.config.ts
if [[ "${1:-}" == "--browser" ]]; then
  npx playwright test
fi
