#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

if [[ -f "$SCRIPT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/.env"
  set +a
fi

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  printf '%s\n' 'Set SUPABASE_DB_URL to the Supabase PostgreSQL connection string first (in .env or environment).' >&2
  exit 1
fi

for sql_file in "$SCRIPT_DIR"/sql/0[0-9]_*.sql "$SCRIPT_DIR"/sql/10_*.sql; do
  printf '%s\n' "Applying ${sql_file##*/}..."
  psql "$SUPABASE_DB_URL" --set ON_ERROR_STOP=1 --file "$sql_file"
done

printf '%s\n' 'TinyRide schema applied successfully.'
