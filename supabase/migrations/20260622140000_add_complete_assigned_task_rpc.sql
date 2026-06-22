-- Use one focused RPC instead of a direct browser task update so callers can
-- request only the allowed open-to-completed workflow transition. Caller
-- identity comes exclusively from auth.uid(), never from browser input.
-- SECURITY INVOKER preserves the existing table grants and RLS enforcement.
-- Locking the row before checking its open state ensures that simultaneous or
-- repeated completion attempts cannot both succeed.
create function public.complete_assigned_task(
  p_task_id uuid,
  p_completion_note text
)
returns table (
  task_id uuid,
  completed_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_role public.app_role;
  locked_assigned_sales_executive_id uuid;
  locked_state public.work_item_state;
  normalized_completion_note text := nullif(btrim(p_completion_note), '');
  completion_timestamp timestamptz := statement_timestamp();
  updated_completed_at timestamptz;
  affected_rows integer;
begin
  if caller_id is null then
    raise exception using
      errcode = '28000',
      message = 'Authentication is required to complete a task.';
  end if;

  caller_role := public.current_user_role();

  if caller_role is distinct from 'sales_executive'::public.app_role then
    raise exception using
      errcode = '42501',
      message = 'Only an assigned sales executive may complete a task.';
  end if;

  if p_task_id is null then
    raise exception using
      errcode = '22004',
      message = 'A task ID is required.';
  end if;

  if normalized_completion_note is null then
    raise exception using
      errcode = '22023',
      message = 'A completion note is required.';
  end if;

  select
    task.assigned_sales_executive_id,
    task.state
  into
    locked_assigned_sales_executive_id,
    locked_state
  from public.tasks as task
  where task.id = p_task_id
  for update;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'Task was not found or is not assigned to the authenticated user.';
  end if;

  if locked_assigned_sales_executive_id is distinct from caller_id then
    raise exception using
      errcode = '42501',
      message = 'The authenticated user is not assigned to this task.';
  end if;

  if locked_state is distinct from 'open'::public.work_item_state then
    raise exception using
      errcode = '55000',
      message = format(
        'Only an open task can be completed; current state is %s.',
        locked_state
      );
  end if;

  update public.tasks as task
  set
    state = 'completed'::public.work_item_state,
    completion_note = normalized_completion_note,
    completed_at = completion_timestamp
  where task.id = p_task_id
    and task.assigned_sales_executive_id = caller_id
    and task.state = 'open'::public.work_item_state
  returning task.completed_at
  into updated_completed_at;

  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception using
      errcode = '55000',
      message = 'The open task could not be marked as completed.';
  end if;

  return query
  select p_task_id, updated_completed_at;
end;
$$;

comment on function public.complete_assigned_task(uuid, text) is
  'Completes one open task assigned to the authenticated sales executive while preserving RLS through SECURITY INVOKER.';

revoke all on function public.complete_assigned_task(uuid, text)
  from public, anon, authenticated;

grant execute on function public.complete_assigned_task(uuid, text)
  to authenticated;
