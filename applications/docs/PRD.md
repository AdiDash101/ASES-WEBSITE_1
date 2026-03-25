# ASES member platform PRD

Date: 2026-02-03  
Owner: ASES web team  
Stack: Express.js, PostgreSQL, Prisma

## Summary
Build a secure, low-friction member platform with Google OAuth, email whitelist access, and a first-time onboarding form. Phase 1 covers onboarding and data capture before recruitment. Later phases add applications, payments, and applicant review workflows.

## Background
ASES needs a reliable member portal that starts small but can grow into a full recruitment and onboarding system. The immediate need is a gated login and onboarding flow without password management overhead.

## Goals (phase 1)
1. Google OAuth login with no passwords.
2. Email whitelist access control.
3. First-time onboarding flow for members.
4. Persist onboarding data for future features.
5. Lightweight admin tooling for whitelist management.

## Non-goals (phase 1)
1. Public applications and payment flow.
2. Applicant review panel and acceptance workflow.
3. Automated email notifications.
4. Member directory or public profiles.
5. SSO providers other than Google.

## Assumptions and constraints
1. Only Google accounts are supported for login.
2. Whitelist is the single source of truth for access.
3. Phase 1 has a short delivery window before recruitment.
4. The app is internal and does not need public SEO.
5. The onboarding question set is stable for the recruitment cycle.

## Users and roles
1. Member: can log in and complete onboarding.
2. Admin: can manage whitelist and view onboarding status.

## User stories
1. As a member, I can log in using my Google account.
2. As a member, I see a clear message if my email is not whitelisted.
3. As a new member, I am guided through onboarding after first login.
4. As a returning member, I land on the dashboard without onboarding prompts.
5. As an admin, I can add or remove emails from the whitelist.
6. As an admin, I can verify which users have completed onboarding.
7. As an admin, I can revoke access by removing an email from the whitelist.

## User flows
1. Login flow
2. User clicks “Sign in with Google”.
3. OAuth callback returns Google profile.
4. System checks email against whitelist.
5. If allowed, create or update user and establish session.
6. If blocked, show access denied screen with instructions.
7. First-time onboarding
8. After successful login, system checks `onboarding_completed_at`.
9. If missing, route to onboarding form.
10. Save responses and set completion timestamp.
11. Redirect to dashboard.
12. Returning user
13. After login, route directly to dashboard.

## Functional requirements
1. Google OAuth login flow with callback handling.
2. Whitelist check on login and block non-whitelisted emails.
3. User creation on first successful login.
4. Onboarding form presented only once per user.
5. Store onboarding responses linked to user.
6. Admin UI for whitelist management.
7. Admin view for onboarding completion status.
8. Admin ability to reset onboarding completion.
9. CSV import for whitelist seed (optional).

## Non-functional requirements
1. Secure session management and CSRF protection.
2. Input validation for all forms and APIs.
3. Data integrity via relational constraints.
4. Clear error messaging for auth failures.
5. Basic rate limiting on auth endpoints.
6. 99.5% uptime during recruitment window.

## UX requirements
1. Simple login screen with Google button.
2. Friendly rejection screen for non-whitelisted emails.
3. Onboarding form with progress indicator and save-on-submit.
4. Post-onboarding landing page with minimal dashboard content.
5. Admin whitelist UI supports add, remove, and search.
6. Empty states for no onboarding data and no whitelist entries.

## Architecture overview
1. Express API server handles auth, onboarding, and admin endpoints.
2. PostgreSQL stores users, whitelist, and onboarding responses.
3. Prisma provides schema, migrations, and typed data access.
4. Frontend can be hosted alongside Express or as a separate app.

## Data model (phase 1)
users
- id (uuid, pk)
- google_id (string, unique)
- email (string, unique)
- name (string)
- avatar_url (string, nullable)
- role (enum: member, admin)
- onboarding_completed_at (timestamp, nullable)
- created_at (timestamp)
- updated_at (timestamp)

whitelist
- id (uuid, pk)
- email (string, unique)
- added_by_user_id (uuid, fk to users)
- created_at (timestamp)

onboarding_responses
- id (uuid, pk)
- user_id (uuid, fk to users, unique)
- answers_json (jsonb)
- submitted_at (timestamp)

## Data integrity rules
1. `users.email` and `whitelist.email` are lowercase, unique.
2. `onboarding_responses.user_id` is unique to enforce single submission.
3. `whitelist.added_by_user_id` must reference an admin user.
4. Deleting a user does not delete onboarding responses.

## API endpoints (draft)
1. `GET /auth/google` start OAuth.
2. `GET /auth/google/callback` handle OAuth callback.
3. `POST /auth/logout` end session.
4. `GET /me` current user profile.
5. `GET /onboarding` fetch onboarding status.
6. `POST /onboarding` submit onboarding responses.
7. `POST /admin/onboarding/reset/:userId` reset onboarding status.
8. `GET /admin/whitelist` list whitelist.
9. `POST /admin/whitelist` add email.
10. `DELETE /admin/whitelist/:id` remove email.
11. `POST /admin/whitelist/import` import CSV.
12. `GET /admin/users` list users with onboarding status.

## Permissions and access control
1. Only admins can access admin endpoints.
2. Members can only read or write their own onboarding responses.
3. Admins can view onboarding completion status for all users.
4. Admins can reset onboarding completion for a user.

## Validation rules (draft)
1. Whitelist emails must be valid email format and lowercase.
2. Onboarding response payload must match the configured question schema.
3. Each user can submit onboarding once; resubmission requires admin reset.
4. CSV whitelist import rejects invalid or duplicate emails.

## Onboarding content
1. Questions are provided by the ASES team and stored as a JSON schema.
2. Phase 1 uses a static schema defined in code.
3. Phase 2 can move to a database-backed question editor.
4. Answers are stored as JSON with per-question ids.

## Security and privacy
1. Store only the minimum Google profile fields needed.
2. Encrypt session cookies and set `HttpOnly`, `Secure`, `SameSite=Lax`.
3. Provide a simple data deletion path for user requests.
4. Restrict CORS to known domains.
5. Rotate OAuth secrets and session secrets on a schedule.

## Sessions and auth details
1. Use server-side sessions with a signed cookie.
2. Session lifetime is 7 days with rolling refresh.
3. Logout clears server session and client cookie.
4. OAuth callback validates state and nonce values.

## Error states
1. OAuth failure shows retry option and support contact.
2. Non-whitelisted email shows access denied and instruction to contact admin.
3. Onboarding submission errors show field-level messages.
4. Admin import failures show line-level errors.

## Observability
1. Structured logs for auth and onboarding submit.
2. Basic metrics: login success rate, onboarding completion rate.
3. Error monitoring with alerts for auth failure spikes.

## Success metrics
1. 95%+ of whitelisted users can log in without support.
2. 90%+ onboarding completion within 7 days of first login.
3. Zero successful logins by non-whitelisted users.
4. Admin whitelist changes complete in under 30 seconds.

## Acceptance criteria (phase 1)
1. Whitelisted user can log in and is redirected to onboarding on first login.
2. Non-whitelisted user is blocked with a clear message.
3. Onboarding can be completed once and is stored in the database.
4. Returning users skip onboarding and land on the dashboard.
5. Admin can add or remove whitelisted emails without errors.
6. Admin can reset onboarding for a user.

## Testing plan
1. Unit tests for whitelist checks and onboarding validation.
2. Integration tests for OAuth callback and session creation.
3. End-to-end tests for first-time onboarding flow.
4. Manual smoke test checklist for admin tools.

## Deployment and environments
1. Environments: local, staging, production.
2. Database migrations run on deploy.
3. Production uses managed Postgres with automated backups.
4. Staging uses a smaller database and separate OAuth credentials.

## Configuration
1. `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
2. `SESSION_SECRET`.
3. `DATABASE_URL`.
4. `APP_BASE_URL` for OAuth redirect.
5. `ADMIN_EMAILS` seed for initial admin accounts.

## Project plan (phase 1)
1. Requirements confirmation and UI wireframes.
2. OAuth integration and user creation.
3. Whitelist enforcement and admin tools.
4. Onboarding flow and data storage.
5. Testing, polish, and deployment.

## Milestones
1. M1: requirements and UX (1 to 3 days)
2. M2: auth and user model (1 to 2 days)
3. M3: whitelist management (1 to 2 days)
4. M4: onboarding flow (2 to 4 days)
5. M5: QA and deploy (1 to 2 days)

## Risks
1. OAuth configuration delays due to Google console setup.
2. Scope creep toward full application flow.
3. Ambiguity in onboarding questions.
4. Admin access management may be unclear at launch.

## Open questions
1. What is the initial onboarding question set?
2. Who are the initial admins?
3. Should whitelist be seeded from a CSV?
4. Where will the dashboard content live in phase 1?
5. Do we need an admin reset for onboarding responses?
6. Is there a requirement for data export of onboarding responses?

## Future phases
1. Application form and payment flow.
2. Applicant review panel with accept or deny.
3. Automated acceptance emails.
4. Internship hub built on onboarding data.

## Applications module (phase 2 draft)
### Locked decisions (2026-02-11)
1. Whitelist access gating is removed; any Google user can log in.
2. Membership access is granted by application acceptance (acceptance is the new "whitelist").
3. Payment verification is manual and admin-scoped.
4. Admin decision note is optional.
5. Payment proof uploads use MinIO (S3-compatible object storage).
6. Rejected applicants can reapply in the same cycle.
7. Payment proof supports image files only (`image/jpeg`, `image/png`, `image/webp`) with max file size 10 MB.

### Core problem
Logged-in users who are not yet members need one clear path to apply to ASES and track their application status.

### Success criteria
1. 100% of logged-in non-members are routed to either application form or application status.
2. 95%+ of submitted applications persist successfully on first submit.
3. 100% of accepted and onboarded members are routed directly to the member portal.
4. Application status is visible to applicants without admin support.

### In scope (phase 2 MVP)
1. Google OAuth login remains the only sign-in method.
2. Any non-admin user can sign in without pre-approval.
3. One active application record per user for the active cycle.
4. Applicant can submit and view current status.
5. Applicant can reapply only when current status is `REJECTED`.
6. Applicant uploads proof of payment image to MinIO.
7. Admin-scoped review queue for applicants and payment proof verification.
8. Application status states: `PENDING`, `ACCEPTED`, `REJECTED`.
9. Routing logic after login based on application status and onboarding completion.
10. Minimal admin API to verify payment and set final decision.

### Explicitly out of scope (phase 2 MVP)
1. Automated payments, refunds, or billing integrations.
2. Cross-cycle application history and reapply flows.
3. Applicant scoring, comments, rubrics, or reviewer assignment.
4. Automated decision emails or notification workflows.
5. OCR or fraud detection on payment proof files.
6. Public applicant profiles or member directory.

### User states and routing
1. Logged in + `ACCEPTED` + `onboardingCompletedAt` present: route to member portal.
2. Logged in + `ACCEPTED` + `onboardingCompletedAt` missing: route to onboarding.
3. Logged in + `PENDING`: route to application status page.
4. Logged in + no application record: route to application form.
5. Logged in + `REJECTED`: route to rejected status page with next-step instructions.

### Functional requirements (phase 2 MVP)
1. Remove whitelist checks from standard OAuth login.
2. Keep admin authorization (`role = ADMIN`) for admin endpoints.
3. Allow one active application record per user.
4. Allow reapply only if current application status is `REJECTED`; reapply sets status back to `PENDING`.
5. Prevent edits while status is `PENDING` or `ACCEPTED`.
6. Generate MinIO S3-compatible pre-signed upload URLs for payment proof uploads.
7. Enforce payment proof MIME and size limits at upload URL issuance.
8. Store MinIO object key and upload metadata on application record.
9. Return application status in a single authenticated endpoint.
10. Restrict onboarding submission to users with accepted applications.
11. Provide admin endpoint to mark payment as verified.
12. Provide admin endpoint to mark applications accepted or rejected.
13. Keep `decision_note` optional on admin decision.

### Data model additions (phase 2)
applications
- id (uuid, pk)
- user_id (uuid, fk to users, unique)
- answers_json (jsonb)
- status (enum: pending, accepted, rejected)
- payment_proof_key (string, nullable)
- payment_proof_uploaded_at (timestamp, nullable)
- payment_verified_at (timestamp, nullable)
- payment_verified_by_user_id (uuid, fk to users, nullable)
- submitted_at (timestamp)
- reviewed_at (timestamp, nullable)
- reviewed_by_user_id (uuid, fk to users, nullable)
- decision_note (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)

### Data integrity rules (phase 2)
1. `applications.user_id` is unique for MVP one-active-record-per-user policy.
2. `applications.status` must be one of `PENDING`, `ACCEPTED`, `REJECTED`.
3. `payment_verified_by_user_id` and `reviewed_by_user_id` must reference admin users.
4. `decision_note` is optional and nullable.
5. Reapply is allowed only from `REJECTED` and transitions to `PENDING`.
6. Onboarding submit must fail if application status is not `ACCEPTED`.
7. Member portal access must fail if application status is not `ACCEPTED`.

### API endpoints (phase 2 draft)
1. `GET /application` get current user's application status and metadata.
2. `POST /application` submit application answers for current user.
3. `POST /application/reapply` resubmit rejected application and set status to `PENDING`.
4. `POST /application/payment-proof/upload-url` issue MinIO pre-signed upload URL.
5. `GET /admin/applications` list applications for review.
6. `POST /admin/applications/:id/payment-verify` mark payment proof verified.
7. `POST /admin/applications/:id/decision` set `ACCEPTED` or `REJECTED`.

### Permissions and access control (phase 2)
1. Applicants can read only their own application.
2. Applicants can create only one active application record; reapply is only allowed when rejected.
3. Only admins can list applications, verify payments, and set decisions.
4. Member portal access requires accepted application and completed onboarding.
5. Login is open to all Google accounts; application status controls membership access.

### Acceptance criteria (phase 2 MVP)
1. Any Google user can log in successfully without whitelist checks.
2. New logged-in user sees application form if no application exists.
3. User with pending application sees pending status and cannot access member portal.
4. Rejected user can reapply in the same cycle, and status returns to pending.
5. Applicant can upload payment proof image to MinIO and see upload status.
6. Admin can view applicants, manually verify payment proof, and set accepted or rejected.
7. Accepted and onboarded user lands in member portal.
8. Accepted but not onboarded user is routed to onboarding.
9. Rejected user sees rejection status and cannot access member portal until accepted.

### Milestones (phase 2)
1. M1: requirements finalization and application question schema (1 to 2 days)
2. M2: Prisma migration and MinIO upload integration (2 to 3 days)
3. M3: applicant UI flow and login routing logic (2 to 4 days)
4. M4: admin payment verification + decision flow and QA (1 to 2 days)

### Risks (phase 2)
1. Migrating from whitelist-first auth can regress existing login flow.
2. MinIO bucket policy or pre-signed upload misconfiguration can block payment proof uploads.
3. Manual payment verification can become an operational bottleneck during peaks.
4. Onboarding gating rules can regress existing member flow if not tested.

### Open questions (phase 2)
1. None currently. Final application question set is locked from `docs/app questions` (resolved on 2026-02-11).
