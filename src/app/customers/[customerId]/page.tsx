import { CustomerDetail } from "@/features/customers/components/customer-detail";
import {
  getCustomerForRole,
  resolveCustomerDemoRole,
} from "@/features/customers/data/demo-customers";
import { requireCurrentUser } from "@/lib/auth/current-user";

interface CustomerDetailPageProps {
  params: Promise<{ customerId: string }>;
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const [{ customerId }, currentUser] = await Promise.all([
    params,
    requireCurrentUser(),
  ]);
  const context = resolveCustomerDemoRole(currentUser.role);
  const customer = getCustomerForRole(customerId, context.role);

  return (
    <CustomerDetail
      context={context}
      customer={customer}
      displayName={currentUser.displayName}
    />
  );
}
