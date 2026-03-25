import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "../db/prisma";
import { requireAdmin } from "../middleware/requireAdmin";
import { asyncHandler } from "../utils/asyncHandler";
import { validateBody, validateParams } from "../middleware/validate";
import {
  applicationDecisionSchema,
  userIdParamSchema,
  uuidParamSchema,
} from "../validation/schemas";
import { HttpError } from "../utils/httpError";
import {
  createPaymentProofViewUrl,
  paymentProofObjectExists,
} from "../storage/minio";

const router = Router();

router.use(requireAdmin);

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
        application: {
          select: {
            status: true,
            submittedAt: true,
            paymentVerifiedAt: true,
          },
        },
      },
    });
    res.status(200).json({ data: users });
  })
);

router.get(
  "/applications",
  asyncHandler(async (_req: Request, res: Response) => {
    const applications = await prisma.application.findMany({
      where: {
        status: {
          not: "DRAFT",
        },
      },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        paymentProofKey: true,
        paymentProofUploadedAt: true,
        paymentVerifiedAt: true,
        reviewedAt: true,
        decisionNote: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            onboardingCompletedAt: true,
          },
        },
      },
    });

    const data = await Promise.all(
      applications.map(async (application) => {
        let paymentProofViewUrl: string | null = null;

        if (application.paymentProofKey) {
          try {
            paymentProofViewUrl = await createPaymentProofViewUrl(
              application.paymentProofKey
            );
          } catch {
            paymentProofViewUrl = null;
          }
        }

        return {
          ...application,
          paymentProofViewUrl,
        };
      })
    );

    res.status(200).json({ data });
  })
);

router.get(
  "/applications/:id",
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        status: true,
        answersJson: true,
        submittedAt: true,
        paymentProofKey: true,
        paymentProofUploadedAt: true,
        paymentVerifiedAt: true,
        reviewedAt: true,
        decisionNote: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            onboardingCompletedAt: true,
          },
        },
      },
    });

    if (!application) {
      throw new HttpError(404, "application_not_found", "Application not found.");
    }

    let paymentProofViewUrl: string | null = null;
    if (application.paymentProofKey) {
      try {
        paymentProofViewUrl = await createPaymentProofViewUrl(
          application.paymentProofKey
        );
      } catch {
        paymentProofViewUrl = null;
      }
    }

    res.status(200).json({
      data: {
        ...application,
        answers: application.answersJson,
        paymentProofViewUrl,
      },
    });
  })
);

router.post(
  "/applications/:id/payment-verify",
  validateParams(uuidParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        status: true,
        paymentProofKey: true,
      },
    });

    if (!application) {
      throw new HttpError(404, "application_not_found", "Application not found.");
    }

    if (!application.paymentProofKey) {
      throw new HttpError(
        409,
        "payment_proof_missing",
        "Payment proof must be uploaded before verification."
      );
    }

    if (application.status === "DRAFT") {
      throw new HttpError(
        409,
        "application_not_submitted",
        "Application must be submitted before payment verification."
      );
    }

    let exists = false;
    try {
      exists = await paymentProofObjectExists(application.paymentProofKey);
    } catch (error) {
      throw new HttpError(
        500,
        "storage_unavailable",
        "Payment proof storage is unavailable.",
        { error: error instanceof Error ? error.message : "unknown_error" }
      );
    }
    if (!exists) {
      throw new HttpError(
        409,
        "payment_proof_not_found",
        "Payment proof file was not found in object storage."
      );
    }

    const now = new Date();
    const updated = await prisma.application.update({
      where: { id: application.id },
      data: {
        paymentVerifiedAt: now,
        paymentVerifiedByUserId: req.user!.id,
      },
      select: {
        id: true,
        status: true,
        paymentProofKey: true,
        paymentVerifiedAt: true,
        paymentVerifiedByUserId: true,
      },
    });

    res.status(200).json({ data: updated });
  })
);

router.post(
  "/applications/:id/decision",
  validateParams(uuidParamSchema),
  validateBody(applicationDecisionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const application = await prisma.application.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        status: true,
        paymentVerifiedAt: true,
      },
    });

    if (!application) {
      throw new HttpError(404, "application_not_found", "Application not found.");
    }

    if (application.status === "DRAFT") {
      throw new HttpError(
        409,
        "application_not_submitted",
        "Application must be submitted before decision."
      );
    }

    if (req.body.status === "ACCEPTED" && !application.paymentVerifiedAt) {
      throw new HttpError(
        409,
        "payment_not_verified",
        "Payment must be verified before accepting an application."
      );
    }

    const now = new Date();
    const updated = await prisma.application.update({
      where: { id: application.id },
      data: {
        status: req.body.status,
        reviewedAt: now,
        reviewedByUserId: req.user!.id,
        decisionNote: req.body.decisionNote ?? null,
      },
      select: {
        id: true,
        status: true,
        reviewedAt: true,
        reviewedByUserId: true,
        decisionNote: true,
      },
    });

    res.status(200).json({ data: updated });
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
