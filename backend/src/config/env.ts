const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value == null) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "no") {
    return false;
  }
  return fallback;
};

const toList = (value: string | undefined): string[] =>
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
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT ?? "",
  MINIO_REGION: process.env.MINIO_REGION ?? "us-east-1",
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY ?? "",
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY ?? "",
  MINIO_BUCKET: process.env.MINIO_BUCKET ?? "",
  MINIO_FORCE_PATH_STYLE: toBoolean(process.env.MINIO_FORCE_PATH_STYLE, true),
  MINIO_SIGNED_URL_TTL_SECONDS: toNumber(
    process.env.MINIO_SIGNED_URL_TTL_SECONDS,
    900
  ),
};

if (!env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Prisma will not connect.");
}

if (!env.SESSION_SECRET) {
  console.warn("SESSION_SECRET is not set. Using an insecure default.");
}

if (
  !env.MINIO_ENDPOINT ||
  !env.MINIO_ACCESS_KEY ||
  !env.MINIO_SECRET_KEY ||
  !env.MINIO_BUCKET
) {
  console.warn(
    "MinIO env vars are not fully configured. Payment proof upload URLs will fail."
  );
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
