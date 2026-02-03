const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toList = (value) =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: toNumber(process.env.PORT, 3001),
  APP_ORIGIN: process.env.APP_ORIGIN ?? "http://localhost:3000",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  SESSION_SECRET: process.env.SESSION_SECRET ?? "",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL ?? "",
  ADMIN_EMAILS: toList(process.env.ADMIN_EMAILS),
};

if (!env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Prisma will not connect.");
}

if (!env.SESSION_SECRET) {
  console.warn("SESSION_SECRET is not set. Using an insecure default.");
}

if (env.NODE_ENV === "production") {
  if (!env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required in production.");
  }
  if (
    !env.GOOGLE_CLIENT_ID ||
    !env.GOOGLE_CLIENT_SECRET ||
    !env.GOOGLE_CALLBACK_URL
  ) {
    throw new Error("Google OAuth env vars are required in production.");
  }
}
