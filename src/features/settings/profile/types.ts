import type { ProfileSettingsRole } from "@/lib/auth/profile-settings";

export interface ProfileSettingsProfile {
  displayName: string;
  jobTitle: string | null;
  role: ProfileSettingsRole;
  teamId: string | null;
  organizationId: string;
  isOrganizationAdmin: boolean;
}

export interface ProfileSettingsFormValues {
  displayName: string;
  jobTitle: string | null;
}

export interface ProfileSettingsFormErrors {
  displayName?: string;
  jobTitle?: string;
}

export type ProfileSettingsValidationResult =
  | {
      success: true;
      values: ProfileSettingsFormValues;
      errors: ProfileSettingsFormErrors;
    }
  | {
      success: false;
      values: ProfileSettingsFormValues;
      errors: ProfileSettingsFormErrors;
    };
