import { CustomerDetail } from "@/features/customers/components/customer-detail";
import { getCustomerDetail } from "@/features/customers/data/customers";
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
  const context = {
    role: currentUser.role,
    roleLabel:
      currentUser.role === "sales_executive" ? "Sales Executive" : "Manager",
    isOrganizationAdmin: currentUser.isOrganizationAdmin,
  };
  const result = await getCustomerDetail(currentUser, customerId);

  return (
    <CustomerDetail
      context={context}
      displayName={currentUser.displayName}
      jobTitle={currentUser.jobTitle}
      result={result}
    />
  );
}
