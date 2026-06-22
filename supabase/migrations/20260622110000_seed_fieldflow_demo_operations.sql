-- Synthetic portfolio demo data for FieldFlow Demo Motors only.
-- Every company, contact name, and contact detail below is fictional.
-- Relative CURRENT_DATE values keep dashboard scenarios relevant when applied.

do $$
declare
  expected_demo_team_id constant uuid := '3d7c6e0a-0fd2-4f61-9a89-4f724964d701';
  expected_mangaluru_central_id constant uuid := '3d7c6e0a-0fd2-4f61-9a89-4f724964d711';
  expected_bantwal_id constant uuid := '3d7c6e0a-0fd2-4f61-9a89-4f724964d712';
  expected_puttur_id constant uuid := '3d7c6e0a-0fd2-4f61-9a89-4f724964d713';
  demo_team_id uuid;
  manager_user_id uuid;
  maya_user_id uuid;
  manager_display_name text;
  manager_role public.app_role;
  manager_team_id uuid;
  maya_display_name text;
  maya_role public.app_role;
  maya_team_id uuid;
  mangaluru_central_id uuid;
  mangaluru_central_team_id uuid;
  bantwal_id uuid;
  bantwal_team_id uuid;
  puttur_id uuid;
  puttur_team_id uuid;
  affected_rows integer;
begin
  -- Resolve and lock every required bootstrap record before writing seed data.
  begin
    select team.id
    into strict demo_team_id
    from public.teams as team
    where team.name = 'FieldFlow Demo Motors'
    for share;
  exception
    when no_data_found then
      raise exception 'Operational seed requires the FieldFlow Demo Motors team.';
    when too_many_rows then
      raise exception 'Operational seed found multiple FieldFlow Demo Motors teams.';
  end;

  if demo_team_id is distinct from expected_demo_team_id then
    raise exception 'FieldFlow Demo Motors has an unexpected team ID: %.', demo_team_id;
  end if;

  begin
    select app_user.id
    into strict manager_user_id
    from auth.users as app_user
    where app_user.email = 'manager@fieldflow.test';
  exception
    when no_data_found then
      raise exception 'Operational seed requires auth user manager@fieldflow.test.';
    when too_many_rows then
      raise exception 'Operational seed found multiple auth users for manager@fieldflow.test.';
  end;

  begin
    select app_user.id
    into strict maya_user_id
    from auth.users as app_user
    where app_user.email = 'maya.chen@fieldflow.test';
  exception
    when no_data_found then
      raise exception 'Operational seed requires auth user maya.chen@fieldflow.test.';
    when too_many_rows then
      raise exception 'Operational seed found multiple auth users for maya.chen@fieldflow.test.';
  end;

  if manager_user_id is null then
    raise exception 'Resolved manager user ID is unexpectedly null.';
  end if;

  if maya_user_id is null then
    raise exception 'Resolved Maya Chen user ID is unexpectedly null.';
  end if;

  begin
    select profile.display_name, profile.role, profile.team_id
    into strict manager_display_name, manager_role, manager_team_id
    from public.profiles as profile
    where profile.id = manager_user_id
    for share;
  exception
    when no_data_found then
      raise exception 'Operational seed requires Arjun Rao public.profiles data.';
  end;

  if manager_display_name <> 'Arjun Rao' then
    raise exception 'Manager profile must have display_name Arjun Rao, found %.', manager_display_name;
  end if;

  if manager_role is distinct from 'manager'::public.app_role then
    raise exception 'Arjun Rao must have the manager role.';
  end if;

  if manager_team_id is distinct from demo_team_id then
    raise exception 'Arjun Rao must belong to FieldFlow Demo Motors.';
  end if;

  begin
    select profile.display_name, profile.role, profile.team_id
    into strict maya_display_name, maya_role, maya_team_id
    from public.profiles as profile
    where profile.id = maya_user_id
    for share;
  exception
    when no_data_found then
      raise exception 'Operational seed requires Maya Chen public.profiles data.';
  end;

  if maya_display_name <> 'Maya Chen' then
    raise exception 'Sales executive profile must have display_name Maya Chen, found %.', maya_display_name;
  end if;

  if maya_role is distinct from 'sales_executive'::public.app_role then
    raise exception 'Maya Chen must have the sales_executive role.';
  end if;

  if maya_team_id is distinct from demo_team_id then
    raise exception 'Maya Chen must belong to FieldFlow Demo Motors.';
  end if;

  begin
    select territory.id, territory.team_id
    into strict mangaluru_central_id, mangaluru_central_team_id
    from public.territories as territory
    where territory.id = expected_mangaluru_central_id
      and territory.name = 'Mangaluru Central'
    for share;
  exception
    when no_data_found then
      raise exception 'Operational seed requires the expected Mangaluru Central territory.';
  end;

  if mangaluru_central_team_id is distinct from demo_team_id then
    raise exception 'Mangaluru Central must belong to FieldFlow Demo Motors.';
  end if;

  begin
    select territory.id, territory.team_id
    into strict bantwal_id, bantwal_team_id
    from public.territories as territory
    where territory.id = expected_bantwal_id
      and territory.name = 'Bantwal'
    for share;
  exception
    when no_data_found then
      raise exception 'Operational seed requires the expected Bantwal territory.';
  end;

  if bantwal_team_id is distinct from demo_team_id then
    raise exception 'Bantwal must belong to FieldFlow Demo Motors.';
  end if;

  begin
    select territory.id, territory.team_id
    into strict puttur_id, puttur_team_id
    from public.territories as territory
    where territory.id = expected_puttur_id
      and territory.name = 'Puttur'
    for share;
  exception
    when no_data_found then
      raise exception 'Operational seed requires the expected Puttur territory.';
  end;

  if puttur_team_id is distinct from demo_team_id then
    raise exception 'Puttur must belong to FieldFlow Demo Motors.';
  end if;

  insert into public.customers (
    id,
    team_id,
    territory_id,
    assigned_sales_executive_id,
    company_name,
    contact_name,
    contact_phone,
    contact_email,
    status,
    priority,
    last_interaction_at,
    next_follow_up_date,
    notes,
    created_by
  )
  values
    (
      '50000000-0000-4000-8000-000000000001', demo_team_id,
      mangaluru_central_id, maya_user_id, 'Meridian Forge Mobility',
      'Anika Vale', null, 'anika.vale@meridian-forge.example.test',
      'prospect'::public.customer_status, 'high'::public.priority_level,
      now() - interval '2 days', current_date,
      'Requested a fictional fleet configuration proposal for the next review.',
      manager_user_id
    ),
    (
      '50000000-0000-4000-8000-000000000002', demo_team_id,
      mangaluru_central_id, maya_user_id, 'Blue Harbor Auto Works',
      'Dev Rellan', null, 'dev.rellan@blue-harbor.example.test',
      'active'::public.customer_status, 'medium'::public.priority_level,
      now() - interval '1 day', current_date + 3,
      'Active demo account comparing service package renewal options.',
      manager_user_id
    ),
    (
      '50000000-0000-4000-8000-000000000003', demo_team_id,
      mangaluru_central_id, maya_user_id, 'Cedar Trail Fleet Hub',
      'Mira Solen', null, 'mira.solen@cedar-trail.example.test',
      'at_risk'::public.customer_status, 'high'::public.priority_level,
      now() - interval '8 days', current_date - 2,
      'Demo account needs prompt follow-up after a delayed quotation response.',
      manager_user_id
    ),
    (
      '50000000-0000-4000-8000-000000000004', demo_team_id,
      bantwal_id, maya_user_id, 'Silver Kite Dealership',
      'Kabir Noren', null, 'kabir.noren@silver-kite.example.test',
      'converted'::public.customer_status, 'low'::public.priority_level,
      now() - interval '3 days', current_date + 7,
      'Converted fictional account preparing for a routine onboarding check-in.',
      manager_user_id
    ),
    (
      '50000000-0000-4000-8000-000000000005', demo_team_id,
      bantwal_id, maya_user_id, 'Nova Palm Motors',
      'Isha Verin', null, 'isha.verin@nova-palm.example.test',
      'active'::public.customer_status, 'high'::public.priority_level,
      now() - interval '4 days', current_date,
      'High-priority demo account reviewing an expanded vehicle allocation.',
      manager_user_id
    ),
    (
      '50000000-0000-4000-8000-000000000006', demo_team_id,
      bantwal_id, maya_user_id, 'Amber Route Garage',
      'Nila Arden', null, 'nila.arden@amber-route.example.test',
      'inactive'::public.customer_status, 'low'::public.priority_level,
      now() - interval '45 days', current_date + 30,
      'Inactive fictional account retained for re-engagement reporting scenarios.',
      manager_user_id
    ),
    (
      '50000000-0000-4000-8000-000000000007', demo_team_id,
      puttur_id, maya_user_id, 'Coastal Prism Vehicles',
      'Aman Vale', null, 'aman.vale@coastal-prism.example.test',
      'prospect'::public.customer_status, 'medium'::public.priority_level,
      now() - interval '6 days', current_date + 1,
      'Prospect requested a fictional dealership capability overview.',
      manager_user_id
    ),
    (
      '50000000-0000-4000-8000-000000000008', demo_team_id,
      puttur_id, maya_user_id, 'Red Lantern Mobility',
      'Rhea Kest', null, 'rhea.kest@red-lantern.example.test',
      'converted'::public.customer_status, 'medium'::public.priority_level,
      now() - interval '5 days', current_date + 10,
      'Converted demo account awaiting a scheduled adoption review.',
      manager_user_id
    );

  get diagnostics affected_rows = row_count;

  if affected_rows <> 8 then
    raise exception 'Expected to insert 8 customers, inserted %.', affected_rows;
  end if;

  insert into public.visit_plans (
    id,
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
  values
    (
      '51000000-0000-4000-8000-000000000001', demo_team_id,
      '50000000-0000-4000-8000-000000000001', maya_user_id,
      current_date - 3, time '09:30', 'completed'::public.visit_plan_status,
      'high'::public.priority_level, 'Review fleet needs and proposal scope.', manager_user_id
    ),
    (
      '51000000-0000-4000-8000-000000000002', demo_team_id,
      '50000000-0000-4000-8000-000000000002', maya_user_id,
      current_date - 2, time '11:00', 'completed'::public.visit_plan_status,
      'medium'::public.priority_level, 'Discuss service package renewal options.', manager_user_id
    ),
    (
      '51000000-0000-4000-8000-000000000003', demo_team_id,
      '50000000-0000-4000-8000-000000000003', maya_user_id,
      current_date - 1, time '15:00', 'completed'::public.visit_plan_status,
      'high'::public.priority_level, 'Recover the delayed quotation conversation.', manager_user_id
    ),
    (
      '51000000-0000-4000-8000-000000000004', demo_team_id,
      '50000000-0000-4000-8000-000000000004', maya_user_id,
      current_date, time '09:00', 'pending'::public.visit_plan_status,
      'medium'::public.priority_level, 'Complete the onboarding progress check.', manager_user_id
    ),
    (
      '51000000-0000-4000-8000-000000000005', demo_team_id,
      '50000000-0000-4000-8000-000000000005', maya_user_id,
      current_date, time '14:30', 'pending'::public.visit_plan_status,
      'high'::public.priority_level, 'Review expansion requirements and timing.', manager_user_id
    ),
    (
      '51000000-0000-4000-8000-000000000006', demo_team_id,
      '50000000-0000-4000-8000-000000000007', maya_user_id,
      current_date + 2, time '10:00', 'pending'::public.visit_plan_status,
      'medium'::public.priority_level, 'Present the fictional dealership capability overview.', manager_user_id
    ),
    (
      '51000000-0000-4000-8000-000000000007', demo_team_id,
      '50000000-0000-4000-8000-000000000006', maya_user_id,
      current_date - 4, time '13:00', 'missed'::public.visit_plan_status,
      'low'::public.priority_level, 'Attempt a re-engagement conversation.', manager_user_id
    ),
    (
      '51000000-0000-4000-8000-000000000008', demo_team_id,
      '50000000-0000-4000-8000-000000000008', maya_user_id,
      current_date + 1, time '16:00', 'cancelled'::public.visit_plan_status,
      'low'::public.priority_level, 'Adoption review cancelled pending a new date.', manager_user_id
    );

  get diagnostics affected_rows = row_count;

  if affected_rows <> 8 then
    raise exception 'Expected to insert 8 visit plans, inserted %.', affected_rows;
  end if;

  insert into public.visits (
    id,
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
  values
    (
      '52000000-0000-4000-8000-000000000001', demo_team_id,
      '51000000-0000-4000-8000-000000000001',
      '50000000-0000-4000-8000-000000000001', maya_user_id, maya_user_id,
      'Proposal scope confirmed',
      'The fictional contact confirmed vehicle mix and review criteria.',
      'Send the tailored proposal and confirm a review call.',
      date_trunc('day', now()) - interval '3 days' + interval '10 hours 15 minutes'
    ),
    (
      '52000000-0000-4000-8000-000000000002', demo_team_id,
      '51000000-0000-4000-8000-000000000002',
      '50000000-0000-4000-8000-000000000002', maya_user_id, maya_user_id,
      'Renewal options shortlisted',
      'Two fictional service packages were selected for comparison.',
      'Share the final package comparison before the next call.',
      date_trunc('day', now()) - interval '2 days' + interval '12 hours'
    ),
    (
      '52000000-0000-4000-8000-000000000003', demo_team_id,
      '51000000-0000-4000-8000-000000000003',
      '50000000-0000-4000-8000-000000000003', maya_user_id, maya_user_id,
      'Account recovery plan agreed',
      'The delayed quotation was acknowledged and a recovery timeline accepted.',
      'Deliver the revised quotation and schedule a manager check-in.',
      date_trunc('day', now()) - interval '1 day' + interval '16 hours'
    );

  get diagnostics affected_rows = row_count;

  if affected_rows <> 3 then
    raise exception 'Expected to insert 3 completed visits, inserted %.', affected_rows;
  end if;

  insert into public.follow_ups (
    id,
    team_id,
    customer_id,
    assigned_sales_executive_id,
    title,
    due_date,
    priority,
    state,
    planning_note,
    completion_note,
    completed_at,
    created_by
  )
  values
    (
      '53000000-0000-4000-8000-000000000001', demo_team_id,
      '50000000-0000-4000-8000-000000000003', maya_user_id,
      'Send revised quotation', current_date - 3,
      'high'::public.priority_level, 'open'::public.work_item_state,
      'Prioritize the recovery timeline agreed during the visit.', null, null, manager_user_id
    ),
    (
      '53000000-0000-4000-8000-000000000002', demo_team_id,
      '50000000-0000-4000-8000-000000000002', maya_user_id,
      'Share renewal comparison', current_date - 1,
      'medium'::public.priority_level, 'open'::public.work_item_state,
      'Summarize the two shortlisted fictional packages.', null, null, manager_user_id
    ),
    (
      '53000000-0000-4000-8000-000000000003', demo_team_id,
      '50000000-0000-4000-8000-000000000001', maya_user_id,
      'Confirm proposal review call', current_date,
      'high'::public.priority_level, 'open'::public.work_item_state,
      'Offer two review times after sending the proposal.', null, null, manager_user_id
    ),
    (
      '53000000-0000-4000-8000-000000000004', demo_team_id,
      '50000000-0000-4000-8000-000000000005', maya_user_id,
      'Confirm expansion quantities', current_date,
      'medium'::public.priority_level, 'open'::public.work_item_state,
      'Capture the fictional allocation quantities before the visit.', null, null, manager_user_id
    ),
    (
      '53000000-0000-4000-8000-000000000005', demo_team_id,
      '50000000-0000-4000-8000-000000000007', maya_user_id,
      'Send capability overview', current_date + 2,
      'low'::public.priority_level, 'open'::public.work_item_state,
      'Send the demo overview before the upcoming visit.', null, null, manager_user_id
    ),
    (
      '53000000-0000-4000-8000-000000000006', demo_team_id,
      '50000000-0000-4000-8000-000000000004', maya_user_id,
      'Schedule onboarding review', current_date + 5,
      'high'::public.priority_level, 'open'::public.work_item_state,
      'Coordinate the fictional onboarding review agenda.', null, null, manager_user_id
    ),
    (
      '53000000-0000-4000-8000-000000000007', demo_team_id,
      '50000000-0000-4000-8000-000000000006', maya_user_id,
      'Record re-engagement preference', current_date - 5,
      'low'::public.priority_level, 'completed'::public.work_item_state,
      'Confirm whether the account wants future contact.',
      'Fictional contact requested a later-quarter check-in.',
      date_trunc('day', now()) - interval '5 days' + interval '15 hours', manager_user_id
    ),
    (
      '53000000-0000-4000-8000-000000000008', demo_team_id,
      '50000000-0000-4000-8000-000000000008', maya_user_id,
      'Acknowledge adoption review delay', current_date - 2,
      'medium'::public.priority_level, 'completed'::public.work_item_state,
      'Confirm receipt of the cancellation request.',
      'Delay acknowledged and a future scheduling window recorded.',
      date_trunc('day', now()) - interval '2 days' + interval '17 hours', manager_user_id
    );

  get diagnostics affected_rows = row_count;

  if affected_rows <> 8 then
    raise exception 'Expected to insert 8 follow-ups, inserted %.', affected_rows;
  end if;

  insert into public.tasks (
    id,
    team_id,
    related_customer_id,
    assigned_sales_executive_id,
    title,
    due_date,
    priority,
    state,
    planning_note,
    completion_note,
    completed_at,
    created_by
  )
  values
    (
      '54000000-0000-4000-8000-000000000001', demo_team_id,
      '50000000-0000-4000-8000-000000000003', maya_user_id,
      'Escalate quotation review', current_date - 2,
      'high'::public.priority_level, 'open'::public.work_item_state,
      'Prepare a concise summary for the manager review.', null, null, manager_user_id
    ),
    (
      '54000000-0000-4000-8000-000000000002', demo_team_id,
      '50000000-0000-4000-8000-000000000002', maya_user_id,
      'Finalize renewal comparison', current_date - 1,
      'medium'::public.priority_level, 'open'::public.work_item_state,
      'Check pricing assumptions in the fictional package comparison.', null, null, manager_user_id
    ),
    (
      '54000000-0000-4000-8000-000000000003', demo_team_id,
      '50000000-0000-4000-8000-000000000001', maya_user_id,
      'Prepare proposal email', current_date,
      'high'::public.priority_level, 'open'::public.work_item_state,
      'Draft the proposal summary and review-call options.', null, null, manager_user_id
    ),
    (
      '54000000-0000-4000-8000-000000000004', demo_team_id,
      null, maya_user_id,
      'Prepare weekly route summary', current_date,
      'low'::public.priority_level, 'open'::public.work_item_state,
      'Summarize completed, pending, and missed demo visits.', null, null, manager_user_id
    ),
    (
      '54000000-0000-4000-8000-000000000005', demo_team_id,
      '50000000-0000-4000-8000-000000000005', maya_user_id,
      'Draft expansion checklist', current_date + 2,
      'medium'::public.priority_level, 'open'::public.work_item_state,
      'List quantity, timing, and service questions for the visit.', null, null, manager_user_id
    ),
    (
      '54000000-0000-4000-8000-000000000006', demo_team_id,
      '50000000-0000-4000-8000-000000000007', maya_user_id,
      'Review prospect briefing', current_date + 4,
      'high'::public.priority_level, 'open'::public.work_item_state,
      'Review the fictional capability overview before presenting it.', null, null, manager_user_id
    ),
    (
      '54000000-0000-4000-8000-000000000007', demo_team_id,
      null, maya_user_id,
      'Archive prior route notes', current_date - 3,
      'low'::public.priority_level, 'completed'::public.work_item_state,
      'Organize fictional notes from the previous route cycle.',
      'Prior route notes were reviewed and archived.',
      date_trunc('day', now()) - interval '3 days' + interval '16 hours', manager_user_id
    ),
    (
      '54000000-0000-4000-8000-000000000008', demo_team_id,
      '50000000-0000-4000-8000-000000000004', maya_user_id,
      'Complete onboarding summary', current_date - 1,
      'medium'::public.priority_level, 'completed'::public.work_item_state,
      'Record the fictional onboarding milestones already completed.',
      'Onboarding milestones and remaining actions were documented.',
      date_trunc('day', now()) - interval '1 day' + interval '17 hours', manager_user_id
    );

  get diagnostics affected_rows = row_count;

  if affected_rows <> 8 then
    raise exception 'Expected to insert 8 tasks, inserted %.', affected_rows;
  end if;

  insert into public.monthly_targets (
    id,
    team_id,
    sales_executive_id,
    territory_id,
    target_month,
    target_visits,
    target_completions,
    target_conversions
  )
  values (
    '55000000-0000-4000-8000-000000000001',
    demo_team_id,
    maya_user_id,
    null,
    date_trunc('month', current_date::timestamp)::date,
    60,
    45,
    8
  );

  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'Expected to insert 1 monthly target, inserted %.', affected_rows;
  end if;
end;
$$;
