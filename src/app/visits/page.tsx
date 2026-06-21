import { VisitPageShell } from "@/features/visits/components/visit-page-shell";
import {
  DEMO_TODAY,
  demoVisits,
  resolveVisitDemoRole,
  salesExecutives,
  visitCustomerOptions,
} from "@/features/visits/data/demo-visits";

interface VisitsPageProps {
  searchParams: Promise<{ role?: string | string[] }>;
}

export default async function VisitsPage({ searchParams }: VisitsPageProps) {
  const { role: requestedRole } = await searchParams;
  const context = resolveVisitDemoRole(requestedRole);
  const customers =
    context.role === "sales_executive"
      ? visitCustomerOptions.filter(
          (customer) => customer.assignedSalesExecutive === "Maya Chen",
        )
      : visitCustomerOptions;

  return (
    <VisitPageShell
      context={context}
      initialVisits={demoVisits}
      customers={customers}
      salesExecutives={salesExecutives}
      demoToday={DEMO_TODAY}
    />
  );
}
