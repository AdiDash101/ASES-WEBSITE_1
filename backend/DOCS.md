# Backend implementation docs

**Overview**
This backend is an Express + TypeScript API running on Bun. It uses Passport Google OAuth for authentication, PostgreSQL for persistence, Prisma for data access, Postgres-backed sessions for production, and CSRF protection for state-changing requests. Access is gated by an email whitelist.

**Project layout**
1. `src/index.ts` boots the server.
2. `src/app.ts` configures middleware and routes.
3. `src/config/env.ts` loads and validates environment config.
4. `src/config/session.ts` configures Express sessions using Postgres.
5. `src/auth/passport.ts` defines Google OAuth logic and user provisioning.
6. `src/db/prisma.ts` exports a Prisma client singleton.
7. `src/routes/*` defines HTTP routes.
8. `src/middleware/*` contains auth guards, validation, and error handling.
9. `src/validation/schemas.ts` contains Zod request schemas.
10. `prisma/schema.prisma` defines database schema.
11. `prisma/migrations/*` contains SQL migrations.
12. `prisma/seed.ts` seeds initial admin + whitelist entries.

**Tech stack**
1. Runtime: Bun
2. Server: Express
3. Auth: Passport + Google OAuth 2.0
4. Database: PostgreSQL
5. ORM: Prisma
6. Sessions: `express-session` + `connect-pg-simple`
7. Validation: Zod
8. CSRF: `csurf`

**Runtime flow**
1. App starts in `src/index.ts` and listens on `env.PORT`.
2. `src/app.ts` sets CORS, JSON body parsing, session middleware, Passport, and CSRF.
3. Routes are registered for `/auth`, `/me`, `/onboarding`, `/admin`, and health endpoints.
4. Errors are normalized by `errorHandler`.

**Authentication flow**
1. `GET /auth/google` starts Google OAuth with `profile` and `email` scopes.
2. Google redirects to `GET /auth/google/callback`.
3. Passport strategy verifies email and checks whitelist.
4. If whitelist is empty and the email is in `ADMIN_EMAILS`, the user is bootstrapped as an admin.
5. On success, the user is created or updated in the database and stored in the session.
6. The user is redirected to `APP_ORIGIN`.

**Whitelist enforcement**
1. If the email is not in `WhitelistEntry`, login is rejected.
2. When whitelist is empty, `ADMIN_EMAILS` can bootstrap the first admin.
3. Admins can manage whitelist entries through `/admin/whitelist` endpoints.

**Session storage**
1. Sessions use `connect-pg-simple` and a `session` table in Postgres.
2. The table is created automatically on first run.
3. Cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.

**CSRF protection**
1. CSRF middleware is applied after sessions and Passport.
2. Fetch a token from `GET /auth/csrf`.
3. Send the token in the `x-csrf-token` header on POST/DELETE requests.

**Database schema**
1. `User`
2. Fields: `id`, `googleId`, `email`, `name`, `avatarUrl`, `role`, `onboardingCompletedAt`, `createdAt`, `updatedAt`
3. `WhitelistEntry`
4. Fields: `id`, `email`, `addedByUserId`, `createdAt`
5. `OnboardingResponse`
6. Fields: `id`, `userId`, `answersJson`, `submittedAt`

**Routes**
1. `GET /health` returns service status.
2. `GET /` returns a basic running message.
3. `GET /auth/google` starts OAuth.
4. `GET /auth/google/callback` handles OAuth callback.
5. `GET /auth/csrf` returns a CSRF token.
6. `GET /auth/session` returns current user or null.
7. `POST /auth/logout` clears the session.
8. `GET /me` returns the current user profile.
9. `GET /onboarding` returns onboarding completion status and answers.
10. `POST /onboarding` stores onboarding answers and marks completion.
11. `GET /admin/whitelist` lists whitelist entries.
12. `POST /admin/whitelist` adds a whitelist entry.
13. `DELETE /admin/whitelist/:id` removes a whitelist entry.
14. `POST /admin/whitelist/import` bulk-adds whitelist emails.
15. `GET /admin/users` lists users with onboarding status.
16. `POST /admin/onboarding/reset/:userId` clears onboarding for a user.

**Validation**
1. Zod schemas live in `src/validation/schemas.ts`.
2. `validateBody` and `validateParams` apply schemas on requests.
3. Whitelist create and import endpoints validate email formats.
4. Onboarding requires `answers` to be an object.

**Error responses**
1. All errors return `{ error: { code, message, details? } }`.
2. Zod errors return `code: "validation_error"` with `details`.
3. Prisma unique constraint errors return `code: "duplicate"`.
4. Prisma not found errors return `code: "not_found"`.
5. CSRF errors return `code: "invalid_csrf_token"`.

**Seed process**
1. `prisma/seed.ts` reads `ADMIN_EMAILS`.
2. For each email, a user is created if missing.
3. Each email is added to the whitelist.
4. Existing users are promoted to admin if needed.

**Migrations**
1. Initial migration is in `prisma/migrations/20260203233000_init/`.
2. SQL includes `pgcrypto` for UUID generation.

**Environment variables**
1. `NODE_ENV` defaults to `development`.
2. `PORT` defaults to `3001`.
3. `APP_ORIGIN` is used for CORS and OAuth redirect target.
4. `DATABASE_URL` is required for Prisma and sessions.
5. `SESSION_SECRET` is required in production.
6. `GOOGLE_CLIENT_ID` required for OAuth.
7. `GOOGLE_CLIENT_SECRET` required for OAuth.
8. `GOOGLE_CALLBACK_URL` must match the Google console redirect URI.
9. `ADMIN_EMAILS` is a comma-separated list for initial admins.

**Running locally**
1. `bun install`
2. `bun run prisma:generate`
3. `bun run prisma:migrate`
4. `bun run prisma:seed`
5. `bun run dev`

**Known gaps**
1. No rate limiting middleware yet.
2. No per-request logging middleware yet.
3. No onboarding question schema beyond a generic JSON object.
4. No admin UI, only API endpoints.
