import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError";

export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new HttpError(401, "unauthorized", "Unauthorized"));
  }
  if (req.user.role !== "ADMIN") {
    return next(new HttpError(403, "forbidden", "Forbidden"));
  }
  return next();
};
