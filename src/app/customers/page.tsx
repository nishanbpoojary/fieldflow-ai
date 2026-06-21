import { CustomerDirectory } from "@/features/customers/components/customer-directory";
import {
  getCustomersForRole,
  resolveCustomerDemoRole,
} from "@/features/customers/data/demo-customers";

interface CustomersPageProps {
  searchParams: Promise<{ role?: string | string[] }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const { role } = await searchParams;
  const context = resolveCustomerDemoRole(role);
  const customers = getCustomersForRole(context.role);

  return <CustomerDirectory context={context} customers={customers} />;
}
