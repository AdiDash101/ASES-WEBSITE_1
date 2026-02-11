import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "../db/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { asyncHandler } from "../utils/asyncHandler";
import { validateBody } from "../middleware/validate";
import {
  applicationReapplySchema,
  applicationSubmitSchema,
  paymentProofUploadUrlSchema,
} from "../validation/schemas";
import { HttpError } from "../utils/httpError";
import {
  buildPaymentProofObjectKey,
  createPaymentProofUploadUrl,
} from "../storage/minio";
import { getMissingRequiredApplicationFields } from "../utils/applicationCompleteness";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const application = await prisma.application.findUnique({
      where: { userId: req.user!.id },
      select: {
        id: true,
        status: true,
        answersJson: true,
        submittedAt: true,
        reviewedAt: true,
        paymentProofKey: true,
        paymentProofUploadedAt: true,
        paymentVerifiedAt: true,
      },
    });

    if (!application) {
      res.status(200).json({
        hasApplication: false,
        application: null,
      });
      return;
    }

    const { answersJson, ...applicationSummary } = application;
    const missingRequiredFields = getMissingRequiredApplicationFields(
      (answersJson ?? {}) as Record<string, unknown>
    );
    const missingPaymentProof = !application.paymentProofKey;

    res.status(200).json({
      hasApplication: true,
      application: {
        ...applicationSummary,
        canSubmit: application.status === "DRAFT",
        canReapply: application.status === "REJECTED",
        canUploadPaymentProof:
          application.status === "DRAFT" || application.status === "REJECTED",
        membershipGranted: application.status === "ACCEPTED",
        isCompleteForSubmission:
          missingRequiredFields.length === 0 && !missingPaymentProof,
        missingRequiredFields,
        missingPaymentProof,
      },
    });
  })
);

router.post(
  "/start",
  asyncHandler(async (req: Request, res: Response) => {
    const existing = await prisma.application.findUnique({
      where: { userId: req.user!.id },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        paymentProofKey: true,
        paymentProofUploadedAt: true,
      },
    });

    if (existing) {
      res.status(200).json({
        created: false,
        data: existing,
      });
      return;
    }

    const now = new Date();
    const created = await prisma.application.create({
      data: {
        userId: req.user!.id,
        answersJson: {},
        status: "DRAFT",
        submittedAt: now,
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
      },
    });

    res.status(201).json({
      created: true,
      data: created,
    });
  })
);

router.post(
  "/",
  validateBody(applicationSubmitSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const existing = await prisma.application.findUnique({
      where: { userId: req.user!.id },
      select: { id: true, status: true, paymentProofKey: true },
    });

    if (!existing) {
      throw new HttpError(
        409,
        "application_not_started",
        "Start an application before submitting."
      );
    }

    if (existing.status === "REJECTED") {
      throw new HttpError(
        409,
        "use_reapply_endpoint",
        "Use /application/reapply to resubmit a rejected application."
      );
    }

    if (existing.status !== "DRAFT") {
      throw new HttpError(
        409,
        "application_already_submitted",
        "Application is already submitted."
      );
    }

    const missingRequiredFields = getMissingRequiredApplicationFields(
      req.body.answers
    );
    const missingPaymentProof = !existing.paymentProofKey;
    if (missingRequiredFields.length > 0 || missingPaymentProof) {
      throw new HttpError(
        409,
        "application_incomplete",
        "Application is incomplete. Complete required fields and upload payment proof before submitting.",
        {
          missingRequiredFields,
          missingPaymentProof,
        }
      );
    }

    const now = new Date();
    const updated = await prisma.application.update({
      where: { id: existing.id },
      data: {
        answersJson: req.body.answers,
        status: "PENDING",
        submittedAt: now,
        reviewedAt: null,
        reviewedByUserId: null,
        decisionNote: null,
        paymentVerifiedAt: null,
        paymentVerifiedByUserId: null,
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
      },
    });

    res.status(200).json({ data: updated });
  })
);

router.post(
  "/reapply",
  validateBody(applicationReapplySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const existing = await prisma.application.findUnique({
      where: { userId: req.user!.id },
      select: { id: true, status: true, paymentProofKey: true },
    });

    if (!existing) {
      throw new HttpError(404, "application_not_found", "Application not found.");
    }

    if (existing.status !== "REJECTED") {
      throw new HttpError(
        409,
        "cannot_reapply",
        "Only rejected applications can be resubmitted."
      );
    }

    const missingRequiredFields = getMissingRequiredApplicationFields(
      req.body.answers
    );
    const missingPaymentProof = !existing.paymentProofKey;
    if (missingRequiredFields.length > 0 || missingPaymentProof) {
      throw new HttpError(
        409,
        "application_incomplete",
        "Application is incomplete. Complete required fields and upload payment proof before resubmitting.",
        {
          missingRequiredFields,
          missingPaymentProof,
        }
      );
    }

    const now = new Date();
    const updated = await prisma.application.update({
      where: { id: existing.id },
      data: {
        answersJson: req.body.answers,
        status: "PENDING",
        submittedAt: now,
        reviewedAt: null,
        reviewedByUserId: null,
        decisionNote: null,
        paymentVerifiedAt: null,
        paymentVerifiedByUserId: null,
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
      },
    });

    res.status(200).json({ data: updated });
  })
);

router.post(
  "/payment-proof/upload-url",
  validateBody(paymentProofUploadUrlSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const existing = await prisma.application.findUnique({
      where: { userId: req.user!.id },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new HttpError(
        409,
        "application_not_started",
        "Start an application before uploading payment proof."
      );
    }

    if (existing.status === "PENDING" || existing.status === "ACCEPTED") {
      throw new HttpError(
        409,
        "payment_proof_locked",
        "Payment proof upload is only allowed for draft or rejected applications."
      );
    }

    const { contentType, contentLength } = req.body;
    const objectKey = buildPaymentProofObjectKey(req.user!.id, contentType);

    let signed;
    try {
      signed = await createPaymentProofUploadUrl(
        objectKey,
        contentType,
        contentLength
      );
    } catch (error) {
      throw new HttpError(
        500,
        "storage_unavailable",
        "Payment proof storage is not configured.",
        { error: error instanceof Error ? error.message : "unknown_error" }
      );
    }

    const now = new Date();
    await prisma.application.update({
      where: { id: existing.id },
      data: {
        paymentProofKey: objectKey,
        paymentProofUploadedAt: now,
        paymentVerifiedAt: null,
        paymentVerifiedByUserId: null,
      },
    });

    res.status(200).json({
      data: {
        uploadUrl: signed.uploadUrl,
        objectKey,
        expiresIn: signed.expiresIn,
        method: "PUT",
        requiredHeaders: {
          "Content-Type": contentType,
          "Content-Length": String(contentLength),
        },
        attachedToApplication: true,
      },
    });
  })
);

export default router;
