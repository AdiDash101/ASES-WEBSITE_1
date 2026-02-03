import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError";

export const requireAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const isAuthed = req.isAuthenticated ? req.isAuthenticated() : !!req.user;
  if (!isAuthed || !req.user) {
    return next(new HttpError(401, "unauthorized", "Unauthorized"));
  }
  return next();
};
