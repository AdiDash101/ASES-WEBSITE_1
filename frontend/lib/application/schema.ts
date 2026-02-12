import { z } from "zod";

export type ApplicationFormState = {
  description: string;
  email: string;
  fullName: string;
  universityAndBranch: string;
  currentYearLevelAndProgram: string;
  facebookLink: string;
  resumeOrCv: string;
  linkedInLink: string;
  hobbiesAndInterests: string;
  personalWhy: string;
  currentBuildingOrWantToBuild: string;
  whyAsesManila: string;
  oneToTwoYearVision: string;
  fiveYearVision: string;
  uniqueAboutYou: string;
  memberType: "" | "NEW" | "RETURNING";
  universityType: "" | "PUBLIC" | "PRIVATE";
  amountPaid: string;
  referenceNumber: string;
};

export const emptyApplicationForm: ApplicationFormState = {
  description: "",
  email: "",
  fullName: "",
  universityAndBranch: "",
  currentYearLevelAndProgram: "",
  facebookLink: "",
  resumeOrCv: "",
  linkedInLink: "",
  hobbiesAndInterests: "",
  personalWhy: "",
  currentBuildingOrWantToBuild: "",
  whyAsesManila: "",
  oneToTwoYearVision: "",
  fiveYearVision: "",
  uniqueAboutYou: "",
  memberType: "",
  universityType: "",
  amountPaid: "",
  referenceNumber: "",
};

export const applicationAnswersPayloadSchema = z.object({
  description: z.string().trim().max(1000).optional().nullable(),
  email: z.string().trim().email(),
  fullName: z.string().trim().min(1).max(200),
  universityAndBranch: z.string().trim().min(1).max(200),
  currentYearLevelAndProgram: z.string().trim().min(1).max(200),
  facebookLink: z.string().trim().url(),
  resumeOrCv: z.string().trim().min(3).max(2000),
  linkedInLink: z.string().trim().url().or(z.literal("")),
  hobbiesAndInterests: z.string().trim().min(1).max(1000),
  personalWhy: z.string().trim().min(1).max(4000),
  currentBuildingOrWantToBuild: z.string().trim().min(1).max(4000),
  whyAsesManila: z.string().trim().min(1).max(4000),
  oneToTwoYearVision: z.string().trim().min(1).max(4000),
  fiveYearVision: z.string().trim().min(1).max(4000),
  uniqueAboutYou: z.string().trim().min(1).max(4000),
  memberType: z.enum(["NEW", "RETURNING"]),
  universityType: z.enum(["PUBLIC", "PRIVATE"]),
  amountPaid: z.number().positive(),
  referenceNumber: z.string().trim().min(1).max(200),
});

const asString = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return "";
};

const asEnum = <T extends string>(value: unknown, allowed: readonly T[]): T | "" => {
  if (typeof value !== "string") {
    return "";
  }
  return (allowed as readonly string[]).includes(value) ? (value as T) : "";
};

export const fromApiAnswers = (answers: Record<string, unknown>): ApplicationFormState => ({
  description: asString(answers.description),
  email: asString(answers.email),
  fullName: asString(answers.fullName),
  universityAndBranch: asString(answers.universityAndBranch),
  currentYearLevelAndProgram: asString(answers.currentYearLevelAndProgram),
  facebookLink: asString(answers.facebookLink),
  resumeOrCv: asString(answers.resumeOrCv),
  linkedInLink: asString(answers.linkedInLink),
  hobbiesAndInterests: asString(answers.hobbiesAndInterests),
  personalWhy: asString(answers.personalWhy),
  currentBuildingOrWantToBuild: asString(answers.currentBuildingOrWantToBuild),
  whyAsesManila: asString(answers.whyAsesManila),
  oneToTwoYearVision: asString(answers.oneToTwoYearVision),
  fiveYearVision: asString(answers.fiveYearVision),
  uniqueAboutYou: asString(answers.uniqueAboutYou),
  memberType: asEnum(answers.memberType, ["NEW", "RETURNING"] as const),
  universityType: asEnum(answers.universityType, ["PUBLIC", "PRIVATE"] as const),
  amountPaid: asString(answers.amountPaid),
  referenceNumber: asString(answers.referenceNumber),
});

export const toDraftPayload = (form: ApplicationFormState) => ({
  description: form.description,
  email: form.email,
  fullName: form.fullName,
  universityAndBranch: form.universityAndBranch,
  currentYearLevelAndProgram: form.currentYearLevelAndProgram,
  facebookLink: form.facebookLink,
  resumeOrCv: form.resumeOrCv,
  linkedInLink: form.linkedInLink,
  hobbiesAndInterests: form.hobbiesAndInterests,
  personalWhy: form.personalWhy,
  currentBuildingOrWantToBuild: form.currentBuildingOrWantToBuild,
  whyAsesManila: form.whyAsesManila,
  oneToTwoYearVision: form.oneToTwoYearVision,
  fiveYearVision: form.fiveYearVision,
  uniqueAboutYou: form.uniqueAboutYou,
  memberType: form.memberType,
  universityType: form.universityType,
  amountPaid: form.amountPaid,
  referenceNumber: form.referenceNumber,
});

export const toSubmitPayload = (form: ApplicationFormState) => ({
  description: form.description.trim() ? form.description.trim() : null,
  email: form.email.trim(),
  fullName: form.fullName.trim(),
  universityAndBranch: form.universityAndBranch.trim(),
  currentYearLevelAndProgram: form.currentYearLevelAndProgram.trim(),
  facebookLink: form.facebookLink.trim(),
  resumeOrCv: form.resumeOrCv.trim(),
  linkedInLink: form.linkedInLink.trim(),
  hobbiesAndInterests: form.hobbiesAndInterests.trim(),
  personalWhy: form.personalWhy.trim(),
  currentBuildingOrWantToBuild: form.currentBuildingOrWantToBuild.trim(),
  whyAsesManila: form.whyAsesManila.trim(),
  oneToTwoYearVision: form.oneToTwoYearVision.trim(),
  fiveYearVision: form.fiveYearVision.trim(),
  uniqueAboutYou: form.uniqueAboutYou.trim(),
  memberType: form.memberType,
  universityType: form.universityType,
  amountPaid: Number(form.amountPaid),
  referenceNumber: form.referenceNumber.trim(),
});

export const labelByField: Record<keyof ApplicationFormState, string> = {
  description: "Description (optional)",
  email: "Email",
  fullName: "Full Name",
  universityAndBranch: "University and Branch",
  currentYearLevelAndProgram: "Year Level and Program",
  facebookLink: "Facebook Link",
  resumeOrCv: "Resume / Curriculum Vitae Link",
  linkedInLink: "LinkedIn Link",
  hobbiesAndInterests: "Hobbies and Interests",
  personalWhy: "Personal Why",
  currentBuildingOrWantToBuild: "What You Are Building",
  whyAsesManila: "Why ASES Manila",
  oneToTwoYearVision: "1 to 2 Year Vision",
  fiveYearVision: "5 Year Vision",
  uniqueAboutYou: "What Is Unique About You",
  memberType: "Type of Member",
  universityType: "Type of University",
  amountPaid: "Amount Paid",
  referenceNumber: "Reference Number",
};
