import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "../db/prisma";
import { requireAdmin } from "../middleware/requireAdmin";
import { asyncHandler } from "../utils/asyncHandler";
import { validateBody, validateParams } from "../middleware/validate";
import {
  userIdParamSchema,
  uuidParamSchema,
  whitelistCreateSchema,
  whitelistImportSchema,
} from "../validation/schemas";
import { HttpError } from "../utils/httpError";

const router = Router();

router.use(requireAdmin);

router.get(
  "/whitelist",
  asyncHandler(async (_req: Request, res: Response) => {
    const entries = await prisma.whitelistEntry.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ data: entries });
  })
);

router.post(
  "/whitelist",
  validateBody(whitelistCreateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    try {
      const entry = await prisma.whitelistEntry.create({
        data: {
          email,
          addedByUserId: req.user!.id,
        },
      });
      return res.status(201).json({ data: entry });
    } catch (error: any) {
      if (error?.code === "P2002") {
        throw new HttpError(409, "duplicate", "Email already whitelisted.");
      }
      throw error;
    }
  })
);

router.delete(
  "/whitelist/:id",
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    await prisma.whitelistEntry.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

router.post(
  "/whitelist/import",
  validateBody(whitelistImportSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const cleaned = Array.from(new Set(req.body.emails));

    const created = await prisma.whitelistEntry.createMany({
      data: cleaned.map((email) => ({
        email,
        addedByUserId: req.user!.id,
      })),
      skipDuplicates: true,
    });

    res.status(201).json({ added: created.count });
  })
);

router.get(
  "/users",
  asyncHandler(async (_req: Request, res: Response) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        onboardingCompletedAt: true,
        createdAt: true,
      },
    });
    res.status(200).json({ data: users });
  })
);

router.post(
  "/onboarding/reset/:userId",
  validateParams(userIdParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.params.userId;
    await prisma.$transaction([
      prisma.onboardingResponse.deleteMany({ where: { userId } }),
      prisma.user.update({
        where: { id: userId },
        data: { onboardingCompletedAt: null },
      }),
    ]);
    res.status(200).json({ ok: true });
  })
);

export default router;
