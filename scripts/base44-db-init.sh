#!/bin/sh
# Applies the project's Supabase migrations to the local sandbox database.
# Runs once as a one-shot compose service; safe to re-run (skips when the
# application schema is already present, so the seed rows are not duplicated).
set -eu

echo "waiting for database at ${PGHOST:-db}..."
until pg_isready -q; do
  sleep 1
done

# PostgREST connects as `authenticator` and switches into the anon /
# authenticated roles, so those grants must exist before it serves requests.
psql -v ON_ERROR_STOP=1 <<'SQL'
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    create role authenticator noinherit login;
  end if;
end
$$;
-- The image ships its own `authenticator` role; align its password with
-- PGRST_DB_URI.
alter role authenticator with login password 'postgres';
grant anon, authenticated, service_role to authenticator;
grant usage on schema auth to anon, authenticated, service_role;
SQL

if [ "$(psql -tAc "select to_regclass('public.products')")" != "" ]; then
  echo "application schema already applied"
  exit 0
fi

for f in /migrations/*.sql; do
  echo "applying $f"
  psql -v ON_ERROR_STOP=1 -f "$f"
done

echo "migrations applied"
