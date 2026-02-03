import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "../db/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { asyncHandler } from "../utils/asyncHandler";
import { validateBody } from "../middleware/validate";
import { onboardingSchema } from "../validation/schemas";
import { HttpError } from "../utils/httpError";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const response = await prisma.onboardingResponse.findUnique({
      where: { userId: req.user!.id },
    });

    res.status(200).json({
      completed: Boolean(response),
      submittedAt: response?.submittedAt ?? null,
      answers: response?.answersJson ?? null,
    });
  })
);

router.post(
  "/",
  validateBody(onboardingSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const existing = await prisma.onboardingResponse.findUnique({
      where: { userId: req.user!.id },
    });

    if (existing) {
      throw new HttpError(409, "already_completed", "Onboarding already completed.");
    }

    const answers = req.body.answers;

    const now = new Date();

    await prisma.$transaction([
      prisma.onboardingResponse.create({
        data: {
          userId: req.user!.id,
          answersJson: answers,
          submittedAt: now,
        },
      }),
      prisma.user.update({
        where: { id: req.user!.id },
        data: { onboardingCompletedAt: now },
      }),
    ]);

    return res.status(201).json({ ok: true });
  })
);

export default router;
