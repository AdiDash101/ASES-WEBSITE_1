"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteApplicationDraft,
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

const stepIndexByField: Record<keyof ApplicationFormState, number> = {
  description: 3,
  email: 0,
  fullName: 0,
  universityAndBranch: 0,
  currentYearLevelAndProgram: 0,
  facebookLink: 0,
  resumeOrCv: 0,
  linkedInLink: 0,
  hobbiesAndInterests: 0,
  personalWhy: 1,
  currentBuildingOrWantToBuild: 1,
  whyAsesManila: 1,
  oneToTwoYearVision: 1,
  fiveYearVision: 1,
  uniqueAboutYou: 1,
  memberType: 2,
  universityType: 2,
  amountPaid: 2,
  referenceNumber: 2,
};

const isFormFieldFilled = (
  form: ApplicationFormState,
  field: keyof ApplicationFormState
) => {
  const value = form[field];
  if (field === "amountPaid") {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0;
  }

  return typeof value === "string" && value.trim().length > 0;
};

const getFirstIncompleteStep = (
  form: ApplicationFormState,
  missingPaymentProof: boolean
) => {
  const personalComplete = requiredPersonalFields.every((field) =>
    isFormFieldFilled(form, field)
  );
  if (!personalComplete) {
    return 0;
  }

  const storyComplete = requiredStoryFields.every((field) =>
    isFormFieldFilled(form, field)
  );
  if (!storyComplete) {
    return 1;
  }

  const paymentComplete =
    requiredPaymentFields.every((field) => isFormFieldFilled(form, field)) &&
    !missingPaymentProof;
  if (!paymentComplete) {
    return 2;
  }

  return 3;
};

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

const formatSavedTime = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const now = new Date();
  const diffSeconds = Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / 1000)
  );
  if (diffSeconds < 60) {
    const unit = diffSeconds === 1 ? "second" : "seconds";
    return `${diffSeconds} ${unit} ago`;
  }

  const timeLabel = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const isSameDay = date.toDateString() === now.toDateString();

  if (isSameDay) {
    return `Today at ${timeLabel}`;
  }

  const isSameYear = date.getFullYear() === now.getFullYear();
  const dateLabel = date.toLocaleDateString(
    [],
    isSameYear
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" }
  );

  return `${dateLabel} at ${timeLabel}`;
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

const toFriendlyFieldError = (
  field: keyof ApplicationFormState,
  message?: string
): string => {
  const normalized = (message ?? "").toLowerCase();

  if (field === "email") {
    return normalized.includes("email")
      ? "Please enter a valid email address."
      : "Please enter your email address.";
  }

  if (field === "facebookLink" || field === "resumeOrCv" || field === "linkedInLink") {
    return "Please enter a valid link (include https://).";
  }

  if (field === "amountPaid") {
    return "Please enter a valid amount greater than 0.";
  }

  if (field === "memberType" || field === "universityType") {
    return "Please choose an option.";
  }

  if (normalized.includes("too big") || normalized.includes("at most")) {
    return "This response is too long. Please shorten it.";
  }

  if (
    normalized.includes("at least") ||
    normalized.includes("required") ||
    normalized.includes("expected")
  ) {
    const cleanLabel = labelByField[field]
      .replace(/\(optional\)/gi, "")
      .trim()
      .toLowerCase();
    return `Please fill in ${cleanLabel}.`;
  }

  return "Please check this answer and try again.";
};

const normalizeServerIssues = (error: ApiError): FieldErrorMap => {
  const result: FieldErrorMap = {};

  const details = error.details as
    | { issues?: Array<{ path?: Array<string | number>; message?: string }> }
    | undefined;

  for (const issue of details?.issues ?? []) {
    const key = issue.path?.[0] === "answers" ? issue.path[1] : issue.path?.[0];
    if (typeof key === "string" && key in labelByField) {
      const field = key as keyof ApplicationFormState;
      result[field] = toFriendlyFieldError(field, issue.message);
    }
  }

  return result;
};

type TextInputProps = {
  id: keyof ApplicationFormState;
  label: string;
  value: string;
  placeholder?: string;
  hint?: string;
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
  hint,
  disabled,
  error,
  onChange,
  multiline,
}: TextInputProps) => (
  <div className={styles.field}>
    <label htmlFor={id}>{label}</label>
    {hint ? <p className={styles.fieldHint}>{hint}</p> : null}
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
  const [autosaveError, setAutosaveError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isDeletingDraft, setIsDeletingDraft] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const [showSubmission, setShowSubmission] = useState(false);
  const [showDraftStatus, setShowDraftStatus] = useState(false);
  const draftTopRef = useRef<HTMLElement | null>(null);
  const [clockTick, setClockTick] = useState(() => Date.now());

  const isEditable = application?.status === "DRAFT" || application?.status === "REJECTED";
  const isSubmitted = application?.status === "PENDING" || application?.status === "ACCEPTED";

  const loadApplication = useCallback(async (shouldResetForm = true) => {
    const response = await getApplication();

    if (!response.hasApplication) {
      setHasApplication(false);
      setApplication(null);
      setAutosaveError(null);
      if (shouldResetForm) {
        setForm(emptyApplicationForm);
        setActiveStep(0);
        setShowDraftStatus(false);
      }
      setDirty(false);
      return;
    }

    setHasApplication(true);
    setApplication(response.application);
    setAutosaveError(null);
    if (shouldResetForm) {
      const hydratedForm = fromApiAnswers(response.application.answers);
      setForm(hydratedForm);
      setDirty(false);
      setShowDraftStatus(false);
      if (
        response.application.status === "DRAFT" ||
        response.application.status === "REJECTED"
      ) {
        setActiveStep(
          getFirstIncompleteStep(
            hydratedForm,
            response.application.missingPaymentProof
          )
        );
      } else {
        setActiveStep(3);
      }
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

  useEffect(() => {
    if (!application?.updatedAt) {
      return;
    }

    // Keep relative "x seconds ago" label fresh shortly after saves.
    const intervalId = window.setInterval(() => {
      setClockTick(Date.now());
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
    }, 2 * 60 * 1000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [application?.updatedAt]);

  const onFieldChange = (field: keyof ApplicationFormState, value: string) => {
    if (form[field] === value) {
      return;
    }

    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setAutosaveError(null);
    setDirty(true);
    setSuccessMessage(null);
  };

  const goToStep = useCallback((nextStep: number) => {
    setActiveStep(nextStep);
    window.requestAnimationFrame(() => {
      draftTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const openDraftStatus = useCallback(() => {
    setShowDraftStatus(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const continueFromDraftStatus = useCallback(() => {
    if (!application) {
      return;
    }

    setShowDraftStatus(false);
    goToStep(getFirstIncompleteStep(form, application.missingPaymentProof));
  }, [application, form, goToStep]);

  useEffect(() => {
    if (!autosaveReady || !dirty || !isEditable || !hasApplication) {
      return;
    }

    const persistedForm = fromApiAnswers(application?.answers ?? {});
    const hasUnsavedChanges = (
      Object.keys(emptyApplicationForm) as Array<keyof ApplicationFormState>
    ).some((field) => form[field] !== persistedForm[field]);

    if (!hasUnsavedChanges) {
      setDirty(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsAutosaving(true);
      setAutosaveError(null);

      try {
        const savedDraft = await saveApplicationDraft(toDraftPayload(form));
        setApplication((current) =>
          current
            ? {
                ...current,
                updatedAt: savedDraft.data.updatedAt,
                answers: savedDraft.data.answers,
              }
            : current
        );
        setDirty(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Draft autosave failed.";
        setAutosaveError(message);
      } finally {
        setIsAutosaving(false);
      }
    }, 900);

    return () => {
      window.clearTimeout(timer);
    };
  }, [application?.answers, autosaveReady, dirty, isEditable, hasApplication, form]);

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
          const field = key as keyof ApplicationFormState;
          nextErrors[field] = toFriendlyFieldError(field, issue.message);
        }
      }
      setFieldErrors(nextErrors);
      setErrorMessage("Please fix highlighted fields before submitting.");
      const firstFieldWithError = (
        Object.keys(nextErrors) as Array<keyof ApplicationFormState>
      ).find((field) => Boolean(nextErrors[field]));
      if (firstFieldWithError) {
        goToStep(stepIndexByField[firstFieldWithError]);
      }
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
      goToStep(3);
    } catch (error) {
      if (error instanceof ApiError) {
        const normalized = normalizeServerIssues(error);
        if (Object.keys(normalized).length > 0) {
          setFieldErrors(normalized);
          const firstFieldWithError = (
            Object.keys(normalized) as Array<keyof ApplicationFormState>
          ).find((field) => Boolean(normalized[field]));
          if (firstFieldWithError) {
            goToStep(stepIndexByField[firstFieldWithError]);
          }
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
    (field: keyof ApplicationFormState) => isFormFieldFilled(form, field),
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
    const fromPosition =
      activeStep === 0
        ? 0
        : ((activeStep + 0.5) / stepDefinitions.length) * 100;
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

  const errorStepIndexes = useMemo(() => {
    const indexes = new Set<number>();
    for (const [field, message] of Object.entries(fieldErrors) as Array<
      [keyof ApplicationFormState, string | undefined]
    >) {
      if (message) {
        indexes.add(stepIndexByField[field]);
      }
    }
    return indexes;
  }, [fieldErrors]);

  const canGoNext = activeStep < stepDefinitions.length - 1;
  const showTopStepErrorIndicator =
    Boolean(errorMessage) && (errorStepIndexes.size > 0 || activeStep === 3);
  const topErrorPrefix =
    errorStepIndexes.size > 0 ? "Fix the highlighted sections above." : "Submission blocked.";

  const autosaveStatusText = useMemo(() => {
    if (isAutosaving) {
      return "Saving draft...";
    }

    if (autosaveError) {
      return autosaveError;
    }

    const savedAtLabel = formatSavedTime(application?.updatedAt ?? null);
    if (savedAtLabel) {
      return `Last saved ${savedAtLabel}`;
    }

    return "Autosave on";
  }, [application?.updatedAt, autosaveError, clockTick, isAutosaving]);

  const deleteDraft = async () => {
    if (!application || application.status !== "DRAFT") {
      return;
    }

    const confirmed = window.confirm(
      "Delete this draft application? This cannot be undone."
    );
    if (!confirmed) {
      return;
    }

    setIsDeletingDraft(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setAutosaveError(null);
    setDirty(false);

    try {
      await deleteApplicationDraft();
      await loadApplication(true);
      setActiveStep(0);
      setUploadFile(null);
      setSuccessMessage("Application draft deleted.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete draft.";
      setErrorMessage(message);
    } finally {
      setIsDeletingDraft(false);
    }
  };

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
          <h1 className={styles.title}>Got big ideas? Let&apos;s make them real.</h1>
          <p className={styles.subtitle}>
            Thank you for your interest in ASES Manila for the 2025–2026 cycle! As the Manila chapter of <strong>Affiliated Stanford Entrepreneurial Students (ASES)</strong>, we&apos;re a global student entrepreneurship community where college students turn ideas into reality, sharpen their skills, and grow as future leaders.
          </p>
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
          <p className={styles.helper}>Sign in with Google to begin your member application.</p>
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
            We&apos;re thrilled to learn more about you and your aspirations. Applications are open throughout the year — once you submit, we&apos;ll send you an email within 5 days with next steps.
          </p>
        </header>

        {/* Data Privacy Consent */}
        <section className={styles.consentCard}>
          <h3 className={styles.consentTitle}>Data Privacy Consent</h3>
          <div className={styles.consentBody}>
            <p>
              In compliance with <strong>Republic Act 10173</strong> (Data Privacy Act of 2012), all personal information collected through this form will be utilized exclusively for documentation purposes, with your explicit consent. By proceeding, you consent to ASES Manila to:
            </p>
            <ol>
              <li>Use your personal data for the sole purpose of the ASES Manila Membership Application for the year 2025–2026;</li>
              <li>Retain your information throughout the application process for documentation purposes; and</li>
              <li>Limit access to your personal data to ASES Manila and its representatives, with necessary precautions taken to protect your information.</li>
            </ol>
            <p>All personal data will be treated with the utmost confidentiality.</p>
          </div>
        </section>

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
            By starting your application, you agree to the data privacy terms above. Your progress saves automatically.
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
              ? "Congratulations! Your application has been accepted. Welcome to ASES Manila!"
              : "Thank you for your interest! You'll receive an email within 5 days with the status of your application."}
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

  if (showDraftStatus) {
    const status = statusConfig(application.status);
    const incompleteCount =
      application.missingRequiredFields.length +
      (application.missingPaymentProof ? 1 : 0);

    return (
      <main className={styles.page}>
        <header className={styles.hero}>
          <h1 className={styles.title}>Application status</h1>
          <p className={styles.subtitle}>
            Review your current progress, then continue from the next unfinished section.
          </p>
        </header>

        <section className={styles.submittedCard}>
          <div className={styles.submittedHeader}>
            <div className={styles.submittedStatusRow}>
              <span className={`${styles.statusBadge} ${status.className}`}>
                {status.label}
              </span>
            </div>
            <h2 className={styles.submittedName}>{form.fullName || sessionUser.name}</h2>
            <p className={styles.submittedEmail}>{form.email || "Email not added yet"}</p>
          </div>

          <div className={styles.submittedMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Last Saved</span>
              <span className={styles.metaValue}>
                {formatSavedTime(application.updatedAt) ?? "Not available"}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Missing items</span>
              <span className={styles.metaValue}>
                {incompleteCount === 0 ? "Complete" : `${incompleteCount} remaining`}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Payment proof</span>
              <span className={styles.metaValue}>
                {application.missingPaymentProof ? "Missing" : "Uploaded"}
              </span>
            </div>
          </div>

          <div className={styles.submittedActions}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={continueFromDraftStatus}
            >
              Continue application
            </button>
          </div>
        </section>
      </main>
    );
  }

  /* ── Draft / Rejected — editable form ───────────── */
  return (
    <main className={styles.page}>
      {/* Compact top bar: brand + title + status + autosave */}
      <header ref={draftTopRef} className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <h1 className={styles.topBarTitle}>
            {application.status === "REJECTED" ? "Revise application" : "Application"}
          </h1>
          <span className={`${styles.statusBadge} ${statusConfig(application.status).className}`}>
            {statusConfig(application.status).label}
          </span>
        </div>
        <div className={styles.topBarRight}>
          <span
            className={`${styles.autosaveMsg} ${autosaveError ? styles.autosaveError : ""}`}
          >
            {autosaveStatusText}
          </span>
        </div>
      </header>

      {/* Only show notice for rejected — draft info is already in the top bar */}
      {application.status === "REJECTED" ? (
        <section className={`${styles.notice} ${styles.noticeWarn}`}>
          Your previous submission was rejected. Update your responses and resubmit.
        </section>
      ) : null}

      {showTopStepErrorIndicator ? (
        <section className={`${styles.notice} ${styles.noticeError}`}>
          {topErrorPrefix} {errorMessage}
        </section>
      ) : null}

      <section className={styles.workspace}>
        {/* Step tabs — compact, single-line */}
        <nav className={styles.stepNav}>
          <div className={styles.stepTabs}>
            {stepDefinitions.map((step, index) => {
              const active = index === activeStep;
              const done = stepStatus[index];
              const hasErrors = errorStepIndexes.has(index);
              return (
                <button
                  type="button"
                  key={step.label}
                  className={`${styles.stepTab} ${active ? styles.stepTabActive : ""} ${
                    done ? styles.stepTabDone : ""
                  } ${hasErrors ? styles.stepTabError : ""}`}
                  onClick={() => goToStep(index)}
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
                  {hasErrors ? <span className={styles.stepErrorBadge}>!</span> : null}
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
              <p className={styles.sectionHint}>Personal Details — tell us who you are.</p>
              <div className={styles.fieldGrid}>
                <div className={styles.inlineTwo}>
                  <TextInput
                    id="email"
                    label={labelByField.email}
                    hint="Please input your active email."
                    value={form.email}
                    onChange={onFieldChange}
                    disabled={!isEditable}
                    error={fieldErrors.email}
                  />
                  <TextInput
                    id="fullName"
                    label={labelByField.fullName}
                    hint="Example: Favila, Lynn Kelly Rapada"
                    placeholder="Last Name, First Name, Middle Name"
                    value={form.fullName}
                    onChange={onFieldChange}
                    disabled={!isEditable}
                    error={fieldErrors.fullName}
                  />
                </div>

                <TextInput
                  id="universityAndBranch"
                  label={labelByField.universityAndBranch}
                  hint="Please do not abbreviate."
                  placeholder="e.g. University of the Philippines - Diliman"
                  value={form.universityAndBranch}
                  onChange={onFieldChange}
                  disabled={!isEditable}
                  error={fieldErrors.universityAndBranch}
                />

                <TextInput
                  id="currentYearLevelAndProgram"
                  label={labelByField.currentYearLevelAndProgram}
                  hint="Please do not abbreviate."
                  placeholder="e.g. 2nd Year - BS Marketing Management"
                  value={form.currentYearLevelAndProgram}
                  onChange={onFieldChange}
                  disabled={!isEditable}
                  error={fieldErrors.currentYearLevelAndProgram}
                />

                <div className={styles.inlineTwo}>
                  <TextInput
                    id="facebookLink"
                    label={labelByField.facebookLink}
                    hint="Required."
                    placeholder="https://www.facebook.com/yourprofile"
                    value={form.facebookLink}
                    onChange={onFieldChange}
                    disabled={!isEditable}
                    error={fieldErrors.facebookLink}
                  />
                  <TextInput
                    id="linkedInLink"
                    label={labelByField.linkedInLink}
                    hint="Optional."
                    placeholder="https://www.linkedin.com/in/yourprofile"
                    value={form.linkedInLink}
                    onChange={onFieldChange}
                    disabled={!isEditable}
                    error={fieldErrors.linkedInLink}
                  />
                </div>

                <TextInput
                  id="resumeOrCv"
                  label={labelByField.resumeOrCv}
                  hint="Attach a working link to your Resume / CV. If not applicable, list your previous key projects/roles in bullet points."
                  placeholder="https://drive.google.com/..."
                  value={form.resumeOrCv}
                  onChange={onFieldChange}
                  disabled={!isEditable}
                  multiline
                  error={fieldErrors.resumeOrCv}
                />

                <TextInput
                  id="hobbiesAndInterests"
                  label={labelByField.hobbiesAndInterests}
                  value={form.hobbiesAndInterests}
                  onChange={onFieldChange}
                  disabled={!isEditable}
                  multiline
                  error={fieldErrors.hobbiesAndInterests}
                />
              </div>
            </article>
          ) : null}

          {activeStep === 1 ? (
            <article className={styles.card}>
              <p className={styles.sectionHint}>We got a few questions for you! Answer each in 3–4 sentences only.</p>
              <div className={styles.fieldGrid}>
                <TextInput
                  id="personalWhy"
                  label={labelByField.personalWhy}
                  hint="The thing that drives you to achieve great things. Tell us what motivates you and fuels your ambition."
                  value={form.personalWhy}
                  onChange={onFieldChange}
                  disabled={!isEditable}
                  multiline
                  error={fieldErrors.personalWhy}
                />

                <TextInput
                  id="currentBuildingOrWantToBuild"
                  label={labelByField.currentBuildingOrWantToBuild}
                  hint="Tell us about anything you are actively building. If you haven't started yet, share what you would like to build—and what problem you hope to solve."
                  value={form.currentBuildingOrWantToBuild}
                  onChange={onFieldChange}
                  disabled={!isEditable}
                  multiline
                  error={fieldErrors.currentBuildingOrWantToBuild}
                />

                <TextInput
                  id="whyAsesManila"
                  label={labelByField.whyAsesManila}
                  hint="Tell us why this community matters to you and how it fits into your growth journey."
                  value={form.whyAsesManila}
                  onChange={onFieldChange}
                  disabled={!isEditable}
                  multiline
                  error={fieldErrors.whyAsesManila}
                />

                <TextInput
                  id="oneToTwoYearVision"
                  label={labelByField.oneToTwoYearVision}
                  hint="Your short-term vision. What do you hope to learn, achieve, or create soon?"
                  value={form.oneToTwoYearVision}
                  onChange={onFieldChange}
                  disabled={!isEditable}
                  multiline
                  error={fieldErrors.oneToTwoYearVision}
                />

                <TextInput
                  id="fiveYearVision"
                  label={labelByField.fiveYearVision}
                  hint="Your long-term vision. How do you plan to grow and make an impact in the future?"
                  value={form.fiveYearVision}
                  onChange={onFieldChange}
                  disabled={!isEditable}
                  multiline
                  error={fieldErrors.fiveYearVision}
                />

                <TextInput
                  id="uniqueAboutYou"
                  label={labelByField.uniqueAboutYou}
                  hint="Something that sets you apart. Skills, perspectives, experiences, or qualities we can't find anywhere else."
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
              <p className={styles.sectionHint}>Application Fee &amp; Payment — kindly pay the membership fee before submitting.</p>

              {/* Fee info box */}
              <div className={styles.infoBox}>
                <p className={styles.infoBoxTitle}>Membership Fees</p>
                <ul className={styles.infoBoxList}>
                  <li>New Member from Public University — <strong>Php 250</strong></li>
                  <li>New Member from Private University — <strong>Php 350</strong></li>
                  <li>Returning Member (regardless of university) — <strong>Php 250</strong></li>
                </ul>
              </div>

              {/* Payment methods */}
              <div className={styles.infoBox}>
                <p className={styles.infoBoxTitle}>Payment Methods</p>
                <div className={styles.paymentMethods}>
                  <div>
                    <p className={styles.paymentMethodLabel}>GCash</p>
                    <p className={styles.paymentMethodValue}>Katherine Mae Duavit — 0927 686 5534</p>
                  </div>
                  <div>
                    <p className={styles.paymentMethodLabel}>BPI</p>
                    <p className={styles.paymentMethodValue}>Katherine Mae Duavit — 3089406047</p>
                  </div>
                </div>

                <div className={styles.qrGrid}>
                  <figure className={styles.qrCard}>
                    <img
                      src="/gcash_qr_ases.jpg"
                      alt="GCash payment QR code"
                      className={styles.qrImage}
                      loading="lazy"
                    />
                    <figcaption className={styles.qrCaption}>GCash QR</figcaption>
                  </figure>

                  <figure className={styles.qrCard}>
                    <img
                      src="/bpi_qr_code.jpg"
                      alt="BPI payment QR code"
                      className={styles.qrImage}
                      loading="lazy"
                    />
                    <figcaption className={styles.qrCaption}>BPI QR</figcaption>
                  </figure>
                </div>

                <div className={styles.infoBoxNote}>
                  <p>In the remarks/notes section of the transfer, include: <strong>ASES MNL - YOUR FULL NAME</strong></p>
                  <p>Limit each transaction to one membership fee payment.</p>
                  <p>Questions about payment? Contact Katherine Mae Duavit (0927 686 5534) or Facebook: Kat Duavit.</p>
                </div>
              </div>

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
                    placeholder="e.g. 350"
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

                {/* Disclaimer */}
                <div className={styles.disclaimer}>
                  <strong>Disclaimer:</strong> There are no refunds or returns for payments that are missing the remarks section (for bank-to-bank), and/or are over or under the payment. If under payment, the applicant is required to pay for the lacking amount. ASES Manila is not liable for any potential losses.
                </div>
              </div>
            </article>
          ) : null}

          {activeStep === 3 ? (
            <article className={styles.card}>
              <p className={styles.sectionHint}>Nice one, that&apos;s about it! Verify everything looks good before submitting.</p>

              <TextInput
                id="description"
                label={labelByField.description}
                hint="Anything else we should know? Tell us more about yourself, your goals, or anything you'd like to add."
                value={form.description}
                onChange={onFieldChange}
                disabled={!isEditable}
                multiline
              />

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
                  <p className={styles.reviewLabel}>Last saved</p>
                  <p className={styles.reviewValue}>
                    {formatSavedTime(application.updatedAt) ?? "Not available"}
                  </p>
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

              {/* Closing message */}
              <div className={styles.closingNote}>
                <p>
                  Thank you for answering this application form! You&apos;ll receive an email in the <strong>next 5 days</strong> letting you know the status of your application.
                </p>
                <p className={styles.closingContact}>
                  Questions? Reach out to <strong>asesmanila.team@gmail.com</strong> or contact our P&amp;E officers:
                  <br />Marco Roberto Valenton — marco.roberto.valenton@student.ateneo.edu
                  <br />Lynn Kelly Favila — lynn_kelly_favila@dlsu.edu.ph
                  <br />Eduardo Louis Zablan — eduardo.louis.zablan@student.ateneo.edu
                </p>
              </div>

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
          <div className={styles.footerActionsRow}>
            <div className={styles.footerNavActions}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={() => {
                  if (activeStep === 0) {
                    openDraftStatus();
                    return;
                  }
                  goToStep(Math.max(0, activeStep - 1));
                }}
                disabled={isDeletingDraft}
              >
                Back
              </button>

              {canGoNext ? (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnSecondary}`}
                  onClick={() =>
                    goToStep(Math.min(stepDefinitions.length - 1, activeStep + 1))
                  }
                  disabled={isDeletingDraft}
                >
                  Next step
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={!isEditable || isSubmitting || isAutosaving || isDeletingDraft}
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

            {application.status === "DRAFT" ? (
              <div className={styles.footerDangerAction}>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnDangerGhost}`}
                  onClick={deleteDraft}
                  disabled={isDeletingDraft || isAutosaving || isSubmitting || isUploading}
                >
                  {isDeletingDraft ? "Deleting application..." : "Cancel application"}
                </button>
              </div>
            ) : null}
          </div>

          {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}
          {successMessage ? <p className={styles.success}>{successMessage}</p> : null}
        </footer>
      </section>
    </main>
  );
}
