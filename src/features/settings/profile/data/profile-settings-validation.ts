import type { ProfileSettingsValidationResult } from "@/features/settings/profile/types";

const DISPLAY_NAME_MAX_LENGTH = 120;
const JOB_TITLE_MIN_LENGTH = 2;
const JOB_TITLE_MAX_LENGTH = 80;

export function normalizeProfileText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function validateProfileSettingsInput({
  displayName,
  jobTitle,
}: {
  displayName: string;
  jobTitle: string;
}): ProfileSettingsValidationResult {
  const normalizedDisplayName = normalizeProfileText(displayName);
  const normalizedJobTitle = normalizeProfileText(jobTitle);
  const errors: ProfileSettingsValidationResult["errors"] = {};
  const values = {
    displayName: normalizedDisplayName,
    jobTitle: normalizedJobTitle === "" ? null : normalizedJobTitle,
  };

  if (!normalizedDisplayName) {
    errors.displayName = "Enter a display name.";
  } else if (normalizedDisplayName.length > DISPLAY_NAME_MAX_LENGTH) {
    errors.displayName = "Display name must be 120 characters or fewer.";
  }

  if (
    values.jobTitle !== null &&
    (values.jobTitle.length < JOB_TITLE_MIN_LENGTH ||
      values.jobTitle.length > JOB_TITLE_MAX_LENGTH)
  ) {
    errors.jobTitle = "Job title must be 2 to 80 characters when provided.";
  }

  if (errors.displayName || errors.jobTitle) {
    return {
      success: false,
      values,
      errors,
    };
  }

  return {
    success: true,
    values,
    errors,
  };
}
