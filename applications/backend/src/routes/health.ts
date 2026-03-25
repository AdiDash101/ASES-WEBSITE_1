import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, service: "ases-backend" });
});

router.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ message: "ASES backend running" });
});

export default router;
