import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

router.get("/whitelist", (_req: Request, res: Response) => {
  res.status(501).json({ error: "Whitelist endpoints not implemented yet." });
});

router.post("/whitelist", (_req: Request, res: Response) => {
  res.status(501).json({ error: "Whitelist endpoints not implemented yet." });
});

router.delete("/whitelist/:id", (_req: Request, res: Response) => {
  res.status(501).json({ error: "Whitelist endpoints not implemented yet." });
});

router.post("/whitelist/import", (_req: Request, res: Response) => {
  res.status(501).json({ error: "Whitelist import not implemented yet." });
});

router.get("/users", (_req: Request, res: Response) => {
  res.status(501).json({ error: "Admin users endpoint not implemented yet." });
});

router.post("/onboarding/reset/:userId", (_req: Request, res: Response) => {
  res.status(501).json({ error: "Onboarding reset not implemented yet." });
});

export default router;
