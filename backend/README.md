# ASES backend

## Setup
1. Install prerequisites: Bun, Postgres, and a Google OAuth client (Web app).
2. Create a local database (example): `createdb ases`
3. Copy `.env.example` to `.env` and update values.
4. Install dependencies: `bun install`
5. Generate Prisma client: `bun run prisma:generate`
6. Run migrations: `bun run prisma:migrate`
7. Seed admins: `bun run prisma:seed`
8. Start dev server: `bun run dev`
9. Typecheck (optional): `bun run typecheck`

## Environment variables
1. `DATABASE_URL` Postgres connection string.
2. `SESSION_SECRET` random string for sessions.
3. `APP_ORIGIN` frontend origin for CORS and post-login redirect.
4. `GOOGLE_CLIENT_ID` Google OAuth client id.
5. `GOOGLE_CLIENT_SECRET` Google OAuth client secret.
6. `GOOGLE_CALLBACK_URL` must match Google redirect URI.
7. `ADMIN_EMAILS` comma-separated list for initial admins.
8. `MINIO_ENDPOINT` MinIO endpoint URL (for example `http://localhost:9000`).
9. `MINIO_REGION` object storage region (for example `us-east-1`).
10. `MINIO_ACCESS_KEY` MinIO access key.
11. `MINIO_SECRET_KEY` MinIO secret key.
12. `MINIO_BUCKET` bucket name for payment proof uploads.
13. `MINIO_FORCE_PATH_STYLE` set `true` for MinIO compatibility.
14. `MINIO_SIGNED_URL_TTL_SECONDS` upload URL TTL in seconds.

## Google OAuth setup
1. In Google Cloud Console, create OAuth credentials for a Web application.
2. Add `http://localhost:3000` to Authorized JavaScript origins.
3. Add `http://localhost:3001/auth/google/callback` to Authorized redirect URIs.
4. Copy the Client ID and Client Secret into `.env`.
5. Set `GOOGLE_CALLBACK_URL` to the exact redirect URI.

## Frontend tester
1. Start the frontend app in `/frontend`.
2. Set `APP_ORIGIN=http://localhost:3000` in `.env`.
3. Open `http://localhost:3000` and use the buttons to hit endpoints.

## Troubleshooting
1. If `prisma migrate dev` fails due to existing types, reset the DB:
   `bunx prisma migrate reset`
2. If OAuth fails, verify the redirect URI matches exactly.

## Endpoints
- `GET /health`
- `GET /`
- `GET /auth/google`
- `GET /auth/google/callback`
- `GET /auth/csrf`
- `GET /auth/session`
- `POST /auth/logout`
- `GET /me`
- `GET /application`
- `POST /application/start`
- `POST /application`
- `POST /application/reapply`
- `POST /application/payment-proof/upload-url`
- `GET /onboarding`
- `POST /onboarding`
- `GET /admin/users`
- `GET /admin/applications`
- `POST /admin/applications/:id/payment-verify`
- `POST /admin/applications/:id/decision`
- `POST /admin/onboarding/reset/:userId`

## Notes
- Any Google user can log in; access to member-only flows is controlled by application status.
- `ADMIN_EMAILS` allows admin role auto-assignment during login.
- CSRF tokens are required for POST/DELETE requests. Fetch a token from
  `GET /auth/csrf` and send it in the `x-csrf-token` header.
- Sessions are stored in Postgres via `connect-pg-simple` and will create a
  `session` table on first run.
- `GOOGLE_CALLBACK_URL` must exactly match an Authorized redirect URI in Google
  Cloud Console.
