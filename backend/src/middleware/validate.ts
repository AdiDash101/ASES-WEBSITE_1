import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { HttpError } from "../utils/httpError";

const formatZodError = (error: unknown) =>
  error instanceof Error ? error.message : "Invalid request payload.";

export const validateBody =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(
        new HttpError(400, "validation_error", formatZodError(result.error), {
          issues: result.error.issues,
        })
      );
    }
    req.body = result.data;
    return next();
  };

export const validateParams =
  (schema: ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(
        new HttpError(400, "validation_error", formatZodError(result.error), {
          issues: result.error.issues,
        })
      );
    }
    req.params = result.data as Request["params"];
    return next();
  };
