import type { Database } from "@/lib/supabase/database.types";

export type OrganizationUserRole = Database["public"]["Enums"]["app_role"];
export type OrganizationUserStatus =
  Database["public"]["Enums"]["profile_status"];

export interface OrganizationUserTeamRow {
  id: string;
  name: string;
}

export interface OrganizationUserProfileRow {
  display_name: string;
  role: OrganizationUserRole;
  status: OrganizationUserStatus;
  team_id: string | null;
  is_organization_admin: boolean;
}

export interface OrganizationUserRecord {
  name: string;
  role: OrganizationUserRole;
  roleLabel: string;
  status: OrganizationUserStatus;
  statusLabel: string;
  teamName: string;
  isOrganizationAdmin: boolean;
}

export interface OrganizationUsersSummary {
  totalUsers: number;
  activeUsers: number;
  invitedUsers: number;
  disabledUsers: number;
}

export interface OrganizationUsersDirectoryData {
  organizationName: string;
  summary: OrganizationUsersSummary;
  users: OrganizationUserRecord[];
}

export type OrganizationUsersDirectoryResult =
  | { status: "ready"; data: OrganizationUsersDirectoryData }
  | { status: "unavailable" };
