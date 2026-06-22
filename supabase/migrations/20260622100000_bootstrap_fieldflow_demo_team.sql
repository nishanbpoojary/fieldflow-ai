-- Privileged one-time bootstrap for the synthetic FieldFlow AI demo team.
-- Normal signups remain unassigned sales executives until a privileged process
-- assigns them. Never use this migration for real customer or dealership data.
-- This migration must run only with trusted migration/admin privileges, never
-- through normal browser permissions.

do $$
declare
  demo_team_id constant uuid := '3d7c6e0a-0fd2-4f61-9a89-4f724964d701';
  mangaluru_central_territory_id constant uuid := '3d7c6e0a-0fd2-4f61-9a89-4f724964d711';
  bantwal_territory_id constant uuid := '3d7c6e0a-0fd2-4f61-9a89-4f724964d712';
  puttur_territory_id constant uuid := '3d7c6e0a-0fd2-4f61-9a89-4f724964d713';
  manager_user_id uuid;
  sales_executive_user_id uuid;
  affected_rows integer;
begin
  begin
    select app_user.id
    into strict manager_user_id
    from auth.users as app_user
    where app_user.email = 'manager@fieldflow.test';
  exception
    when no_data_found then
      raise exception 'Demo bootstrap requires auth user manager@fieldflow.test.';
    when too_many_rows then
      raise exception 'Demo bootstrap found multiple auth users for manager@fieldflow.test.';
  end;

  begin
    select app_user.id
    into strict sales_executive_user_id
    from auth.users as app_user
    where app_user.email = 'maya.chen@fieldflow.test';
  exception
    when no_data_found then
      raise exception 'Demo bootstrap requires auth user maya.chen@fieldflow.test.';
    when too_many_rows then
      raise exception 'Demo bootstrap found multiple auth users for maya.chen@fieldflow.test.';
  end;

  if manager_user_id is null then
    raise exception 'Resolved manager user ID is unexpectedly null.';
  end if;

  if sales_executive_user_id is null then
    raise exception 'Resolved sales executive user ID is unexpectedly null.';
  end if;

  if manager_user_id = sales_executive_user_id then
    raise exception 'Demo manager and sales executive must resolve to different Auth users.';
  end if;

  perform 1
  from public.profiles as profile
  where profile.id = manager_user_id
  for update;

  if not found then
    raise exception 'Demo bootstrap requires a public.profiles row for manager@fieldflow.test.';
  end if;

  perform 1
  from public.profiles as profile
  where profile.id = sales_executive_user_id
  for update;

  if not found then
    raise exception 'Demo bootstrap requires a public.profiles row for maya.chen@fieldflow.test.';
  end if;

  insert into public.teams (id, name)
  values (demo_team_id, 'FieldFlow Demo Motors');

  update public.profiles
  set
    display_name = 'Arjun Rao',
    role = 'manager'::public.app_role,
    team_id = demo_team_id
  where id = manager_user_id;

  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'Expected to update exactly one manager profile, updated %.', affected_rows;
  end if;

  update public.profiles
  set
    display_name = 'Maya Chen',
    role = 'sales_executive'::public.app_role,
    team_id = demo_team_id
  where id = sales_executive_user_id;

  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'Expected to update exactly one sales executive profile, updated %.', affected_rows;
  end if;

  insert into public.territories (id, team_id, name)
  values
    (mangaluru_central_territory_id, demo_team_id, 'Mangaluru Central'),
    (bantwal_territory_id, demo_team_id, 'Bantwal'),
    (puttur_territory_id, demo_team_id, 'Puttur');
end;
$$;
