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

const listWhitelist = () => request("/admin/whitelist");

const addWhitelist = () => {
  const email = el("whitelistEmail").value.trim();
  return request("/admin/whitelist", { method: "POST", body: { email } });
};

const importWhitelist = () => {
  const raw = el("whitelistImport").value;
  const emails = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return request("/admin/whitelist/import", {
    method: "POST",
    body: { emails },
  });
};

const deleteWhitelist = () => {
  const id = el("whitelistDeleteId").value.trim();
  if (!id) {
    log("delete whitelist", { error: "Missing entry id" });
    return;
  }
  return request(`/admin/whitelist/${id}`, { method: "DELETE" });
};

const listUsers = () => request("/admin/users");

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
el("login").addEventListener("click", login);
el("getSession").addEventListener("click", getSession);
el("getMe").addEventListener("click", getMe);
el("logout").addEventListener("click", logout);
el("getOnboarding").addEventListener("click", getOnboarding);
el("submitOnboarding").addEventListener("click", submitOnboarding);
el("listWhitelist").addEventListener("click", listWhitelist);
el("addWhitelist").addEventListener("click", addWhitelist);
el("importWhitelist").addEventListener("click", importWhitelist);
el("deleteWhitelist").addEventListener("click", deleteWhitelist);
el("listUsers").addEventListener("click", listUsers);
el("resetOnboarding").addEventListener("click", resetOnboarding);

setApiBase();
