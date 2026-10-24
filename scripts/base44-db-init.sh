#!/bin/sh
# Applies the project's Supabase migrations to the local sandbox database.
# Runs as a one-shot compose service. Migrations are tracked in
# `public.schema_migrations` so newly added files are applied on the next boot
# while already-applied files (and their seed rows) are skipped.
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
grant usage on schema extensions to anon, authenticated, service_role;
SQL

# Ledger for applied migration files.
psql -v ON_ERROR_STOP=1 -c "
create table if not exists public.schema_migrations (
  filename text primary key,
  applied_at timestamptz not null default now()
);"

# Older databases predate the ledger: if the app schema already exists, treat
# the first migration (the one that created and seeded it) as applied so its
# seed rows are not inserted twice.
if [ "$(psql -tAc "select to_regclass('public.products')")" != "" ] &&
   [ "$(psql -tAc "select count(*) from public.schema_migrations")" = "0" ]; then
  first_file="$(ls /migrations/*.sql | head -n 1)"
  psql -v ON_ERROR_STOP=1 -c \
    "insert into public.schema_migrations (filename) values ('$(basename "$first_file")') on conflict do nothing"
  echo "recorded existing schema baseline: $(basename "$first_file")"
fi

for f in /migrations/*.sql; do
  name="$(basename "$f")"
  if [ "$(psql -tAc "select count(*) from public.schema_migrations where filename = '$name'")" != "0" ]; then
    echo "already applied: $name"
    continue
  fi
  echo "applying $name"
  psql -v ON_ERROR_STOP=1 --single-transaction -f "$f"
  psql -v ON_ERROR_STOP=1 -c \
    "insert into public.schema_migrations (filename) values ('$name') on conflict do nothing"
done

echo "migrations up to date"
