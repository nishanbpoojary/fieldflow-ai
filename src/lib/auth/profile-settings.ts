import "server-only";

import { redirect } from "next/navigation";

import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type ProfileSettingsRole = Database["public"]["Enums"]["app_role"];
type ProfileSettingsStatus = Database["public"]["Enums"]["profile_status"];

export interface ProfileSettingsUser {
  id: string;
  displayName: string;
  jobTitle: string | null;
  role: ProfileSettingsRole;
  teamId: string | null;
  organizationId: string;
  isOrganizationAdmin: boolean;
}

function isProfileSettingsRole(role: string): role is ProfileSettingsRole {
  return role === "manager" || role === "sales_executive";
}

function isActiveProfileStatus(
  status: ProfileSettingsStatus,
): status is "active" {
  return status === "active";
}

export async function getProfileSettingsUser(): Promise<ProfileSettingsUser | null> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (claimsError || typeof userId !== "string") {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, display_name, job_title, role, team_id, status, organization_id, is_organization_admin",
    )
    .eq("id", userId)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.id !== userId ||
    !isActiveProfileStatus(profile.status) ||
    !profile.organization_id ||
    !isProfileSettingsRole(profile.role) ||
    (!profile.team_id && profile.is_organization_admin !== true)
  ) {
    return null;
  }

  return {
    id: profile.id,
    displayName: profile.display_name,
    jobTitle: profile.job_title,
    role: profile.role,
    teamId: profile.team_id,
    organizationId: profile.organization_id,
    isOrganizationAdmin: profile.is_organization_admin,
  };
}

export async function requireProfileSettingsUser(): Promise<ProfileSettingsUser> {
  const profileSettingsUser = await getProfileSettingsUser();

  if (!profileSettingsUser) {
    redirect("/login");
  }

  return profileSettingsUser;
}
