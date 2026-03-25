import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const parseAdminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const run = async () => {
  const adminEmails = parseAdminEmails().filter(isValidEmail);

  if (adminEmails.length === 0) {
    console.log("No ADMIN_EMAILS provided. Seed skipped.");
    return;
  }

  for (const email of adminEmails) {
    const user =
      (await prisma.user.findUnique({ where: { email } })) ??
      (await prisma.user.create({
        data: {
          googleId: `seed:${email}`,
          email,
          name: email,
          role: "ADMIN",
        },
      }));

    if (user.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
      });
      console.log(`Promoted user to admin: ${email}`);
    }
  }

  console.log("Seed complete: admin users ensured.");
};

run()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
