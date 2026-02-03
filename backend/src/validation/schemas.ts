import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase());

export const whitelistCreateSchema = z.object({
  email: emailSchema,
});

export const whitelistImportSchema = z.object({
  emails: z.array(emailSchema).min(1),
});

export const onboardingSchema = z.object({
  answers: z
    .record(z.unknown())
    .refine((value) => !Array.isArray(value), {
      message: "Answers must be an object.",
    }),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid(),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid(),
});
