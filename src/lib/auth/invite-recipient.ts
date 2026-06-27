import "server-only";

import { createClient } from "@/lib/supabase/server";

type InviteRecipientProfileStatus = "active" | "invited" | "disabled";

export type InviteRecipientAccess =
  | { status: "unauthenticated" }
  | { status: "invited"; id: string; displayName: string }
  | { status: "active"; id: string }
  | { status: "unavailable" };

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

function isInviteRecipientProfileStatus(
  status: string,
): status is InviteRecipientProfileStatus {
  return status === "active" || status === "invited" || status === "disabled";
}

export async function resolveInviteRecipientAccess(
  supabase: ServerSupabaseClient,
): Promise<InviteRecipientAccess> {
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (claimsError || typeof userId !== "string") {
    return { status: "unauthenticated" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, display_name, status, organization_id, team_id, is_organization_admin",
    )
    .eq("id", userId)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.id !== userId ||
    !isInviteRecipientProfileStatus(profile.status)
  ) {
    return { status: "unavailable" };
  }

  if (profile.status === "invited") {
    if (
      profile.organization_id !== null ||
      profile.team_id !== null ||
      profile.is_organization_admin !== false
    ) {
      return { status: "unavailable" };
    }

    return {
      status: "invited",
      id: profile.id,
      displayName: profile.display_name,
    };
  }

  if (profile.status === "active") {
    if (
      !profile.organization_id ||
      (!profile.team_id && profile.is_organization_admin !== true)
    ) {
      return { status: "unavailable" };
    }

    return { status: "active", id: profile.id };
  }

  return { status: "unavailable" };
}

export async function getInviteRecipientAccess(): Promise<InviteRecipientAccess> {
  const supabase = await createClient();

  return resolveInviteRecipientAccess(supabase);
}
