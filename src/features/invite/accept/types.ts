export interface InviteCompletionFormErrors {
  displayName?: string;
  password?: string;
  confirmPassword?: string;
}

export interface InviteCompletionFormValues {
  displayName: string;
  password: string;
}

export type InviteCompletionResult =
  | "activated"
  | "already_active"
  | "manager_unavailable"
  | "unavailable";
