import { FollowUpPageShell } from "@/features/follow-ups/components/follow-up-page-shell";
import {
  FOLLOW_UP_DEMO_TODAY,
  demoFollowUps,
  followUpCustomerOptions,
  resolveFollowUpDemoRole,
} from "@/features/follow-ups/data/demo-follow-ups";
import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function FollowUpsPage() {
  const currentUser = await requireCurrentUser();
  const context = resolveFollowUpDemoRole(currentUser.role);
  const customers =
    context.role === "sales_executive"
      ? followUpCustomerOptions.filter(
          (customer) => customer.assignedSalesExecutive === "Maya Chen",
        )
      : [];

  return (
    <FollowUpPageShell
      context={context}
      displayName={currentUser.displayName}
      initialFollowUps={demoFollowUps}
      customers={customers}
      demoToday={FOLLOW_UP_DEMO_TODAY}
    />
  );
}
