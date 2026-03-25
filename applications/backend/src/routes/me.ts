import { Router } from "express";
import type { Request, Response } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { toPublicUser } from "../utils/user";

const router = Router();

router.get("/", requireAuth, (req: Request, res: Response) => {
  res.status(200).json({ user: toPublicUser(req.user!) });
});

export default router;
