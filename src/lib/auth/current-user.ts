import "server-only";

import { redirect } from "next/navigation";

import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type CurrentUserRole = Database["public"]["Enums"]["app_role"];

export interface CurrentUser {
  id: string;
  displayName: string;
  role: CurrentUserRole;
  teamId: string;
}

function isCurrentUserRole(role: string): role is CurrentUserRole {
  return role === "manager" || role === "sales_executive";
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (claimsError || typeof userId !== "string") {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, role, team_id")
    .eq("id", userId)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.id !== userId ||
    !profile.team_id ||
    !isCurrentUserRole(profile.role)
  ) {
    return null;
  }

  return {
    id: profile.id,
    displayName: profile.display_name,
    role: profile.role,
    teamId: profile.team_id,
  };
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  return currentUser;
}
