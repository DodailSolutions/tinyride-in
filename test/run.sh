#!/usr/bin/env bash
# Compile + smoke test the v3 schema on a local PostgreSQL instance.
set -euo pipefail
DB=${1:-tinyride_test}
DIR=$(cd "$(dirname "$0")/.." && pwd)

sudo -u postgres psql -qc "drop database if exists $DB;" >/dev/null
sudo -u postgres psql -qc "create database $DB;" >/dev/null

run() { sudo -u postgres psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$1"; }

run "$DIR/sql/00_extensions_helpers.sql"
run "$DIR/test/00_supabase_stub.sql"
PGMAJOR=$(sudo -u postgres psql -Atqc "show server_version_num" | cut -c1-2)
for f in "$DIR"/sql/0[1-9]_*.sql "$DIR"/sql/10_*.sql; do
  echo "--- $f"
  if [ "$PGMAJOR" -lt 15 ]; then
    # security_invoker views need PG15+ (Supabase runs 15/17); strip for local PG14.
    tmp=$(mktemp /tmp/tinyride_XXXX.sql); chmod a+r "$tmp"
    sed 's/^with (security_invoker = true) as$/as/' "$f" > "$tmp"
    run "$tmp"
  else
    run "$f"
  fi
done
echo "--- smoke tests"
run "$DIR/test/99_smoke.sql"
run "$DIR/test/99b_rls.sql"
echo "OK"
