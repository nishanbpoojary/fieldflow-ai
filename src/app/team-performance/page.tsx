import {
  TeamPerformanceAccessDenied,
  TeamPerformanceWorkspace,
} from "@/features/team-performance/components/team-performance-workspace";
import { getTeamPerformanceData } from "@/features/team-performance/data/team-performance";
import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function TeamPerformancePage() {
  const currentUser = await requireCurrentUser();
  const context = {
    role: currentUser.role,
    roleLabel:
      currentUser.role === "manager" ? "Manager" : "Sales Executive",
  } as const;

  if (currentUser.role !== "manager") {
    return (
      <TeamPerformanceAccessDenied
        context={context}
        displayName={currentUser.displayName}
      />
    );
  }

  const result = await getTeamPerformanceData(currentUser);

  return (
    <TeamPerformanceWorkspace
      context={context}
      displayName={currentUser.displayName}
      result={result}
    />
  );
}

