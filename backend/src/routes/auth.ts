import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

router.get("/google", (_req: Request, res: Response) => {
  res.status(501).json({ error: "OAuth not implemented yet." });
});

router.get("/google/callback", (_req: Request, res: Response) => {
  res.status(501).json({ error: "OAuth callback not implemented yet." });
});

router.post("/logout", (_req: Request, res: Response) => {
  res.status(204).send();
});

export default router;
