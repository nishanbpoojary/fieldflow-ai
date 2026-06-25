import { CustomerDirectory } from "@/features/customers/components/customer-directory";
import { getCustomerDirectory } from "@/features/customers/data/customers";
import { requireCurrentUser } from "@/lib/auth/current-user";

export default async function CustomersPage() {
  const currentUser = await requireCurrentUser();
  const context = {
    role: currentUser.role,
    roleLabel:
      currentUser.role === "sales_executive" ? "Sales Executive" : "Manager",
    isOrganizationAdmin: currentUser.isOrganizationAdmin,
  };
  const result = await getCustomerDirectory(currentUser);

  return (
    <CustomerDirectory
      context={context}
      displayName={currentUser.displayName}
      jobTitle={currentUser.jobTitle}
      result={result}
    />
  );
}
