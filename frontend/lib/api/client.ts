import {
  ApiError,
  type AdminApplicationDetailResponse,
  type AdminApplicationsListResponse,
  type ApplicationDraftSaveResponse,
  type ApplicationGetResponse,
  type ApplicationStartResponse,
  type PaymentProofUploadUrlResponse,
  type SessionResponse,
  type SubmitOrReapplyResponse,
} from "./types";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:3001";

let csrfTokenCache: string | null = null;

const isJsonResponse = (response: Response) =>
  (response.headers.get("content-type") ?? "").includes("application/json");

const resolvePath = (path: string) => `${API_ORIGIN}${path}`;

const readApiError = async (response: Response) => {
  if (!isJsonResponse(response)) {
    throw new ApiError(response.status, "request_failed", "Request failed.");
  }

  const payload = (await response.json()) as {
    error?: { code?: string; message?: string; details?: unknown };
  };
  const code = payload.error?.code ?? "request_failed";
  const message = payload.error?.message ?? "Request failed.";
  throw new ApiError(response.status, code, message, payload.error?.details);
};

const getCsrfToken = async (forceRefresh = false) => {
  if (!forceRefresh && csrfTokenCache) {
    return csrfTokenCache;
  }

  const response = await fetch(resolvePath("/auth/csrf"), {
    credentials: "include",
  });

  if (!response.ok) {
    await readApiError(response);
  }

  const data = (await response.json()) as { csrfToken?: string };
  if (!data.csrfToken) {
    throw new ApiError(500, "missing_csrf_token", "Missing CSRF token.");
  }

  csrfTokenCache = data.csrfToken;
  return csrfTokenCache;
};

const apiFetch = async <T>(
  path: string,
  init: RequestInit = {},
  attempt = 0
): Promise<T> => {
  const method = (init.method ?? "GET").toUpperCase();
  const needsCsrf = method !== "GET" && method !== "HEAD" && method !== "OPTIONS";

  const headers = new Headers(init.headers ?? {});
  if (needsCsrf && !headers.has("X-CSRF-Token")) {
    headers.set("X-CSRF-Token", await getCsrfToken(attempt > 0));
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(resolvePath(path), {
    ...init,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    if (isJsonResponse(response)) {
      const payload = (await response.json()) as {
        error?: { code?: string; message?: string; details?: unknown };
      };

      if (payload.error?.code === "invalid_csrf_token" && attempt === 0) {
        csrfTokenCache = null;
        return apiFetch<T>(path, init, attempt + 1);
      }

      throw new ApiError(
        response.status,
        payload.error?.code ?? "request_failed",
        payload.error?.message ?? "Request failed.",
        payload.error?.details
      );
    }

    throw new ApiError(response.status, "request_failed", "Request failed.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!isJsonResponse(response)) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

export const getSession = () => apiFetch<SessionResponse>("/auth/session");

export const getApplication = () => apiFetch<ApplicationGetResponse>("/application");

export const startApplication = () =>
  apiFetch<ApplicationStartResponse>("/application/start", {
    method: "POST",
  });

export const saveApplicationDraft = (answers: Record<string, unknown>) =>
  apiFetch<ApplicationDraftSaveResponse>("/application/draft", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });

export const requestPaymentProofUploadUrl = (
  contentType: string,
  contentLength: number
) =>
  apiFetch<PaymentProofUploadUrlResponse>("/application/payment-proof/upload-url", {
    method: "POST",
    body: JSON.stringify({ contentType, contentLength }),
  });

export const submitApplication = (answers: Record<string, unknown>) =>
  apiFetch<SubmitOrReapplyResponse>("/application", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });

export const reapplyApplication = (answers: Record<string, unknown>) =>
  apiFetch<SubmitOrReapplyResponse>("/application/reapply", {
    method: "POST",
    body: JSON.stringify({ answers }),
  });

export const listAdminApplications = () =>
  apiFetch<AdminApplicationsListResponse>("/admin/applications");

export const getAdminApplication = (id: string) =>
  apiFetch<AdminApplicationDetailResponse>(`/admin/applications/${id}`);

export const verifyAdminApplicationPayment = (id: string) =>
  apiFetch<{ data: unknown }>(`/admin/applications/${id}/payment-verify`, {
    method: "POST",
  });

export const decideAdminApplication = (
  id: string,
  status: "ACCEPTED" | "REJECTED",
  decisionNote: string
) =>
  apiFetch<{ data: unknown }>(`/admin/applications/${id}/decision`, {
    method: "POST",
    body: JSON.stringify({ status, decisionNote: decisionNote.trim() || null }),
  });

export const logout = () =>
  apiFetch<void>("/auth/logout", { method: "POST" });

export { ApiError } from "./types";
