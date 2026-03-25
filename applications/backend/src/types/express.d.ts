import type { User as PrismaUser } from "@prisma/client";

declare global {
  namespace Express {
    interface User extends PrismaUser {}
    interface Request {
      user?: PrismaUser;
      logIn?: (user: PrismaUser, done: (err?: unknown) => void) => void;
      logout?: (done: (err?: unknown) => void) => void;
      isAuthenticated?: () => boolean;
      csrfToken?: () => string;
    }
  }
}

export {};
