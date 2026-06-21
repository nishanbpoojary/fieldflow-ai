import { ManagerDashboard } from "@/features/dashboard/components/manager-dashboard";
import { SalesExecutiveDashboard } from "@/features/dashboard/components/sales-executive-dashboard";

interface HomeProps {
  searchParams: Promise<{ role?: string | string[] }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { role } = await searchParams;

  if (role === "sales_executive") {
    return <SalesExecutiveDashboard />;
  }

  return <ManagerDashboard />;
}
