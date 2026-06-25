import "server-only";

import type { OrganizationAdminContext } from "@/lib/auth/organization-admin";
import { createClient } from "@/lib/supabase/server";

import type {
  OrganizationUserProfileRow,
  OrganizationUsersDirectoryData,
  OrganizationUsersDirectoryResult,
  OrganizationUserRecord,
  OrganizationUserRole,
  OrganizationUserStatus,
  OrganizationUserTeamRow,
} from "@/features/admin/users/types";

type OrganizationRow = {
  name: string;
};

function formatRole(role: OrganizationUserRole) {
  return role === "manager" ? "Manager" : "Sales Executive";
}

function formatStatus(status: OrganizationUserStatus) {
  if (status === "active") {
    return "Active";
  }

  if (status === "disabled") {
    return "Disabled";
  }

  return "Invited";
}

function getTeamName(
  profile: OrganizationUserProfileRow,
  teamNamesById: Map<string, string>,
) {
  if (profile.team_id) {
    return teamNamesById.get(profile.team_id) ?? "Unknown team";
  }

  if (profile.is_organization_admin) {
    return "Organization-wide";
  }

  return "Unassigned";
}

export function mapOrganizationUsersDirectory({
  organization,
  teams,
  profiles,
}: {
  organization: OrganizationRow;
  teams: OrganizationUserTeamRow[];
  profiles: OrganizationUserProfileRow[];
}): OrganizationUsersDirectoryData {
  const teamNamesById = new Map(teams.map((team) => [team.id, team.name]));
  const users = profiles
    .map<OrganizationUserRecord>((profile) => ({
      name: profile.display_name,
      role: profile.role,
      roleLabel: formatRole(profile.role),
      status: profile.status,
      statusLabel: formatStatus(profile.status),
      teamName: getTeamName(profile, teamNamesById),
      isOrganizationAdmin: profile.is_organization_admin,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    organizationName: organization.name,
    summary: {
      totalUsers: users.length,
      activeUsers: users.filter((user) => user.status === "active").length,
      invitedUsers: users.filter((user) => user.status === "invited").length,
      disabledUsers: users.filter((user) => user.status === "disabled").length,
    },
    users,
  };
}

export async function getOrganizationUsersDirectory(
  organizationAdmin: OrganizationAdminContext,
): Promise<OrganizationUsersDirectoryResult> {
  const supabase = await createClient();

  const [organizationResult, teamsResult, profilesResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationAdmin.organizationId)
      .maybeSingle(),
    supabase
      .from("teams")
      .select("id, name")
      .eq("organization_id", organizationAdmin.organizationId)
      .order("name", { ascending: true }),
    supabase
      .from("profiles")
      .select(
        "display_name, role, status, team_id, is_organization_admin",
      )
      .eq("organization_id", organizationAdmin.organizationId)
      .order("display_name", { ascending: true }),
  ]);

  if (
    organizationResult.error ||
    teamsResult.error ||
    profilesResult.error ||
    !organizationResult.data
  ) {
    return { status: "unavailable" };
  }

  return {
    status: "ready",
    data: mapOrganizationUsersDirectory({
      organization: organizationResult.data,
      teams: teamsResult.data ?? [],
      profiles: profilesResult.data ?? [],
    }),
  };
}
