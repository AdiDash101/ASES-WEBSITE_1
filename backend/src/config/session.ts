import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import { env } from "./env";

const oneWeekMs = 1000 * 60 * 60 * 24 * 7;
const PgSession = connectPgSimple(session);

const pool = env.DATABASE_URL
  ? new Pool({ connectionString: env.DATABASE_URL })
  : null;

const store = pool
  ? new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    })
  : undefined;

export const sessionMiddleware = session({
  name: "ases.sid",
  secret: env.SESSION_SECRET || "dev-session-secret",
  resave: false,
  saveUninitialized: false,
  store,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: oneWeekMs,
  },
});
