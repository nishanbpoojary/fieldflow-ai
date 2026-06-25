import {
  TerritoryAccessDenied,
  TerritoryWorkspace,
} from "@/features/territories/components/territory-workspace";
import { getTerritoryWorkspaceData } from "@/features/territories/data/territories";
import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function TerritoriesPage() {
  const currentUser = await requireCurrentUser();
  const context = {
    role: currentUser.role,
    roleLabel:
      currentUser.role === "manager" ? "Manager" : "Sales Executive",
    isOrganizationAdmin: currentUser.isOrganizationAdmin,
  } as const;

  if (currentUser.role !== "manager") {
    return (
      <TerritoryAccessDenied
        context={context}
        displayName={currentUser.displayName}
      />
    );
  }

  const result = await getTerritoryWorkspaceData(currentUser);

  return (
    <TerritoryWorkspace
      context={context}
      displayName={currentUser.displayName}
      result={result}
    />
  );
}
