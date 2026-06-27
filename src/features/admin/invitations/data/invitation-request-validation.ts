import type { Database } from "@/lib/supabase/database.types";

type InvitationRole = Database["public"]["Enums"]["app_role"];

export type InvitationRequestValues = {
  email: string;
  role: InvitationRole;
  teamId: string;
  jobTitle: string | null;
};

export type InvitationRequestValidationResult =
  | { success: true; values: InvitationRequestValues }
  | { success: false };

const allowedKeys = new Set(["email", "role", "teamId", "jobTitle"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isInvitationRole(value: unknown): value is InvitationRole {
  return value === "manager" || value === "sales_executive";
}

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function hasOnlyAllowedKeys(value: Record<string, unknown>) {
  return Object.keys(value).every((key) => allowedKeys.has(key));
}

export function validateInvitationRequestBody(
  body: unknown,
): InvitationRequestValidationResult {
  if (!isRecord(body) || !hasOnlyAllowedKeys(body)) {
    return { success: false };
  }

  const { email, role, teamId, jobTitle } = body;

  if (
    typeof email !== "string" ||
    !isInvitationRole(role) ||
    typeof teamId !== "string"
  ) {
    return { success: false };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedTeamId = teamId.trim();

  if (
    normalizedEmail.length < 3 ||
    normalizedEmail.length > 254 ||
    !emailPattern.test(normalizedEmail) ||
    !uuidPattern.test(normalizedTeamId)
  ) {
    return { success: false };
  }

  if (jobTitle !== undefined && jobTitle !== null && typeof jobTitle !== "string") {
    return { success: false };
  }

  const normalizedJobTitle =
    typeof jobTitle === "string" ? normalizeWhitespace(jobTitle) : "";

  if (
    normalizedJobTitle &&
    (normalizedJobTitle.length < 2 || normalizedJobTitle.length > 80)
  ) {
    return { success: false };
  }

  return {
    success: true,
    values: {
      email: normalizedEmail,
      role,
      teamId: normalizedTeamId,
      jobTitle: normalizedJobTitle || null,
    },
  };
}
