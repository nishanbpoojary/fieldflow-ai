import { FollowUpPageShell } from "@/features/follow-ups/components/follow-up-page-shell";
import { getFollowUpWorkspace } from "@/features/follow-ups/data/follow-ups";
import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function FollowUpsPage() {
  const currentUser = await requireCurrentUser();
  const result = await getFollowUpWorkspace(currentUser);

  return (
    <FollowUpPageShell
      context={{
        role: currentUser.role,
        roleLabel:
          currentUser.role === "manager" ? "Manager" : "Sales Executive",
        isOrganizationAdmin: currentUser.isOrganizationAdmin,
      }}
      displayName={currentUser.displayName}
      result={result}
    />
  );
}
