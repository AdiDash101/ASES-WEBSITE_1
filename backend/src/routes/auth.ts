import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import passport from "passport";
import { env } from "../config/env";
import { toPublicUser } from "../utils/user";
import { HttpError } from "../utils/httpError";

const router = Router();

router.get("/google", (req: Request, res: Response, next: NextFunction) => {
  return passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })(req, res, next);
});

router.get(
  "/google/callback",
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("google", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        const reason = info?.message ?? "auth_failed";
        const status = reason === "not_whitelisted" ? 403 : 401;
        return next(
          new HttpError(status, reason, "Authentication failed.", {
            reason,
          })
        );
      }
      req.logIn?.(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        return res.redirect(env.APP_ORIGIN);
      });
    })(req, res, next);
  }
);

router.get("/csrf", (req: Request, res: Response, next: NextFunction) => {
  return res.status(200).json({ csrfToken: req.csrfToken?.() });
});

router.get("/session", (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(200).json({ user: null });
  }
  return res.status(200).json({ user: toPublicUser(req.user) });
});

router.post("/logout", (req: Request, res: Response, next: NextFunction) => {
  if (!req.logout) {
    req.session?.destroy(() => res.status(204).send());
    return;
  }
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session?.destroy(() => {
      res.status(204).send();
    });
  });
});

export default router;
