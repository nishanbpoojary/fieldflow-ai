import { VisitPageShell } from "@/features/visits/components/visit-page-shell";
import { getVisitWorkspace } from "@/features/visits/data/visits";
import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function VisitsPage() {
  const currentUser = await requireCurrentUser();
  const result = await getVisitWorkspace(currentUser);

  return (
    <VisitPageShell
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
