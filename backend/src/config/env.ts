const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: toNumber(process.env.PORT, 3001),
  APP_ORIGIN: process.env.APP_ORIGIN ?? "http://localhost:3000",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
};

if (!env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Prisma will not connect.");
}
