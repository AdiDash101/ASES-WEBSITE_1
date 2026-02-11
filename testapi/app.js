const el = (id) => document.getElementById(id);

const state = {
  apiBase: "http://localhost:3001",
  csrfToken: null,
};

const log = (label, payload) => {
  const logEl = el("log");
  const time = new Date().toISOString();
  const entry = `[${time}] ${label}\n${JSON.stringify(payload, null, 2)}\n\n`;
  logEl.textContent = entry + logEl.textContent;
};

const clearLog = () => {
  el("log").textContent = "";
};

const setApiBase = () => {
  state.apiBase = el("apiBase").value.trim().replace(/\/$/, "");
  log("config", { apiBase: state.apiBase });
};

const apiUrl = (path) => `${state.apiBase}${path}`;

const request = async (path, options = {}) => {
  const method = options.method ?? "GET";
  const headers = options.headers ? { ...options.headers } : {};

  if (options.body && typeof options.body !== "string") {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  if (method !== "GET" && method !== "HEAD" && state.csrfToken) {
    headers["X-CSRF-Token"] = state.csrfToken;
  }

  const response = await fetch(apiUrl(path), {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  log(`${method} ${path} (${response.status})`, data);
  return data;
};

const getCsrf = async () => {
  const data = await request("/auth/csrf");
  state.csrfToken = data?.csrfToken ?? null;
  el("csrfToken").textContent = state.csrfToken ?? "none";
};

const login = () => {
  window.location.href = apiUrl("/auth/google");
};

const getSession = () => request("/auth/session");
const getMe = () => request("/me");
const logout = () => request("/auth/logout", { method: "POST" });

const getOnboarding = () => request("/onboarding");

const submitOnboarding = () => {
  const raw = el("onboardingPayload").value.trim();
  let body;
  try {
    body = { answers: JSON.parse(raw) };
  } catch (error) {
    log("onboarding payload error", { error: String(error) });
    return;
  }
  return request("/onboarding", { method: "POST", body });
};

const getApplication = () => request("/application");
const startApplication = () => request("/application/start", { method: "POST" });

const submitApplication = () => {
  const raw = el("applicationPayload").value.trim();
  let body;
  try {
    body = { answers: JSON.parse(raw) };
  } catch (error) {
    log("application payload error", { error: String(error) });
    return;
  }
  return request("/application", { method: "POST", body });
};

const reapplyApplication = () => {
  const raw = el("applicationPayload").value.trim();
  let body;
  try {
    body = { answers: JSON.parse(raw) };
  } catch (error) {
    log("reapply payload error", { error: String(error) });
    return;
  }
  return request("/application/reapply", { method: "POST", body });
};

const uploadPaymentProof = async () => {
  const fileInput = el("paymentProofFile");
  const file = fileInput?.files?.[0];
  if (!file) {
    log("upload payment proof", {
      error: "Select an image file first.",
    });
    return;
  }

  const signed = await request("/application/payment-proof/upload-url", {
    method: "POST",
    body: {
      contentType: file.type,
      contentLength: file.size,
    },
  });

  const uploadUrl = signed?.data?.uploadUrl;
  if (!uploadUrl) {
    log("upload payment proof", {
      error: "Missing upload URL from API response.",
      signed,
    });
    return;
  }

  const uploadResp = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  const uploadBody = await uploadResp.text();
  log(`PUT signed-url (${uploadResp.status})`, {
    ok: uploadResp.ok,
    response: uploadBody || null,
  });
};

const listUsers = () => request("/admin/users");
const listApplications = () => request("/admin/applications");

const verifyPayment = () => {
  const id = el("verifyApplicationId").value.trim();
  if (!id) {
    log("verify payment", { error: "Missing application id" });
    return;
  }
  return request(`/admin/applications/${id}/payment-verify`, { method: "POST" });
};

const decideApplication = () => {
  const id = el("decisionApplicationId").value.trim();
  if (!id) {
    log("decision", { error: "Missing application id" });
    return;
  }
  const status = el("decisionStatus").value;
  const decisionNote = el("decisionNote").value.trim();
  return request(`/admin/applications/${id}/decision`, {
    method: "POST",
    body: {
      status,
      decisionNote: decisionNote || null,
    },
  });
};

const resetOnboarding = () => {
  const userId = el("resetUserId").value.trim();
  if (!userId) {
    log("reset onboarding", { error: "Missing user id" });
    return;
  }
  return request(`/admin/onboarding/reset/${userId}`, { method: "POST" });
};

el("setApiBase").addEventListener("click", setApiBase);
el("getCsrf").addEventListener("click", getCsrf);
el("clearLog").addEventListener("click", clearLog);
el("login").addEventListener("click", login);
el("getSession").addEventListener("click", getSession);
el("getMe").addEventListener("click", getMe);
el("logout").addEventListener("click", logout);
el("getOnboarding").addEventListener("click", getOnboarding);
el("submitOnboarding").addEventListener("click", submitOnboarding);
el("getApplication").addEventListener("click", getApplication);
el("startApplication").addEventListener("click", startApplication);
el("submitApplication").addEventListener("click", submitApplication);
el("reapplyApplication").addEventListener("click", reapplyApplication);
el("uploadPaymentProof").addEventListener("click", uploadPaymentProof);
el("listUsers").addEventListener("click", listUsers);
el("listApplications").addEventListener("click", listApplications);
el("verifyPayment").addEventListener("click", verifyPayment);
el("decideApplication").addEventListener("click", decideApplication);
el("resetOnboarding").addEventListener("click", resetOnboarding);

setApiBase();
