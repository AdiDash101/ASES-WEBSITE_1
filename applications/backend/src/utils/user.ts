import type { User } from "@prisma/client";

export const toPublicUser = (user: User) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatarUrl: user.avatarUrl,
  role: user.role,
  onboardingCompletedAt: user.onboardingCompletedAt,
  createdAt: user.createdAt,
});
