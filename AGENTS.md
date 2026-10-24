# Base44 sandbox setup

`docker-compose.base44.yml` runs this app in the Base44 sandbox. The repository
has no hosted Supabase project, so the Supabase backend it depends on
(`src/lib/supabase.ts`, `AuthContext`, `useProducts`, the contact form and the
`ai-assistant` edge function) is provided by local compose services:

| service    | purpose                                                        |
| ---------- | -------------------------------------------------------------- |
| `web`      | Vite dev server from the cloned source, host port **3000**      |
| `gateway`  | nginx in front of the Supabase API, host port 8000              |
| `auth`     | GoTrue (email/password sign-in, sign-up)                        |
| `rest`     | PostgREST (`supabase.from(...)`) over the `public` schema        |
| `functions`| Deno serving `supabase/functions/ai-assistant`                  |
| `db`       | `supabase/postgres` (has the `anon`/`authenticated` roles and `auth.uid()`) |
| `migrate`  | one-shot: applies `supabase/migrations/*.sql`                   |

## Non-obvious things

- **`supabase_admin` is the superuser.** The image demotes `postgres`, so roles
  and grants are managed as `supabase_admin` (password `postgres`). The
  `authenticator` role ships without a password; `scripts/base44-db-init.sh`
  sets it so PostgREST can connect.
- **`API_EXTERNAL_URL` has no `GOTRUE_` prefix** in the GoTrue version pinned
  here; GoTrue exits at boot without it.
- **PostgREST's image is scratch** (no shell, no curl) so it cannot have a
  healthcheck. The `gateway` healthcheck probes auth, REST *and* the edge
  function through itself instead.
- **No external credentials are required.** The AI assistant is a keyword-based
  demo (`supabase/functions/ai-assistant/index.ts`), not a real LLM call.
- **Seed guard.** Migrations run once per database volume; the init script skips
  them when `public.products` already exists so the 8 seed products are not
  duplicated on restart.
- **Contact form needs a signed-in user.** `contact_messages` is owner-scoped by
  RLS (`auth.uid() = user_id`) and only granted to `authenticated`, so an
  anonymous submit fails by design.
- **Sandbox-only Vite config.** When `BASE44_PREVIEW_MODE=1`, `vite.config.ts`
  binds `0.0.0.0`, allows the preview host names, and proxies `/auth`, `/rest`
  and `/functions` to the gateway so supabase-js stays same-origin. With the
  flag unset, Vite behaves exactly as before. `VITE_SUPABASE_URL` points at the
  preview origin (port 3000) for the same reason.

## Demo Authentication Mode

`src/lib/demoAuth.ts` + the demo branch in `src/context/AuthContext.tsx` let a
visitor sign in with any email and any non-empty password. Demo accounts never
call Supabase: the email/name live in `localStorage` (`shopai.demoAccount`), no
password is stored, and no JWT is issued.

- Enabled while `import.meta.env.DEV` is true (i.e. the preview dev server) or
  when `VITE_DEMO_AUTH=true`; `VITE_DEMO_AUTH=false` disables it anywhere.
- Production builds have `DEV=false`, so demo mode is off and real Supabase
  authentication is unchanged.
- Because demo users hold no token, PostgREST/GoTrue still enforce RLS: demo
  accounts cannot touch orders, contact messages or other user data.

## Verify it works

```sh
docker compose -f docker-compose.base44.yml ps          # all healthy
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000 # 200
curl -s localhost:8000/auth/v1/health                   # GoTrue JSON
```

Data path (replace `$ANON` with the `x-anon-key` value in the compose file):

```sh
curl -s -H "apikey: $ANON" 'localhost:8000/rest/v1/products?select=name&limit=2'
```

Edits to `src/` hot-reload; edits under `supabase/functions/` reload via Deno
`--watch`; migration changes need the `shopai_db_data` volume removed (or a new
migration file plus a restart of `migrate`).
