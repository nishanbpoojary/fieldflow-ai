-- FieldFlow AI Organization Admin read-access foundation.
-- This migration adds narrowly scoped, read-only RLS access for future
-- Organization Admin directory screens. It does not add write access, invite
-- flows, service-role clients, Auth email access, or operational data access.

-- Organizations were intentionally default-deny in the account-status
-- foundation migration. A SELECT grant is required before the RLS policy below
-- can authorize active Organization Admins to read only their own organization.
grant select on table public.organizations to authenticated;

create policy organizations_select_own_organization_for_org_admin
on public.organizations
for select
to authenticated
using (
  public.current_user_is_organization_admin()
  and id = public.current_user_organization_id()
);

create policy teams_select_own_organization_for_org_admin
on public.teams
for select
to authenticated
using (
  public.current_user_is_organization_admin()
  and organization_id = public.current_user_organization_id()
);

create policy profiles_select_own_organization_for_org_admin
on public.profiles
for select
to authenticated
using (
  public.current_user_is_organization_admin()
  and organization_id = public.current_user_organization_id()
);
