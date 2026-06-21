import { FollowUpPageShell } from "@/features/follow-ups/components/follow-up-page-shell";
import {
  FOLLOW_UP_DEMO_TODAY,
  demoFollowUps,
  followUpCustomerOptions,
  resolveFollowUpDemoRole,
} from "@/features/follow-ups/data/demo-follow-ups";

interface FollowUpsPageProps {
  searchParams: Promise<{ role?: string | string[] }>;
}

export default async function FollowUpsPage({
  searchParams,
}: FollowUpsPageProps) {
  const { role: requestedRole } = await searchParams;
  const context = resolveFollowUpDemoRole(requestedRole);
  const customers =
    context.role === "sales_executive"
      ? followUpCustomerOptions.filter(
          (customer) => customer.assignedSalesExecutive === "Maya Chen",
        )
      : [];

  return (
    <FollowUpPageShell
      context={context}
      initialFollowUps={demoFollowUps}
      customers={customers}
      demoToday={FOLLOW_UP_DEMO_TODAY}
    />
  );
}
