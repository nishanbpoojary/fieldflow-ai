import { ManagerDashboard } from "@/features/dashboard/components/manager-dashboard";
import { SalesExecutiveDashboard } from "@/features/dashboard/components/sales-executive-dashboard";
import { getManagerDashboardData } from "@/features/dashboard/data/manager-dashboard";
import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function Home() {
  const currentUser = await requireCurrentUser();

  if (currentUser.role === "sales_executive") {
    return <SalesExecutiveDashboard displayName={currentUser.displayName} />;
  }

  const dashboardResult = await getManagerDashboardData(currentUser);

  return (
    <ManagerDashboard
      displayName={currentUser.displayName}
      result={dashboardResult}
    />
  );
}
