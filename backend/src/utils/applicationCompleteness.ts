const requiredFieldIds = [
  "email",
  "fullName",
  "universityAndBranch",
  "currentYearLevelAndProgram",
  "facebookLink",
  "resumeOrCv",
  "hobbiesAndInterests",
  "personalWhy",
  "currentBuildingOrWantToBuild",
  "whyAsesManila",
  "oneToTwoYearVision",
  "fiveYearVision",
  "uniqueAboutYou",
  "memberType",
  "universityType",
  "amountPaid",
  "referenceNumber",
];

const hasNonEmptyValue = (value: unknown): boolean => {
  if (value == null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "boolean") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }

  return false;
};

export const getRequiredApplicationFieldIds = () => requiredFieldIds;

export const getMissingRequiredApplicationFields = (
  answers: Record<string, unknown>
) =>
  requiredFieldIds.filter((fieldId) => !hasNonEmptyValue(answers[fieldId]));
