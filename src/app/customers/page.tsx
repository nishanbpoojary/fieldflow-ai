import { CustomerDirectory } from "@/features/customers/components/customer-directory";
import {
  getCustomersForRole,
  resolveCustomerDemoRole,
} from "@/features/customers/data/demo-customers";
import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function CustomersPage() {
  const currentUser = await requireCurrentUser();
  const context = resolveCustomerDemoRole(currentUser.role);
  const customers = getCustomersForRole(context.role);

  return (
    <CustomerDirectory
      context={context}
      customers={customers}
      displayName={currentUser.displayName}
    />
  );
}
