import type {
  InviteCompletionFormErrors,
  InviteCompletionFormValues,
} from "@/features/invite/accept/types";

const maxDisplayNameLength = 120;
const maxPasswordLength = 256;

function normalizeDisplayName(displayName: string) {
  return displayName.trim().replace(/\s+/g, " ");
}

export function validateInviteCompletionInput(input: {
  displayName: string;
  password: string;
}):
  | {
      success: true;
      values: InviteCompletionFormValues;
      errors: InviteCompletionFormErrors;
    }
  | {
      success: false;
      errors: InviteCompletionFormErrors;
    } {
  const displayName = normalizeDisplayName(input.displayName);
  const errors: InviteCompletionFormErrors = {};

  if (!displayName) {
    errors.displayName = "Enter your full name.";
  } else if (displayName.length > maxDisplayNameLength) {
    errors.displayName = "Full name must be 120 characters or fewer.";
  }

  if (!input.password.trim()) {
    errors.password = "Enter a new password.";
  } else if (input.password.length > maxPasswordLength) {
    errors.password = "Password must be 256 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    values: {
      displayName,
      password: input.password,
    },
    errors: {},
  };
}

export function validateInviteCompletionForm(input: {
  displayName: string;
  password: string;
  confirmPassword: string;
}) {
  const validation = validateInviteCompletionInput(input);
  const errors: InviteCompletionFormErrors = validation.success
    ? {}
    : { ...validation.errors };

  if (input.password !== input.confirmPassword) {
    errors.confirmPassword = "Passwords must match.";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false as const, errors };
  }

  return {
    success: true as const,
    values: {
      displayName: normalizeDisplayName(input.displayName),
      password: input.password,
    },
    errors: {},
  };
}
