import { ManagerDashboard } from "@/features/dashboard/components/manager-dashboard";
import { SalesExecutiveDashboard } from "@/features/dashboard/components/sales-executive-dashboard";
import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function Home() {
  const currentUser = await requireCurrentUser();

  if (currentUser.role === "sales_executive") {
    return <SalesExecutiveDashboard displayName={currentUser.displayName} />;
  }

  return <ManagerDashboard displayName={currentUser.displayName} />;
}
