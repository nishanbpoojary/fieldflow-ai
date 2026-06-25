-- FieldFlow AI organization and account-status foundation.
-- This migration keeps the existing app_role values unchanged and adds the
-- minimum database structure needed for future invite-only internal onboarding.
-- It does not create admin UI, invite flows, service-role clients, or real
-- customer data.

create type public.profile_status as enum ('invited', 'active', 'disabled');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_name_key unique (name)
);

comment on table public.organizations is
  'Internal organizations that own FieldFlow AI teams; access remains default-deny until admin routes are built.';

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;

-- Default-deny until the future Organization Admin surface defines explicit
-- access paths. Application code does not need direct organization reads yet.
revoke all on table public.organizations from public, anon, authenticated;

-- Stable synthetic organization for the existing portfolio demo data only.
insert into public.organizations (id, name)
values (
  '3d7c6e0a-0fd2-4f61-9a89-4f724964d700',
  'FieldFlow Demo Organization'
);

alter table public.teams
add column organization_id uuid;

update public.teams
set organization_id = '3d7c6e0a-0fd2-4f61-9a89-4f724964d700'
where organization_id is null;

alter table public.teams
alter column organization_id set not null;

alter table public.teams
add constraint teams_organization_id_fkey
foreign key (organization_id)
references public.organizations (id)
on delete restrict;

alter table public.teams
add constraint teams_id_organization_key unique (id, organization_id);

create index teams_organization_id_idx on public.teams (organization_id);

comment on column public.teams.organization_id is
  'Organization that owns this team; teams are not allowed to exist outside an organization.';

alter table public.profiles
add column organization_id uuid references public.organizations (id) on delete restrict,
add column status public.profile_status not null default 'invited',
add column is_organization_admin boolean not null default false;

-- Existing assigned demo profiles become active members of their team
-- organization. Unassigned profiles stay invited and unassigned.
update public.profiles as profile
set
  organization_id = team.organization_id,
  status = 'active'::public.profile_status
from public.teams as team
where profile.team_id = team.id;

update public.profiles
set
  organization_id = null,
  status = 'invited'::public.profile_status,
  is_organization_admin = false
where team_id is null;

-- For this demo development environment only, make the existing assigned
-- Manager for the demo organization the initial organization admin. This uses
-- role/team membership instead of relying on an email address.
update public.profiles as profile
set is_organization_admin = true
where profile.role = 'manager'::public.app_role
  and profile.organization_id = '3d7c6e0a-0fd2-4f61-9a89-4f724964d700'
  and exists (
    select 1
    from public.teams as team
    where team.id = profile.team_id
      and team.organization_id = profile.organization_id
  );

alter table public.profiles
drop constraint manager_profiles_require_team;

alter table public.profiles
add constraint manager_profiles_require_team check (
  role <> 'manager'::public.app_role
  or status <> 'active'::public.profile_status
  or is_organization_admin = true
  or team_id is not null
),
add constraint profiles_team_requires_organization check (
  team_id is null or organization_id is not null
),
add constraint profiles_active_requires_organization check (
  status <> 'active'::public.profile_status or organization_id is not null
),
add constraint profiles_active_non_admin_requires_team check (
  status <> 'active'::public.profile_status
  or is_organization_admin = true
  or team_id is not null
),
add constraint profiles_org_admin_requires_organization check (
  is_organization_admin = false or organization_id is not null
),
add constraint profiles_team_organization_fkey
foreign key (team_id, organization_id)
references public.teams (id, organization_id)
on delete restrict;

create index profiles_organization_id_idx on public.profiles (organization_id);
create index profiles_status_idx on public.profiles (status);
create index profiles_is_organization_admin_idx
  on public.profiles (is_organization_admin)
  where is_organization_admin = true;

comment on column public.profiles.organization_id is
  'Organization membership assigned only by privileged onboarding/admin processes.';
comment on column public.profiles.status is
  'Invite lifecycle status: invited users are not fully onboarded, active users may work, disabled users should be blocked by future app-level checks.';
comment on column public.profiles.is_organization_admin is
  'Privileged organization-administration permission; not controlled by signup metadata or normal browser updates.';

-- Newly created Auth users remain unassigned invited sales executives. Signup
-- metadata may still provide only display_name; role, organization, team,
-- status, and organization-admin permission remain privileged.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    role,
    display_name,
    organization_id,
    team_id,
    status,
    is_organization_admin
  )
  values (
    new.id,
    'sales_executive'::public.app_role,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      'New user'
    ),
    null,
    null,
    'invited'::public.profile_status,
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates safe invited, unassigned sales-executive profiles for new Auth users without trusting signup metadata for privileged fields.';

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select profile.role
  from public.profiles as profile
  where profile.id = (select auth.uid())
    and profile.status = 'active'::public.profile_status
  limit 1;
$$;

comment on function public.current_user_role() is
  'Returns the active authenticated user application role without recursive profile RLS evaluation.';

create or replace function public.current_user_team_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select profile.team_id
  from public.profiles as profile
  where profile.id = (select auth.uid())
    and profile.status = 'active'::public.profile_status
  limit 1;
$$;

comment on function public.current_user_team_id() is
  'Returns the active authenticated user team id without recursive profile RLS evaluation.';

create function public.current_user_organization_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select profile.organization_id
  from public.profiles as profile
  where profile.id = (select auth.uid())
    and profile.status = 'active'::public.profile_status
  limit 1;
$$;

comment on function public.current_user_organization_id() is
  'Returns the active authenticated user organization id without recursive profile RLS evaluation.';

create function public.current_user_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.status = 'active'::public.profile_status
  );
$$;

comment on function public.current_user_is_active() is
  'Returns whether the authenticated profile is active.';

create or replace function public.current_user_is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.role = 'manager'::public.app_role
      and profile.status = 'active'::public.profile_status
  );
$$;

comment on function public.current_user_is_manager() is
  'Returns whether the authenticated user has the active manager role.';

create or replace function public.current_user_is_manager_for_team(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.role = 'manager'::public.app_role
      and profile.status = 'active'::public.profile_status
      and profile.team_id = target_team_id
  );
$$;

comment on function public.current_user_is_manager_for_team(uuid) is
  'Returns whether the authenticated active manager manages the specified team.';

create function public.current_user_is_organization_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = (select auth.uid())
      and profile.status = 'active'::public.profile_status
      and profile.is_organization_admin = true
      and profile.organization_id is not null
  );
$$;

comment on function public.current_user_is_organization_admin() is
  'Returns whether the authenticated active profile has organization-admin permission.';

-- Defense in depth for future profile mutation paths. Browser clients still
-- have no profile mutation grant, and this trigger prevents normal
-- authenticated sessions from changing privileged identity fields unless a
-- future privileged admin path explicitly authorizes them.
create function public.protect_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_is_allowed boolean;
begin
  if new.role is not distinct from old.role
    and new.team_id is not distinct from old.team_id
    and new.organization_id is not distinct from old.organization_id
    and new.status is not distinct from old.status
    and new.is_organization_admin is not distinct from old.is_organization_admin
  then
    return new;
  end if;

  -- Trusted migration/admin operations run without an authenticated browser
  -- actor. They remain responsible for validating their own scope.
  if actor_id is null then
    return new;
  end if;

  select exists (
    select 1
    from public.profiles as actor
    where actor.id = actor_id
      and actor.status = 'active'::public.profile_status
      and actor.is_organization_admin = true
      and actor.organization_id is not null
      and (
        new.organization_id is null
        or actor.organization_id = new.organization_id
      )
      and (
        old.organization_id is null
        or actor.organization_id = old.organization_id
      )
  )
  into actor_is_allowed;

  if not actor_is_allowed then
    raise exception using
      errcode = '42501',
      message = 'Only a privileged organization admin process may change profile role, team, organization, status, or organization-admin permission.';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_sensitive_fields
before update of role, team_id, organization_id, status, is_organization_admin
on public.profiles
for each row execute function public.protect_profile_sensitive_fields();

revoke all on function public.protect_profile_sensitive_fields()
  from public, anon, authenticated;
revoke all on function public.current_user_organization_id()
  from public, anon;
revoke all on function public.current_user_is_active()
  from public, anon;
revoke all on function public.current_user_is_organization_admin()
  from public, anon;

grant execute on function public.current_user_organization_id()
  to authenticated;
grant execute on function public.current_user_is_active()
  to authenticated;
grant execute on function public.current_user_is_organization_admin()
  to authenticated;
