# Backend implementation docs

**Overview**
This backend is an Express + TypeScript API running on Bun. It uses Passport Google OAuth for authentication, PostgreSQL for persistence, Prisma for data access, Postgres-backed sessions, and CSRF protection for state-changing requests.

Login is open to any Google account. Membership access is controlled by application status:
1. `ACCEPTED` + onboarding complete => member portal access.
2. `ACCEPTED` + onboarding incomplete => onboarding flow.
3. `PENDING` or `REJECTED` => applicant flow only.

## Project layout
1. `src/index.ts` boots the server.
2. `src/app.ts` configures middleware and routes.
3. `src/config/env.ts` loads and validates environment config.
4. `src/config/session.ts` configures Express sessions using Postgres.
5. `src/auth/passport.ts` defines Google OAuth logic and user provisioning.
6. `src/routes/*` defines HTTP routes for auth, application, onboarding, and admin tools.
7. `src/storage/minio.ts` provides MinIO pre-signed upload/view URL helpers.
8. `src/middleware/*` contains auth guards, validation, and error handling.
9. `src/validation/schemas.ts` contains Zod request schemas.
10. `prisma/schema.prisma` defines database schema.
11. `prisma/migrations/*` contains SQL migrations.
12. `prisma/seed.ts` ensures admin users from `ADMIN_EMAILS`.

## Runtime flow
1. App starts in `src/index.ts` and listens on `env.PORT`.
2. `src/app.ts` sets CORS, JSON body parsing, session middleware, Passport, and CSRF.
3. Routes are registered for `/auth`, `/me`, `/application`, `/onboarding`, `/admin`, and health endpoints.
4. Errors are normalized by `errorHandler`.

## Authentication flow
1. `GET /auth/google` starts Google OAuth with `profile` and `email` scopes.
2. Google redirects to `GET /auth/google/callback`.
3. Passport validates email and creates or updates the local user.
4. If email is listed in `ADMIN_EMAILS`, role is set to `ADMIN`.
5. On success, session is established and user is redirected to `APP_ORIGIN`.

## Application and payment flow
1. Applicant starts a draft through `POST /application/start`.
2. Applicant requests upload URL through `POST /application/payment-proof/upload-url`.
3. API returns a MinIO pre-signed `PUT` URL plus required headers.
4. Applicant submits answers through `POST /application`, which transitions status to `PENDING`.
5. Submission is blocked until required answer keys are present and payment proof is uploaded.
6. Required answer keys follow the finalized question set in `docs/app questions`.
7. Admin lists applicants via `GET /admin/applications`.
8. Admin verifies payment via `POST /admin/applications/:id/payment-verify`.
9. Admin sets final decision via `POST /admin/applications/:id/decision`.
10. Rejected applicants can resubmit via `POST /application/reapply`.

## Onboarding gate
1. `GET /onboarding` and `POST /onboarding` require authentication.
2. Non-admin users must have application status `ACCEPTED`.
3. Admin users bypass this gate.

## Database schema (current)
1. `User`: identity, role, onboarding completion fields.
2. `OnboardingResponse`: one record per user.
3. `Application`: one active record per user with status, payment proof metadata, and decision metadata.

## Routes
1. `GET /health`
2. `GET /`
3. `GET /auth/google`
4. `GET /auth/google/callback`
5. `GET /auth/csrf`
6. `GET /auth/session`
7. `POST /auth/logout`
8. `GET /me`
9. `GET /application`
10. `POST /application/start`
11. `POST /application`
12. `POST /application/reapply`
13. `POST /application/payment-proof/upload-url`
14. `GET /onboarding`
15. `POST /onboarding`
16. `GET /admin/users`
17. `GET /admin/applications`
18. `POST /admin/applications/:id/payment-verify`
19. `POST /admin/applications/:id/decision`
20. `POST /admin/onboarding/reset/:userId`

## Validation and error handling
1. Request body and params are validated with Zod.
2. Validation failures return `400` with `code: "validation_error"`.
3. Common domain errors return typed codes such as:
4. `application_not_found`, `payment_not_verified`, `cannot_reapply`, `membership_not_accepted`.
5. CSRF errors return `403` with `code: "invalid_csrf_token"`.

## Environment variables
1. `NODE_ENV`, `PORT`, `APP_ORIGIN`.
2. `DATABASE_URL`, `SESSION_SECRET`.
3. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`.
4. `ADMIN_EMAILS`.
5. `MINIO_ENDPOINT`, `MINIO_REGION`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`.
6. `MINIO_FORCE_PATH_STYLE`, `MINIO_SIGNED_URL_TTL_SECONDS`.

## Running locally
1. `bun install`
2. `bun run prisma:generate`
3. `bun run prisma:migrate`
4. `bun run prisma:seed`
5. `bun run dev`

## Known gaps
1. No automated webhook/event confirmation for successful MinIO uploads.
2. No admin UI in this repo yet; APIs are available.
3. No rate limiting middleware yet.
