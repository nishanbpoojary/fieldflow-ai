-- Complete an assigned visit plan through one atomic database operation so the
-- plan status and its matching visit record can never be committed separately.
-- The authenticated caller is the only identity source, while team, customer,
-- and assignment relationships are derived from the locked visit plan.
-- SECURITY INVOKER deliberately preserves the existing table grants and RLS
-- policies instead of bypassing them with elevated function privileges.
create function public.complete_assigned_visit_plan(
  p_visit_plan_id uuid,
  p_outcome text,
  p_notes text,
  p_next_follow_up_action text default null
)
returns table (
  visit_id uuid,
  visit_plan_id uuid,
  completed_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_role public.app_role;
  locked_team_id uuid;
  locked_customer_id uuid;
  locked_assigned_sales_executive_id uuid;
  locked_status public.visit_plan_status;
  normalized_outcome text := nullif(btrim(p_outcome), '');
  normalized_notes text := nullif(btrim(p_notes), '');
  normalized_next_follow_up_action text :=
    nullif(btrim(p_next_follow_up_action), '');
  completion_timestamp timestamptz := statement_timestamp();
  inserted_visit_id uuid;
  inserted_completed_at timestamptz;
  affected_rows integer;
begin
  if caller_id is null then
    raise exception using
      errcode = '28000',
      message = 'Authentication is required to complete a visit plan.';
  end if;

  caller_role := public.current_user_role();

  if caller_role is distinct from 'sales_executive'::public.app_role then
    raise exception using
      errcode = '42501',
      message = 'Only an assigned sales executive may complete a visit plan.';
  end if;

  if p_visit_plan_id is null then
    raise exception using
      errcode = '22004',
      message = 'A visit plan ID is required.';
  end if;

  if normalized_outcome is null then
    raise exception using
      errcode = '22023',
      message = 'Visit outcome is required.';
  end if;

  if normalized_notes is null then
    raise exception using
      errcode = '22023',
      message = 'Visit notes are required.';
  end if;

  select
    plan.team_id,
    plan.customer_id,
    plan.assigned_sales_executive_id,
    plan.status
  into
    locked_team_id,
    locked_customer_id,
    locked_assigned_sales_executive_id,
    locked_status
  from public.visit_plans as plan
  where plan.id = p_visit_plan_id
  for update;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'Visit plan was not found or is not assigned to the authenticated user.';
  end if;

  if locked_assigned_sales_executive_id is distinct from caller_id then
    raise exception using
      errcode = '42501',
      message = 'The authenticated user is not assigned to this visit plan.';
  end if;

  if exists (
    select 1
    from public.visits as completed_visit
    where completed_visit.visit_plan_id = p_visit_plan_id
  ) then
    raise exception using
      errcode = '23505',
      message = 'This visit plan already has a completed visit record.';
  end if;

  if locked_status is distinct from 'pending'::public.visit_plan_status then
    raise exception using
      errcode = '55000',
      message = format(
        'Only a pending visit plan can be completed; current status is %s.',
        locked_status
      );
  end if;

  insert into public.visits as inserted_visit (
    team_id,
    visit_plan_id,
    customer_id,
    assigned_sales_executive_id,
    completed_by,
    outcome,
    notes,
    next_follow_up_action,
    completed_at
  )
  values (
    locked_team_id,
    p_visit_plan_id,
    locked_customer_id,
    locked_assigned_sales_executive_id,
    caller_id,
    normalized_outcome,
    normalized_notes,
    normalized_next_follow_up_action,
    completion_timestamp
  )
  returning inserted_visit.id, inserted_visit.completed_at
  into inserted_visit_id, inserted_completed_at;

  update public.visit_plans
  set status = 'completed'::public.visit_plan_status
  where id = p_visit_plan_id
    and status = 'pending'::public.visit_plan_status;

  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception using
      errcode = '55000',
      message = 'The pending visit plan could not be marked as completed.';
  end if;

  return query
  select inserted_visit_id, p_visit_plan_id, inserted_completed_at;
end;
$$;

comment on function public.complete_assigned_visit_plan(uuid, text, text, text) is
  'Atomically completes a pending assigned visit plan and records its authenticated sales executive outcome while preserving RLS through SECURITY INVOKER.';

revoke all on function public.complete_assigned_visit_plan(uuid, text, text, text)
  from public, anon, authenticated;

grant execute on function public.complete_assigned_visit_plan(uuid, text, text, text)
  to authenticated;
