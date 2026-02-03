import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.APP_ORIGIN?.split(",") ?? [],
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "ases-backend" });
});

app.get("/", (_req, res) => {
  res.status(200).json({ message: "ASES backend running" });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
