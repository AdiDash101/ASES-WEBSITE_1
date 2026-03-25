import { z } from "zod";
import {
  paymentProofAllowedMimeTypes,
  paymentProofMaxBytes,
} from "../storage/minio";

export const onboardingSchema = z.object({
  answers: z
    .record(z.unknown())
    .refine((value) => !Array.isArray(value), {
      message: "Answers must be an object.",
    }),
});

const answersSchema = z
  .record(z.unknown())
  .refine((value) => !Array.isArray(value), {
    message: "Answers must be an object.",
  });

const optionalUrlSchema = z
  .string()
  .trim()
  .url()
  .or(z.literal(""))
  .optional()
  .transform((value) => {
    if (!value) {
      return null;
    }
    return value;
  });

export const applicationAnswersSchema = z.object({
  description: z.string().trim().max(1000).optional().nullable(),
  email: z.string().trim().email(),
  fullName: z.string().trim().min(1).max(200),
  universityAndBranch: z.string().trim().min(1).max(200),
  currentYearLevelAndProgram: z.string().trim().min(1).max(200),
  facebookLink: z.string().trim().url(),
  resumeOrCv: z.string().trim().min(3).max(2000),
  linkedInLink: optionalUrlSchema,
  hobbiesAndInterests: z.string().trim().min(1).max(1000),
  personalWhy: z.string().trim().min(1).max(4000),
  currentBuildingOrWantToBuild: z.string().trim().min(1).max(4000),
  whyAsesManila: z.string().trim().min(1).max(4000),
  oneToTwoYearVision: z.string().trim().min(1).max(4000),
  fiveYearVision: z.string().trim().min(1).max(4000),
  uniqueAboutYou: z.string().trim().min(1).max(4000),
  memberType: z.enum(["NEW", "RETURNING"]),
  universityType: z.enum(["PUBLIC", "PRIVATE"]),
  amountPaid: z.coerce.number().positive(),
  referenceNumber: z.string().trim().min(1).max(200),
});

export const applicationSubmitSchema = z.object({
  answers: applicationAnswersSchema,
});

export const applicationReapplySchema = z.object({
  answers: applicationAnswersSchema,
});

export const applicationDraftSaveSchema = z.object({
  answers: answersSchema,
});

export const paymentProofUploadUrlSchema = z.object({
  contentType: z.enum(paymentProofAllowedMimeTypes as [string, ...string[]]),
  contentLength: z.number().int().positive().max(paymentProofMaxBytes),
});

export const applicationDecisionSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
  decisionNote: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .nullable(),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid(),
});
