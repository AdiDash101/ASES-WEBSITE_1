"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getApplication,
  getSession,
  reapplyApplication,
  requestPaymentProofUploadUrl,
  saveApplicationDraft,
  startApplication,
  submitApplication,
} from "@/lib/api/client";
import { ApiError, type ApplicationSummary } from "@/lib/api/types";
import {
  applicationAnswersPayloadSchema,
  emptyApplicationForm,
  fromApiAnswers,
  labelByField,
  toDraftPayload,
  toSubmitPayload,
  type ApplicationFormState,
} from "@/lib/application/schema";
import styles from "./page.module.css";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:3001";
const PAYMENT_PROOF_MAX_BYTES = 10 * 1024 * 1024;
const PAYMENT_ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

const stepDefinitions = [
  { label: "Personal", hint: "Identity and profile" },
  { label: "Story", hint: "Your why and vision" },
  { label: "Payment", hint: "Fee and proof" },
  { label: "Review", hint: "Final check" },
] as const;

const requiredPersonalFields: Array<keyof ApplicationFormState> = [
  "email",
  "fullName",
  "universityAndBranch",
  "currentYearLevelAndProgram",
  "facebookLink",
  "resumeOrCv",
  "hobbiesAndInterests",
];

const requiredStoryFields: Array<keyof ApplicationFormState> = [
  "personalWhy",
  "currentBuildingOrWantToBuild",
  "whyAsesManila",
  "oneToTwoYearVision",
  "fiveYearVision",
  "uniqueAboutYou",
];

const requiredPaymentFields: Array<keyof ApplicationFormState> = [
  "memberType",
  "universityType",
  "amountPaid",
  "referenceNumber",
];

/* ── Answer display groups (for submitted view) ────── */
const answerSections = [
  {
    title: "Personal details",
    fields: [
      "description",
      "email",
      "fullName",
      "universityAndBranch",
      "currentYearLevelAndProgram",
      "facebookLink",
      "linkedInLink",
      "resumeOrCv",
      "hobbiesAndInterests",
    ] as Array<keyof ApplicationFormState>,
  },
  {
    title: "Your story",
    fields: [
      "personalWhy",
      "currentBuildingOrWantToBuild",
      "whyAsesManila",
      "oneToTwoYearVision",
      "fiveYearVision",
      "uniqueAboutYou",
    ] as Array<keyof ApplicationFormState>,
  },
  {
    title: "Payment and membership",
    fields: [
      "memberType",
      "universityType",
      "amountPaid",
      "referenceNumber",
    ] as Array<keyof ApplicationFormState>,
  },
];

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString();
};

const statusConfig = (status: ApplicationSummary["status"] | null) => {
  if (!status) {
    return { label: "Not started", className: "" };
  }

  if (status === "DRAFT") {
    return { label: "Draft in progress", className: styles.statusDraft };
  }

  if (status === "PENDING") {
    return { label: "Under review", className: styles.statusPending };
  }

  if (status === "REJECTED") {
    return { label: "Needs revision", className: styles.statusRejected };
  }

  return { label: "Accepted", className: styles.statusAccepted };
};

type FieldErrorMap = Partial<Record<keyof ApplicationFormState, string>>;

const normalizeServerIssues = (error: ApiError): FieldErrorMap => {
  const result: FieldErrorMap = {};

  const details = error.details as
    | { issues?: Array<{ path?: Array<string | number>; message?: string }> }
    | undefined;

  for (const issue of details?.issues ?? []) {
    const key = issue.path?.[0] === "answers" ? issue.path[1] : issue.path?.[0];
    if (typeof key === "string" && key in labelByField) {
      result[key as keyof ApplicationFormState] = issue.message ?? "Invalid value.";
    }
  }

  return result;
};

type TextInputProps = {
  id: keyof ApplicationFormState;
  label: string;
  value: string;
  placeholder?: string;
  disabled: boolean;
  error?: string;
  onChange: (field: keyof ApplicationFormState, value: string) => void;
  multiline?: boolean;
};

const TextInput = ({
  id,
  label,
  value,
  placeholder,
  disabled,
  error,
  onChange,
  multiline,
}: TextInputProps) => (
  <div className={styles.field}>
    <label htmlFor={id}>{label}</label>
    {multiline ? (
      <textarea
        id={id}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(id, event.target.value)}
      />
    ) : (
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(id, event.target.value)}
      />
    )}
    {error ? <p className={styles.error}>{error}</p> : null}
  </div>
);

/* ── Collapsible answer display row ────────────────── */
const AnswerRow = ({ label, value }: { label: string; value: string }) => {
  if (!value.trim()) {
    return null;
  }
  return (
    <div className={styles.answerRow}>
      <dt className={styles.answerLabel}>{label}</dt>
      <dd className={styles.answerValue}>{value}</dd>
    </div>
  );
};

export default function ApplicationPage() {
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);
  const [sessionUser, setSessionUser] = useState<{ id: string; name: string } | null>(null);
  const [hasApplication, setHasApplication] = useState(false);
  const [application, setApplication] = useState<ApplicationSummary | null>(null);
  const [form, setForm] = useState<ApplicationFormState>(emptyApplicationForm);
  const [dirty, setDirty] = useState(false);
  const [autosaveReady, setAutosaveReady] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [autosaveMessage, setAutosaveMessage] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const [showSubmission, setShowSubmission] = useState(false);

  const isEditable = application?.status === "DRAFT" || application?.status === "REJECTED";
  const isSubmitted = application?.status === "PENDING" || application?.status === "ACCEPTED";

  const loadApplication = useCallback(async (shouldResetForm = true) => {
    const response = await getApplication();

    if (!response.hasApplication) {
      setHasApplication(false);
      setApplication(null);
      if (shouldResetForm) {
        setForm(emptyApplicationForm);
      }
      setDirty(false);
      return;
    }

    setHasApplication(true);
    setApplication(response.application);
    if (shouldResetForm) {
      setForm(fromApiAnswers(response.application.answers));
      setDirty(false);
    }
  }, []);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const session = await getSession();
      if (!session.user) {
        setSessionUser(null);
        setHasApplication(false);
        setApplication(null);
        setForm(emptyApplicationForm);
        return;
      }

      setSessionUser({ id: session.user.id, name: session.user.name });
      await loadApplication(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load application portal.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
      setAutosaveReady(true);
    }
  }, [loadApplication]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const onFieldChange = (field: keyof ApplicationFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setDirty(true);
    setSuccessMessage(null);
  };

  useEffect(() => {
    if (!autosaveReady || !dirty || !isEditable || !hasApplication) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsAutosaving(true);
      setAutosaveMessage("Saving draft...");

      try {
        await saveApplicationDraft(toDraftPayload(form));
        setDirty(false);
        setAutosaveMessage(`Draft saved at ${new Date().toLocaleTimeString()}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Draft autosave failed.";
        setAutosaveMessage(message);
      } finally {
        setIsAutosaving(false);
      }
    }, 900);

    return () => {
      window.clearTimeout(timer);
    };
  }, [autosaveReady, dirty, isEditable, hasApplication, form]);

  const startDraft = async () => {
    setIsStarting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await startApplication();
      await loadApplication(true);
      setSuccessMessage("Application draft started. Your responses will autosave.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start application.";
      setErrorMessage(message);
    } finally {
      setIsStarting(false);
    }
  };

  const uploadPaymentProof = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!uploadFile) {
      setErrorMessage("Select a payment proof image before uploading.");
      return;
    }

    if (!PAYMENT_ALLOWED_MIME.has(uploadFile.type)) {
      setErrorMessage("Only JPEG, PNG, or WEBP files are allowed.");
      return;
    }

    if (uploadFile.size > PAYMENT_PROOF_MAX_BYTES) {
      setErrorMessage("Payment proof must be 10MB or smaller.");
      return;
    }

    setIsUploading(true);

    try {
      const signed = await requestPaymentProofUploadUrl(uploadFile.type, uploadFile.size);

      const uploadResponse = await fetch(signed.data.uploadUrl, {
        method: signed.data.method,
        headers: signed.data.requiredHeaders,
        body: uploadFile,
      });

      if (!uploadResponse.ok) {
        throw new Error("Payment proof upload failed.");
      }

      await loadApplication(false);
      setUploadFile(null);
      setSuccessMessage("Payment proof uploaded.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment proof upload failed.";
      setErrorMessage(message);
    } finally {
      setIsUploading(false);
    }
  };

  const submit = async () => {
    if (!application) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors({});

    const payload = toSubmitPayload(form);
    const validation = applicationAnswersPayloadSchema.safeParse(payload);

    if (!validation.success) {
      const nextErrors: FieldErrorMap = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && key in labelByField) {
          nextErrors[key as keyof ApplicationFormState] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setErrorMessage("Please fix highlighted fields before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (application.status === "REJECTED") {
        await reapplyApplication(validation.data);
        setSuccessMessage("Application resubmitted successfully.");
      } else {
        await submitApplication(validation.data);
        setSuccessMessage("Application submitted successfully.");
      }
      await loadApplication(true);
      setActiveStep(3);
    } catch (error) {
      if (error instanceof ApiError) {
        const normalized = normalizeServerIssues(error);
        if (Object.keys(normalized).length > 0) {
          setFieldErrors(normalized);
        }
        setErrorMessage(error.message);
      } else {
        const message = error instanceof Error ? error.message : "Unable to submit application.";
        setErrorMessage(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFieldFilled = useCallback(
    (field: keyof ApplicationFormState) => {
      const value = form[field];
      if (field === "amountPaid") {
        const amount = Number(value);
        return Number.isFinite(amount) && amount > 0;
      }

      return typeof value === "string" && value.trim().length > 0;
    },
    [form]
  );

  const stepCompletion = useMemo(() => {
    const personalComplete = requiredPersonalFields.every(isFieldFilled);
    const storyComplete = requiredStoryFields.every(isFieldFilled);
    const paymentComplete =
      requiredPaymentFields.every(isFieldFilled) && Boolean(application) && !application?.missingPaymentProof;

    return [personalComplete, storyComplete, paymentComplete];
  }, [application, isFieldFilled]);

  const reviewReady = Boolean(application?.isCompleteForSubmission);

  const stepStatus = useMemo(
    () => [stepCompletion[0], stepCompletion[1], stepCompletion[2], reviewReady],
    [reviewReady, stepCompletion]
  );

  const progressPercent = useMemo(() => {
    const fromPosition = (activeStep / (stepDefinitions.length - 1)) * 100;
    const fromCompletion = (stepStatus.filter(Boolean).length / stepDefinitions.length) * 100;
    if (application?.status === "PENDING" || application?.status === "ACCEPTED") {
      return 100;
    }
    return Math.max(fromPosition, fromCompletion);
  }, [activeStep, application?.status, stepStatus]);

  const missingFieldLabels = useMemo(() => {
    if (!application) {
      return [];
    }

    return application.missingRequiredFields.map((field) => {
      const key = field as keyof ApplicationFormState;
      return labelByField[key] ?? field;
    });
  }, [application]);

  const canGoPrev = activeStep > 0;
  const canGoNext = activeStep < stepDefinitions.length - 1;

  /* ── Loading state ──────────────────────────────── */
  if (loading) {
    return (
      <main className={styles.page}>
        <header className={styles.hero}>
          <h1 className={styles.title}>Loading...</h1>
          <div className={styles.loadingBar}>
            <div className={styles.loadingBarFill} />
          </div>
        </header>
      </main>
    );
  }

  /* ── Not signed in ──────────────────────────────── */
  if (!sessionUser) {
    return (
      <main className={styles.page}>
        <header className={styles.hero}>
          <h1 className={styles.title}>Start now, build now.</h1>
          <p className={styles.subtitle}>Sign in with Google to begin your ASES Manila application.</p>
        </header>

        <section className={styles.emptyCard}>
          <div className={styles.emptyCardIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <h2>Sign in to continue</h2>
          <p className={styles.helper}>You need an active session to access the application portal.</p>
          <a className={`${styles.btn} ${styles.btnPrimary}`} href={`${API_ORIGIN}/auth/google`}>
            Sign in with Google
          </a>
        </section>
      </main>
    );
  }

  /* ── No application yet ─────────────────────────── */
  if (!hasApplication || !application) {
    return (
      <main className={styles.page}>
        <header className={styles.hero}>
          <h1 className={styles.title}>
            Welcome, {sessionUser.name.split(" ")[0]}.
          </h1>
          <p className={styles.subtitle}>
            Ready to start your ASES Manila journey? Create a draft and fill it out at your own pace.
          </p>
        </header>

        <section className={styles.startCard}>
          <div className={styles.startCardIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <h2>Create your application</h2>
          <p className={styles.helper}>
            Your progress saves automatically. Come back anytime to continue where you left off.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={startDraft}
              disabled={isStarting}
            >
              {isStarting ? "Creating..." : "Start application"}
            </button>
          </div>
          {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
          {successMessage ? <p className={styles.success}>{successMessage}</p> : null}
        </section>
      </main>
    );
  }

  /* ── Submitted view (PENDING / ACCEPTED) ────────── */
  if (isSubmitted) {
    const status = statusConfig(application.status);
    return (
      <main className={styles.page}>
        <header className={styles.hero}>
          <h1 className={styles.title}>Your application</h1>
          <p className={styles.subtitle}>
            {application.status === "ACCEPTED"
              ? "Congratulations! Your application has been accepted."
              : "Your application has been submitted and is being reviewed."}
          </p>
        </header>

        {/* Status card */}
        <section className={styles.submittedCard}>
          <div className={styles.submittedHeader}>
            <div className={styles.submittedStatusRow}>
              <span className={`${styles.statusBadge} ${status.className}`}>
                {status.label}
              </span>
              {application.status === "ACCEPTED" && (
                <span className={styles.checkmark}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </div>
            <h2 className={styles.submittedName}>{form.fullName || sessionUser.name}</h2>
            <p className={styles.submittedEmail}>{form.email}</p>
          </div>

          <div className={styles.submittedMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Submitted</span>
              <span className={styles.metaValue}>{formatDateTime(application.submittedAt)}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Payment</span>
              <span className={styles.metaValue}>
                {application.paymentVerifiedAt
                  ? "Verified"
                  : application.missingPaymentProof
                    ? "Missing"
                    : "Uploaded"}
              </span>
            </div>
            {application.reviewedAt ? (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Reviewed</span>
                <span className={styles.metaValue}>{formatDateTime(application.reviewedAt)}</span>
              </div>
            ) : null}
          </div>

          {application.membershipGranted ? (
            <div className={styles.submittedActions}>
              <a className={`${styles.btn} ${styles.btnPrimary}`} href="/onboarding">
                Continue to onboarding
              </a>
            </div>
          ) : null}
        </section>

        {/* Collapsible submission summary */}
        <section className={styles.collapsibleSection}>
          <button
            type="button"
            className={styles.collapsibleTrigger}
            onClick={() => setShowSubmission((prev) => !prev)}
            aria-expanded={showSubmission}
          >
            <span className={styles.collapsibleTriggerText}>
              <svg
                className={`${styles.chevron} ${showSubmission ? styles.chevronOpen : ""}`}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              View your submission
            </span>
            <span className={styles.collapsibleHint}>
              {showSubmission ? "Click to hide" : "Click to expand"}
            </span>
          </button>

          {showSubmission ? (
            <div className={styles.collapsibleContent}>
              {answerSections.map((section) => (
                <div key={section.title} className={styles.answerSection}>
                  <h3 className={styles.answerSectionTitle}>{section.title}</h3>
                  <dl className={styles.answerList}>
                    {section.fields.map((field) => (
                      <AnswerRow
                        key={field}
                        label={labelByField[field]}
                        value={form[field]}
                      />
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </main>
    );
  }

  /* ── Draft / Rejected — editable form ───────────── */
  return (
    <main className={styles.page}>
      {/* Compact top bar: brand + title + status + autosave */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <h1 className={styles.topBarTitle}>
            {application.status === "REJECTED" ? "Revise application" : "Application"}
          </h1>
          <span className={`${styles.statusBadge} ${statusConfig(application.status).className}`}>
            {statusConfig(application.status).label}
          </span>
        </div>
        <div className={styles.topBarRight}>
          {autosaveMessage ? (
            <span className={styles.autosaveMsg}>{autosaveMessage}</span>
          ) : (
            <span className={styles.autosaveMsg}>Autosave on</span>
          )}
        </div>
      </header>

      {/* Only show notice for rejected — draft info is already in the top bar */}
      {application.status === "REJECTED" ? (
        <section className={`${styles.notice} ${styles.noticeWarn}`}>
          Your previous submission was rejected. Update your responses and resubmit.
        </section>
      ) : null}

      <section className={styles.workspace}>
        {/* Step tabs — compact, single-line */}
        <nav className={styles.stepNav}>
          <div className={styles.stepTabs}>
            {stepDefinitions.map((step, index) => {
              const active = index === activeStep;
              const done = stepStatus[index];
              return (
                <button
                  type="button"
                  key={step.label}
                  className={`${styles.stepTab} ${active ? styles.stepTabActive : ""} ${
                    done ? styles.stepTabDone : ""
                  }`}
                  onClick={() => setActiveStep(index)}
                >
                  <span className={styles.stepDot}>
                    {done && !active ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </span>
                  {step.label}
                </button>
              );
            })}
          </div>
          <div className={styles.stepProgress}>
            <div className={styles.stepProgressFill} style={{ width: `${progressPercent}%` }} />
          </div>
        </nav>

        <div className={styles.body}>
          {activeStep === 0 ? (
            <article className={styles.card}>
              <p className={styles.sectionHint}>Tell us who you are and where you currently are.</p>
              <div className={styles.fieldGrid}>
                <TextInput
                  id="description"
                  label={labelByField.description}
                  value={form.description}
                  onChange={onFieldChange}
                  disabled={!isEditable}
                  multiline
                />

                <div className={styles.inlineTwo}>
                  <TextInput
                    id="email"
                    label={labelByField.email}
                    value={form.email}
                    onChange={onFieldChange}
                    disabled={!isEditable}
                    error={fieldErrors.email}
                  />
                  <TextInput
                    id="fullName"
                    label={labelByField.fullName}
                    value={form.fullName}
                    onChange={onFieldChange}
                    disabled={!isEditable}
                    error={fieldErrors.fullName}
                  />
                </div>

                <TextInput
                  id="universityAndBranch"
                  label={labelByField.universityAndBranch}
                  value={form.universityAndBranch}
                  onChange={onFieldChange}
                  disabled={!isEditable}
                  error={fieldErrors.universityAndBranch}
                />

                <TextInput
                  id="currentYearLevelAndProgram"
                  label={labelByField.currentYearLevelAndProgram}
                  value={form.currentYearLevelAndProgram}
                  onChange={onFieldChange}
                  disabled={!isEditable}
                  error={fieldErrors.currentYearLevelAndProgram}
                />

                <div className={styles.inlineTwo}>
                  <TextInput
                    id="facebookLink"
                    label={labelByField.facebookLink}
                    value={form.facebookLink}
                    onChange={onFieldChange}
                    disabled={!isEditable}
                    error={fieldErrors.facebookLink}
                  />
                  <TextInput
                    id="linkedInLink"
                    label={labelByField.linkedInLink}
                    value={form.linkedInLink}
                    onChange={onFieldChange}
                    disabled={!isEditable}
                    error={fieldErrors.linkedInLink}
                  />
                </div>

                <TextInput
                  id="resumeOrCv"
                  label={labelByField.resumeOrCv}
                  value={form.resumeOrCv}
                  onChange={onFieldChange}
                  disabled={!isEditable}
                  error={fieldErrors.resumeOrCv}
                />

                <TextInput
                  id="hobbiesAndInterests"
                  label={labelByField.hobbiesAndInterests}
                  value={form.hobbiesAndInterests}
                  onChange={onFieldChange}
                  disabled={!isEditable}
                  error={fieldErrors.hobbiesAndInterests}
                />
              </div>
            </article>
          ) : null}

          {activeStep === 1 ? (
            <article className={styles.card}>
              <p className={styles.sectionHint}>Share your motivation, direction, and long-term goals.</p>
              <div className={styles.fieldGrid}>
                <TextInput
                  id="personalWhy"
                  label={labelByField.personalWhy}
                  value={form.personalWhy}
                  onChange={onFieldChange}
                  disabled={!isEditable}
                  multiline
                  error={fieldErrors.personalWhy}
                />

                <TextInput
                  id="currentBuildingOrWantToBuild"
                  label={labelByField.currentBuildingOrWantToBuild}
                  value={form.currentBuildingOrWantToBuild}
                  onChange={onFieldChange}
                  disabled={!isEditable}
                  multiline
                  error={fieldErrors.currentBuildingOrWantToBuild}
                />

                <TextInput
                  id="whyAsesManila"
                  label={labelByField.whyAsesManila}
                  value={form.whyAsesManila}
                  onChange={onFieldChange}
                  disabled={!isEditable}
                  multiline
                  error={fieldErrors.whyAsesManila}
                />

                <div className={styles.inlineTwo}>
                  <TextInput
                    id="oneToTwoYearVision"
                    label={labelByField.oneToTwoYearVision}
                    value={form.oneToTwoYearVision}
                    onChange={onFieldChange}
                    disabled={!isEditable}
                    multiline
                    error={fieldErrors.oneToTwoYearVision}
                  />
                  <TextInput
                    id="fiveYearVision"
                    label={labelByField.fiveYearVision}
                    value={form.fiveYearVision}
                    onChange={onFieldChange}
                    disabled={!isEditable}
                    multiline
                    error={fieldErrors.fiveYearVision}
                  />
                </div>

                <TextInput
                  id="uniqueAboutYou"
                  label={labelByField.uniqueAboutYou}
                  value={form.uniqueAboutYou}
                  onChange={onFieldChange}
                  disabled={!isEditable}
                  multiline
                  error={fieldErrors.uniqueAboutYou}
                />
              </div>
            </article>
          ) : null}

          {activeStep === 2 ? (
            <article className={styles.card}>
              <p className={styles.sectionHint}>Select your fee context and attach proof of payment.</p>
              <div className={styles.fieldGrid}>
                <div className={styles.inlineTwo}>
                  <div className={styles.field}>
                    <label htmlFor="memberType">{labelByField.memberType}</label>
                    <select
                      id="memberType"
                      value={form.memberType}
                      disabled={!isEditable}
                      onChange={(event) => onFieldChange("memberType", event.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="NEW">New</option>
                      <option value="RETURNING">Returning</option>
                    </select>
                    {fieldErrors.memberType ? <p className={styles.error}>{fieldErrors.memberType}</p> : null}
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="universityType">{labelByField.universityType}</label>
                    <select
                      id="universityType"
                      value={form.universityType}
                      disabled={!isEditable}
                      onChange={(event) => onFieldChange("universityType", event.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="PUBLIC">Public</option>
                      <option value="PRIVATE">Private</option>
                    </select>
                    {fieldErrors.universityType ? (
                      <p className={styles.error}>{fieldErrors.universityType}</p>
                    ) : null}
                  </div>
                </div>

                <div className={styles.inlineTwo}>
                  <TextInput
                    id="amountPaid"
                    label={labelByField.amountPaid}
                    value={form.amountPaid}
                    onChange={onFieldChange}
                    disabled={!isEditable}
                    error={fieldErrors.amountPaid}
                  />
                  <TextInput
                    id="referenceNumber"
                    label={labelByField.referenceNumber}
                    value={form.referenceNumber}
                    onChange={onFieldChange}
                    disabled={!isEditable}
                    error={fieldErrors.referenceNumber}
                  />
                </div>

                <div className={styles.uploadZone}>
                  <p className={styles.uploadLabel}>Proof of payment</p>

                  {/* Already uploaded indicator */}
                  {!application.missingPaymentProof ? (
                    <div className={styles.uploadSuccess}>
                      <span className={styles.uploadSuccessIcon}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <div>
                        <p className={styles.uploadSuccessText}>Payment proof uploaded</p>
                        <p className={styles.uploadSuccessHint}>You can upload a new file to replace it.</p>
                      </div>
                    </div>
                  ) : null}

                  {/* Upload area */}
                  <label
                    htmlFor="paymentProof"
                    className={`${styles.uploadDropzone} ${uploadFile ? styles.uploadDropzoneHasFile : ""} ${!isEditable ? styles.uploadDropzoneDisabled : ""}`}
                  >
                    <input
                      id="paymentProof"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={!isEditable}
                      className={styles.uploadHiddenInput}
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setUploadFile(file);
                      }}
                    />

                    {uploadFile ? (
                      <>
                        <span className={styles.uploadFileIcon}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </span>
                        <span className={styles.uploadFileName}>{uploadFile.name}</span>
                        <span className={styles.uploadFileSize}>
                          {(uploadFile.size / 1024).toFixed(0)} KB
                        </span>
                      </>
                    ) : (
                      <>
                        <span className={styles.uploadIcon}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                        </span>
                        <span className={styles.uploadPromptTitle}>
                          Click to select an image
                        </span>
                        <span className={styles.uploadPromptHint}>
                          JPEG, PNG, or WEBP up to 10 MB
                        </span>
                      </>
                    )}
                  </label>

                  {/* Upload button */}
                  {uploadFile ? (
                    <div className={styles.uploadActions}>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        onClick={uploadPaymentProof}
                        disabled={!isEditable || isUploading}
                      >
                        {isUploading ? (
                          <>
                            <span className={styles.spinner} />
                            Uploading...
                          </>
                        ) : (
                          "Upload payment proof"
                        )}
                      </button>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnGhost}`}
                        onClick={() => setUploadFile(null)}
                        disabled={isUploading}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : application.missingPaymentProof ? (
                    <p className={styles.uploadRequired}>Payment proof is required to submit.</p>
                  ) : null}
                </div>
              </div>
            </article>
          ) : null}

          {activeStep === 3 ? (
            <article className={styles.card}>
              <p className={styles.sectionHint}>Verify everything looks good before submitting.</p>

              <div className={styles.reviewGrid}>
                <div className={styles.reviewItem}>
                  <p className={styles.reviewLabel}>Application status</p>
                  <p className={styles.reviewValue}>{statusConfig(application.status).label}</p>
                </div>
                <div className={styles.reviewItem}>
                  <p className={styles.reviewLabel}>Payment proof</p>
                  <p className={styles.reviewValue}>{application.missingPaymentProof ? "Missing" : "Uploaded"}</p>
                </div>
                <div className={styles.reviewItem}>
                  <p className={styles.reviewLabel}>Submission readiness</p>
                  <p className={styles.reviewValue}>
                    {application.isCompleteForSubmission ? "Ready to submit" : "Still incomplete"}
                  </p>
                </div>
                <div className={styles.reviewItem}>
                  <p className={styles.reviewLabel}>Last reviewed</p>
                  <p className={styles.reviewValue}>{formatDateTime(application.reviewedAt)}</p>
                </div>
              </div>

              {missingFieldLabels.length > 0 ? (
                <ul className={styles.checklist}>
                  {missingFieldLabels.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              ) : (
                <p className={styles.success}>All required answers are present.</p>
              )}

              {application.missingPaymentProof ? (
                <p className={styles.error}>Upload payment proof in Step 3 before submitting.</p>
              ) : null}

              {application.membershipGranted ? (
                <div className={styles.actions}>
                  <a className={`${styles.btn} ${styles.btnSecondary}`} href="/onboarding">
                    Continue to onboarding
                  </a>
                </div>
              ) : null}
            </article>
          ) : null}
        </div>

        <footer className={styles.footerBar}>
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => setActiveStep((current) => Math.max(0, current - 1))}
              disabled={!canGoPrev}
            >
              Back
            </button>

            {canGoNext ? (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => setActiveStep((current) => Math.min(stepDefinitions.length - 1, current + 1))}
              >
                Next step
              </button>
            ) : (
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={!isEditable || isSubmitting || isAutosaving}
                onClick={submit}
              >
                {isSubmitting
                  ? "Submitting..."
                  : application.status === "REJECTED"
                    ? "Resubmit application"
                    : "Submit application"}
              </button>
            )}
          </div>

          {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
          {successMessage ? <p className={styles.success}>{successMessage}</p> : null}
        </footer>
      </section>
    </main>
  );
}
