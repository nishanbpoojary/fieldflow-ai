import "server-only";

import { redirect } from "next/navigation";

import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type OrganizationAdminRole = Database["public"]["Enums"]["app_role"];
type OrganizationAdminProfileStatus =
  Database["public"]["Enums"]["profile_status"];

export interface OrganizationAdminContext {
  id: string;
  organizationId: string;
  role: OrganizationAdminRole;
  teamId: string | null;
  isOrganizationAdmin: true;
}

function isOrganizationAdminRole(
  role: string,
): role is OrganizationAdminRole {
  return role === "manager" || role === "sales_executive";
}

function isActiveProfileStatus(
  status: OrganizationAdminProfileStatus,
): status is "active" {
  return status === "active";
}

export async function getOrganizationAdmin(): Promise<OrganizationAdminContext | null> {
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
      "id, role, team_id, status, organization_id, is_organization_admin",
    )
    .eq("id", userId)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.id !== userId ||
    !isActiveProfileStatus(profile.status) ||
    !profile.organization_id ||
    profile.is_organization_admin !== true ||
    !isOrganizationAdminRole(profile.role)
  ) {
    return null;
  }

  return {
    id: profile.id,
    organizationId: profile.organization_id,
    role: profile.role,
    teamId: profile.team_id,
    isOrganizationAdmin: true,
  };
}

export async function requireOrganizationAdmin(): Promise<OrganizationAdminContext> {
  const organizationAdmin = await getOrganizationAdmin();

  if (!organizationAdmin) {
    redirect("/login");
  }

  return organizationAdmin;
}
