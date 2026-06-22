import { VisitPageShell } from "@/features/visits/components/visit-page-shell";
import {
  DEMO_TODAY,
  demoVisits,
  resolveVisitDemoRole,
  salesExecutives,
  visitCustomerOptions,
} from "@/features/visits/data/demo-visits";
import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function VisitsPage() {
  const currentUser = await requireCurrentUser();
  const context = resolveVisitDemoRole(currentUser.role);
  const customers =
    context.role === "sales_executive"
      ? visitCustomerOptions.filter(
          (customer) => customer.assignedSalesExecutive === "Maya Chen",
        )
      : visitCustomerOptions;

  return (
    <VisitPageShell
      context={context}
      displayName={currentUser.displayName}
      initialVisits={demoVisits}
      customers={customers}
      salesExecutives={salesExecutives}
      demoToday={DEMO_TODAY}
    />
  );
}
