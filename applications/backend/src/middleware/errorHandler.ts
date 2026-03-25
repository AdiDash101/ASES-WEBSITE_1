import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { HttpError } from "../utils/httpError";

type AppError = Error & { statusCode?: number; code?: string; details?: unknown };

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if ((err as any)?.code === "EBADCSRFTOKEN") {
    return res.status(403).json({
      error: {
        code: "invalid_csrf_token",
        message: "Invalid CSRF token.",
      },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "validation_error",
        message: "Invalid request payload.",
        details: err.flatten(),
      },
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        error: {
          code: "duplicate",
          message: "Duplicate record.",
          details: err.meta,
        },
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({
        error: {
          code: "not_found",
          message: "Record not found.",
          details: err.meta,
        },
      });
    }
  }

  const status =
    err instanceof HttpError ? err.statusCode : err.statusCode ?? 500;
  const code =
    err instanceof HttpError
      ? err.code
      : err.code ?? (status >= 500 ? "internal_error" : "request_error");
  const message =
    err instanceof HttpError
      ? err.message
      : err.message ?? "Internal server error";
  const details = err instanceof HttpError ? err.details : err.details;

  return res.status(status).json({
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
};
