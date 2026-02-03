import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.status(501).json({ error: "Onboarding not implemented yet." });
});

router.post("/", (_req: Request, res: Response) => {
  res.status(501).json({ error: "Onboarding not implemented yet." });
});

export default router;
