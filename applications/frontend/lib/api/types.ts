export type UserRole = "MEMBER" | "ADMIN";

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  onboardingCompletedAt: string | null;
  createdAt: string;
};

export type ApplicationStatus = "DRAFT" | "PENDING" | "ACCEPTED" | "REJECTED";

export type SessionResponse = {
  user: PublicUser | null;
};

export type ApplicationSummary = {
  id: string;
  status: ApplicationStatus;
  updatedAt: string;
  submittedAt: string;
  reviewedAt: string | null;
  paymentProofKey: string | null;
  paymentProofUploadedAt: string | null;
  paymentVerifiedAt: string | null;
  answers: Record<string, unknown>;
  canSubmit: boolean;
  canReapply: boolean;
  canUploadPaymentProof: boolean;
  membershipGranted: boolean;
  isCompleteForSubmission: boolean;
  missingRequiredFields: string[];
  missingPaymentProof: boolean;
};

export type ApplicationGetResponse =
  | {
      hasApplication: false;
      application: null;
    }
  | {
      hasApplication: true;
      application: ApplicationSummary;
    };

export type ApplicationStartResponse = {
  created: boolean;
  data: {
    id: string;
    status: ApplicationStatus;
    submittedAt: string;
    paymentProofKey?: string | null;
    paymentProofUploadedAt?: string | null;
  };
};

export type ApplicationDraftSaveResponse = {
  data: {
    id: string;
    status: ApplicationStatus;
    updatedAt: string;
    answers: Record<string, unknown>;
  };
};

export type PaymentProofUploadUrlResponse = {
  data: {
    uploadUrl: string;
    objectKey: string;
    expiresIn: number;
    method: "PUT";
    requiredHeaders: {
      "Content-Type": string;
      "Content-Length": string;
    };
    attachedToApplication: boolean;
  };
};

export type SubmitOrReapplyResponse = {
  data: {
    id: string;
    status: ApplicationStatus;
    submittedAt: string;
  };
};

export type AdminApplicationListItem = {
  id: string;
  status: ApplicationStatus;
  submittedAt: string;
  paymentProofKey: string | null;
  paymentProofUploadedAt: string | null;
  paymentVerifiedAt: string | null;
  reviewedAt: string | null;
  decisionNote: string | null;
  paymentProofViewUrl: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    onboardingCompletedAt: string | null;
  };
};

export type AdminApplicationsListResponse = {
  data: AdminApplicationListItem[];
};

export type AdminApplicationDetail = {
  id: string;
  status: ApplicationStatus;
  answersJson: Record<string, unknown>;
  answers: Record<string, unknown>;
  submittedAt: string;
  paymentProofKey: string | null;
  paymentProofUploadedAt: string | null;
  paymentVerifiedAt: string | null;
  reviewedAt: string | null;
  decisionNote: string | null;
  paymentProofViewUrl: string | null;
  user: {
    id: string;
    email: string;
    name: string;
    onboardingCompletedAt: string | null;
  };
};

export type AdminApplicationDetailResponse = {
  data: AdminApplicationDetail;
};

export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
