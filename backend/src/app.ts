import express from "express";
import cors from "cors";
import { env } from "./config/env";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import onboardingRouter from "./routes/onboarding";
import adminRouter from "./routes/admin";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(
  cors({
    origin: env.APP_ORIGIN.split(",").map((value) => value.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.use("/", healthRouter);
app.use("/auth", authRouter);
app.use("/onboarding", onboardingRouter);
app.use("/admin", adminRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
