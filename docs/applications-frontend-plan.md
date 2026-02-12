# Applications Frontend Plan (Next.js)

Date: 2026-02-11  
Owner: Frontend team

## Inputs
- Brand guidance: `docs/brandguide.md`
- Application questions: `docs/app questions`
- API contracts: `backend/src/routes/application.ts`, `backend/src/routes/auth.ts`, `backend/src/routes/onboarding.ts`

## 1. MVP Scope (v1)

### Core problem
Logged-in applicants need one clear, branded portal to start, complete, submit, and track their ASES application.

### In scope
1. Applicant portal route for authenticated users.
2. Application start flow (`POST /application/start`).
3. Multi-section form aligned to `docs/app questions`.
4. Payment proof upload (image only, max 10 MB).
5. Submit flow for draft applications (`POST /application`).
6. Reapply flow for rejected applications (`POST /application/reapply`).
7. Status tracking for `DRAFT`, `PENDING`, `REJECTED`, `ACCEPTED`.
8. Server-side autosave for partial draft answers (`POST /application/draft`).
9. Admin review dashboard and decision tools.
10. Clear CTA to onboarding when accepted.
11. Mobile-first responsive layout and accessible form states.
12. Light, intentional motion with reduced-motion support.

### Explicitly out of scope (v1)
1. Email/SMS notifications.
2. Multi-language support.
3. Public-facing application marketing pages.
4. Analytics dashboards beyond basic event hooks.

## 2. UX Flow

1. User opens `/application`.
2. App checks `GET /auth/session`.
3. If signed out: show sign-in CTA (`/auth/google`).
4. If signed in: load `GET /application`.
5. If `hasApplication = false`: show "Start application" CTA.
6. After start: show 4-step portal form.
7. User completes required fields and uploads payment proof.
8. User submits:
   - Draft -> `POST /application`
   - Rejected -> `POST /application/reapply`
9. Status screen updates:
   - `PENDING`: under review state
   - `REJECTED`: feedback + edit and resubmit path
   - `ACCEPTED`: success state + onboarding CTA

## 3. Information Architecture (Next.js App Router)

```text
frontend/
  app/
    application/
      page.tsx
      loading.tsx
      error.tsx
  components/
    application/
      ApplicationPortalShell.tsx
      ApplicationStatusBanner.tsx
      ApplicationStepper.tsx
      PersonalDetailsSection.tsx
      QuestionsSection.tsx
      PaymentSection.tsx
      ReviewSubmitSection.tsx
      PaymentProofUploader.tsx
  lib/
    api/
      client.ts
      auth.ts
      application.ts
    application/
      schema.ts
      draft-storage.ts
      status.ts
      questions.ts
  styles/
    tokens.css
```

## 4. UI Structure

### Page layout
1. Header band (title + short action-oriented copy).
2. Status banner (current application state).
3. Main content:
   - Mobile: single column
   - Desktop: form (main) + progress/status side panel
4. Footer action bar (save draft locally, upload, submit/reapply).

### Form sections (aligned to backend schema)
1. Personal details.
2. Motivational and long-form questions.
3. Membership fee and payment details.
4. Review and submit.

### Status presentation
1. `DRAFT`: editable, completion checklist shown.
2. `PENDING`: locked form + review timeline state.
3. `REJECTED`: decision state + editable resubmission.
4. `ACCEPTED`: accepted state + onboarding next-step CTA.

## 5. Brand System Implementation

### Color tokens (`styles/tokens.css`)
1. `--ases-red: #EB4428`
2. `--sky-blue: #97B6F8`
3. `--core-blue: #3F439C`
4. `--deep-navy: #251E72`

### Typography
1. Header: Cocogoose Bold (or licensed equivalent fallback).
2. Subheading: Public Sans, uppercase.
3. Body and subtext: Montserrat.

### Usage rules from brand guide
1. White text on red/blue backgrounds.
2. Navy/blue text on white backgrounds.
3. Never red text on blue background.
4. Never blue text on red background.
5. Keep generous safe margins on all breakpoints.
6. Use mascot/decorative lines sparingly.

## 6. Motion and Interaction Rules

1. Use transform/opacity transitions only.
2. Entry animation: 240-320 ms, ease-out, subtle upward fade.
3. Interaction animations (buttons, inputs): 120-180 ms.
4. Step transitions: 180-220 ms crossfade/slide.
5. Respect `prefers-reduced-motion` by disabling non-essential animation.
6. Avoid continuous looping animations in form contexts.

## 7. Data and API Integration

### Client integration rules
1. Use `credentials: "include"` for all backend requests.
2. Fetch CSRF token from `GET /auth/csrf`.
3. Send `X-CSRF-Token` for all POST requests.
4. Retry once on `invalid_csrf_token` by refreshing CSRF token.

### Endpoints used
1. `GET /auth/session`
2. `GET /auth/csrf`
3. `GET /application`
4. `POST /application/start`
5. `POST /application/draft`
6. `POST /application/payment-proof/upload-url`
7. `POST /application`
8. `POST /application/reapply`
9. `GET /admin/applications`
10. `GET /admin/applications/:id`
11. `POST /admin/applications/:id/payment-verify`
12. `POST /admin/applications/:id/decision`

### Payment proof upload flow
1. Validate MIME (`image/jpeg`, `image/png`, `image/webp`) and size (<= 10 MB).
2. Request signed upload URL from backend.
3. Upload file directly with returned headers.
4. Show completion/error state and allow re-upload before submission.

## 8. Validation and Draft Strategy

1. Mirror backend `applicationAnswersSchema` on frontend for immediate field errors.
2. Save partial edits to backend via `POST /application/draft` (debounced autosave).
3. Reflect latest server draft on page reload.
4. Show checklist from backend `missingRequiredFields` when available.

## 9. Performance Baseline

1. Keep page shell server-rendered; isolate form logic in client components.
2. Load heavy/non-critical modules with dynamic import.
3. Parallelize initial fetches where possible.
4. Avoid large UI libraries for simple animations.
5. Keep bundle focused on application portal needs only.

## 10. Delivery Phases

### Phase 1: Foundation
1. Create route and shell layout.
2. Add brand tokens, fonts, and base responsive grid.
3. Add auth/session gate UI.

### Phase 2: Form and Upload
1. Implement all form sections.
2. Add frontend validation and server-side draft autosave.
3. Implement payment proof upload flow.

### Phase 3: Submission and Status
1. Implement submit/reapply actions.
2. Add status-specific UI states.
3. Add accepted -> onboarding CTA.

### Phase 4: Admin Review
1. Build admin applications list and detail view.
2. Add payment verification and decision actions.
3. Show answer payload and payment proof preview.

### Phase 5: Polish and QA
1. Motion pass and reduced-motion coverage.
2. Accessibility pass (labels, focus states, keyboard navigation, contrast).
3. Error-state QA (network, csrf, upload failures, 409 conflicts).

## 11. Definition of Done (MVP)

1. User can complete required fields, autosave drafts server-side, and upload payment proof on mobile and desktop.
2. User can submit draft applications and reapply rejected ones.
3. UI clearly reflects `DRAFT`, `PENDING`, `REJECTED`, `ACCEPTED`.
4. Admin can review submitted applications, verify payment, and decide accepted/rejected.
5. Brand guide color/typography rules are applied correctly.
6. Animations are clean, minimal, and reduced-motion compliant.

## 12. Open decisions

1. Confirm Cocogoose web licensing/source for production use.
2. Confirm whether `decisionNote` should be shown to rejected applicants in v1 UI.
