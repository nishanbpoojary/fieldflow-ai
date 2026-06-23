-- Use one focused RPC instead of a direct browser visit-plan insert so the
-- browser never supplies trusted ownership fields. The authenticated manager is
-- resolved from auth.uid(), and team/creator identity are derived from that
-- profile instead of caller input.
-- SECURITY INVOKER preserves existing table grants and RLS checks, so this
-- function cannot bypass the manager-only same-team policies.
create function public.create_assigned_visit_plan(
  p_customer_id uuid,
  p_assigned_sales_executive_id uuid,
  p_scheduled_date date,
  p_scheduled_time time without time zone,
  p_priority public.priority_level default 'medium'::public.priority_level,
  p_planning_note text default null
)
returns table (
  visit_plan_id uuid,
  created_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_role public.app_role;
  caller_team_id uuid;
  normalized_planning_note text := nullif(btrim(p_planning_note), '');
  inserted_visit_plan_id uuid;
  inserted_created_at timestamptz;
begin
  if caller_id is null then
    raise exception using
      errcode = '28000',
      message = 'Authentication is required to create a visit plan.';
  end if;

  caller_role := public.current_user_role();
  caller_team_id := public.current_user_team_id();

  if caller_role is distinct from 'manager'::public.app_role then
    raise exception using
      errcode = '42501',
      message = 'Only a manager may create an assigned visit plan.';
  end if;

  if caller_team_id is null then
    raise exception using
      errcode = '42501',
      message = 'A manager team assignment is required to create a visit plan.';
  end if;

  if p_customer_id is null then
    raise exception using
      errcode = '22004',
      message = 'A customer ID is required.';
  end if;

  if p_assigned_sales_executive_id is null then
    raise exception using
      errcode = '22004',
      message = 'An assigned sales executive ID is required.';
  end if;

  if p_scheduled_date is null then
    raise exception using
      errcode = '22004',
      message = 'A scheduled visit date is required.';
  end if;

  if p_scheduled_time is null then
    raise exception using
      errcode = '22004',
      message = 'A scheduled visit time is required.';
  end if;

  if p_priority is null then
    raise exception using
      errcode = '22004',
      message = 'A visit priority is required.';
  end if;

  if not exists (
    select 1
    from public.customers as customer
    where customer.id = p_customer_id
      and customer.team_id = caller_team_id
  ) then
    raise exception using
      errcode = '42501',
      message = 'Customer was not found in the authenticated manager team.';
  end if;

  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = p_assigned_sales_executive_id
      and profile.team_id = caller_team_id
      and profile.role = 'sales_executive'::public.app_role
  ) then
    raise exception using
      errcode = '42501',
      message = 'Assigned sales executive was not found in the authenticated manager team.';
  end if;

  insert into public.visit_plans as inserted_plan (
    team_id,
    customer_id,
    assigned_sales_executive_id,
    scheduled_date,
    scheduled_time,
    status,
    priority,
    planning_note,
    created_by
  )
  values (
    caller_team_id,
    p_customer_id,
    p_assigned_sales_executive_id,
    p_scheduled_date,
    p_scheduled_time,
    'pending'::public.visit_plan_status,
    p_priority,
    normalized_planning_note,
    caller_id
  )
  returning inserted_plan.id, inserted_plan.created_at
  into inserted_visit_plan_id, inserted_created_at;

  return query
  select inserted_visit_plan_id, inserted_created_at;
end;
$$;

comment on function public.create_assigned_visit_plan(
  uuid,
  uuid,
  date,
  time without time zone,
  public.priority_level,
  text
) is
  'Creates one pending visit plan for a manager-owned team by deriving team and creator identity from auth.uid() while preserving RLS through SECURITY INVOKER.';

revoke all on function public.create_assigned_visit_plan(
  uuid,
  uuid,
  date,
  time without time zone,
  public.priority_level,
  text
) from public, anon, authenticated;

grant execute on function public.create_assigned_visit_plan(
  uuid,
  uuid,
  date,
  time without time zone,
  public.priority_level,
  text
) to authenticated;
