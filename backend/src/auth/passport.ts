import passport from "passport";
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from "passport-google-oauth20";
import { UserRole } from "@prisma/client";
import prisma from "../db/prisma";
import { env } from "../config/env";

const getPrimaryEmail = (profile: GoogleProfile) => {
  const email = profile.emails?.[0]?.value?.toLowerCase();
  return email ?? "";
};

export const configurePassport = () => {
  if (
    !env.GOOGLE_CLIENT_ID ||
    !env.GOOGLE_CLIENT_SECRET ||
    !env.GOOGLE_CALLBACK_URL
  ) {
    console.warn("Google OAuth not configured. Auth routes will fail.");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = getPrimaryEmail(profile);
          if (!email) {
            return done(null, false, { message: "missing_email" });
          }

          const isAdminEmail = env.ADMIN_EMAILS.includes(email);

          const displayName = profile.displayName || email;
          const avatarUrl = profile.photos?.[0]?.value ?? null;

          const roleUpdate = isAdminEmail ? { role: UserRole.ADMIN } : {};

          let user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            user = await prisma.user.findUnique({
              where: { googleId: profile.id },
            });
          }

          if (user) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId: profile.id,
                email,
                name: displayName,
                avatarUrl,
                ...roleUpdate,
              },
            });
          } else {
            user = await prisma.user.create({
              data: {
                googleId: profile.id,
                email,
                name: displayName,
                avatarUrl,
                role: isAdminEmail ? UserRole.ADMIN : UserRole.MEMBER,
              },
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  });
};
