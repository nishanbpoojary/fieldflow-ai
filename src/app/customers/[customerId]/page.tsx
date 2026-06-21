import { CustomerDetail } from "@/features/customers/components/customer-detail";
import {
  getCustomerForRole,
  resolveCustomerDemoRole,
} from "@/features/customers/data/demo-customers";

interface CustomerDetailPageProps {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<{ role?: string | string[] }>;
}

export default async function CustomerDetailPage({
  params,
  searchParams,
}: CustomerDetailPageProps) {
  const [{ customerId }, { role }] = await Promise.all([params, searchParams]);
  const context = resolveCustomerDemoRole(role);
  const customer = getCustomerForRole(customerId, context.role);

  return <CustomerDetail context={context} customer={customer} />;
}
