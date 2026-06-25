import { OrganizationUsersWorkspace } from "@/features/admin/users/components/organization-users-workspace";
import { getOrganizationUsersDirectory } from "@/features/admin/users/data/organization-users";
import { requireOrganizationAdmin } from "@/lib/auth/organization-admin";

export default async function OrganizationUsersPage() {
  const organizationAdmin = await requireOrganizationAdmin();
  const result = await getOrganizationUsersDirectory(organizationAdmin);

  return (
    <OrganizationUsersWorkspace
      organizationAdmin={organizationAdmin}
      result={result}
    />
  );
}
