-- Use one focused RPC instead of direct browser insertion so follow-up creation
-- accepts only business inputs, never trusted ownership or completion fields.
-- Team and creator identity come exclusively from auth.uid() through the
-- authenticated manager profile, not from browser-provided values.
-- SECURITY INVOKER keeps the existing table grants and RLS policies active.
-- Same-team customer and sales executive checks prevent assigning work across
-- authorization boundaries before the row is inserted.
create function public.create_assigned_follow_up(
  p_customer_id uuid,
  p_assigned_sales_executive_id uuid,
  p_title text,
  p_due_date date,
  p_priority public.priority_level default 'medium'::public.priority_level,
  p_planning_note text default null
)
returns table (
  follow_up_id uuid,
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
  normalized_title text := nullif(btrim(p_title), '');
  normalized_planning_note text := nullif(btrim(p_planning_note), '');
  inserted_follow_up_id uuid;
  inserted_created_at timestamptz;
begin
  if caller_id is null then
    raise exception using
      errcode = '28000',
      message = 'Authentication is required to create a follow-up.';
  end if;

  caller_role := public.current_user_role();
  caller_team_id := public.current_user_team_id();

  if caller_role is distinct from 'manager'::public.app_role then
    raise exception using
      errcode = '42501',
      message = 'Only a manager may create an assigned follow-up.';
  end if;

  if caller_team_id is null then
    raise exception using
      errcode = '42501',
      message = 'A manager team assignment is required to create a follow-up.';
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

  if normalized_title is null then
    raise exception using
      errcode = '22023',
      message = 'A follow-up title is required.';
  end if;

  if p_due_date is null then
    raise exception using
      errcode = '22004',
      message = 'A follow-up due date is required.';
  end if;

  if p_priority is null then
    raise exception using
      errcode = '22004',
      message = 'A follow-up priority is required.';
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

  insert into public.follow_ups as inserted_follow_up (
    team_id,
    customer_id,
    assigned_sales_executive_id,
    title,
    due_date,
    priority,
    state,
    planning_note,
    created_by
  )
  values (
    caller_team_id,
    p_customer_id,
    p_assigned_sales_executive_id,
    normalized_title,
    p_due_date,
    p_priority,
    'open'::public.work_item_state,
    normalized_planning_note,
    caller_id
  )
  returning inserted_follow_up.id, inserted_follow_up.created_at
  into inserted_follow_up_id, inserted_created_at;

  return query
  select inserted_follow_up_id, inserted_created_at;
end;
$$;

comment on function public.create_assigned_follow_up(
  uuid,
  uuid,
  text,
  date,
  public.priority_level,
  text
) is
  'Creates one open follow-up for a manager-owned team by deriving team and creator identity from auth.uid() while preserving RLS through SECURITY INVOKER.';

revoke all on function public.create_assigned_follow_up(
  uuid,
  uuid,
  text,
  date,
  public.priority_level,
  text
) from public, anon, authenticated;

grant execute on function public.create_assigned_follow_up(
  uuid,
  uuid,
  text,
  date,
  public.priority_level,
  text
) to authenticated;
