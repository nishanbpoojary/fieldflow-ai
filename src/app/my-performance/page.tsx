import {
  MyPerformanceAccessDenied,
  MyPerformanceWorkspace,
} from "@/features/my-performance/components/my-performance-workspace";
import { getMyPerformanceData } from "@/features/my-performance/data/my-performance";
import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function MyPerformancePage() {
  const currentUser = await requireCurrentUser();
  const context = {
    role: currentUser.role,
    roleLabel:
      currentUser.role === "manager" ? "Manager" : "Sales Executive",
    isOrganizationAdmin: currentUser.isOrganizationAdmin,
  } as const;

  if (currentUser.role !== "sales_executive") {
    return (
      <MyPerformanceAccessDenied
        context={context}
        displayName={currentUser.displayName}
      />
    );
  }

  const result = await getMyPerformanceData(currentUser);

  return (
    <MyPerformanceWorkspace
      context={context}
      displayName={currentUser.displayName}
      result={result}
    />
  );
}
