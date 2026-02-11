import express from "express";
import cors from "cors";
import csrf from "csurf";
import { env } from "./config/env";
import { sessionMiddleware } from "./config/session";
import passport from "passport";
import { configurePassport } from "./auth/passport";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import onboardingRouter from "./routes/onboarding";
import adminRouter from "./routes/admin";
import meRouter from "./routes/me";
import applicationRouter from "./routes/application";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: env.APP_ORIGIN.split(",").map((value) => value.trim()),
    credentials: true,
    allowedHeaders: ["Content-Type", "X-CSRF-Token"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(sessionMiddleware);

configurePassport();
app.use(passport.initialize());
app.use(passport.session());

app.use(
  csrf({
    sessionKey: "session",
  })
);

app.use("/", healthRouter);
app.use("/auth", authRouter);
app.use("/me", meRouter);
app.use("/onboarding", onboardingRouter);
app.use("/application", applicationRouter);
app.use("/admin", adminRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
