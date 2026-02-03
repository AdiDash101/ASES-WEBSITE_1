# ASES backend

## Setup
1. Copy `.env.example` to `.env` and update values.
2. Install dependencies: `bun install`
3. Generate Prisma client: `bun run prisma:generate`
4. Run migrations: `bun run prisma:migrate`
5. Seed admins/whitelist: `bun run prisma:seed`
6. Start dev server: `bun run dev`
7. Typecheck (optional): `bun run typecheck`

## Endpoints
- `GET /health`
- `GET /`
- `GET /auth/google`
- `GET /auth/google/callback`
- `GET /auth/csrf`
- `GET /auth/session`
- `POST /auth/logout`
- `GET /me`
- `GET /onboarding`
- `POST /onboarding`
- `GET /admin/whitelist`
- `POST /admin/whitelist`
- `DELETE /admin/whitelist/:id`
- `POST /admin/whitelist/import`
- `GET /admin/users`
- `POST /admin/onboarding/reset/:userId`

## Notes
- Set `ADMIN_EMAILS` to bootstrap the first admin when the whitelist is empty.
- CSRF tokens are required for POST/DELETE requests. Fetch a token from
  `GET /auth/csrf` and send it in the `x-csrf-token` header.
- Sessions are stored in Postgres via `connect-pg-simple` and will create a
  `session` table on first run.
- `GOOGLE_CALLBACK_URL` must exactly match an Authorized redirect URI in Google
  Cloud Console.
