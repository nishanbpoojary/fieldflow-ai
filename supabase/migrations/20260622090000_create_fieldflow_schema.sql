-- FieldFlow AI initial PostgreSQL schema and Row Level Security foundation.
-- This migration intentionally contains no seed data.

-- Domain enums keep application values consistent across all workflow tables.
create type public.app_role as enum ('manager', 'sales_executive');
create type public.priority_level as enum ('high', 'medium', 'low');
create type public.customer_status as enum (
  'prospect',
  'active',
  'at_risk',
  'converted',
  'inactive'
);
create type public.visit_plan_status as enum (
  'pending',
  'completed',
  'missed',
  'cancelled'
);
create type public.work_item_state as enum ('open', 'completed', 'cancelled');
create type public.insight_provider as enum ('gemini', 'mock');

-- Teams are the top-level authorization boundary for FieldFlow AI data.
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_name_key unique (name)
);

comment on table public.teams is
  'Sales teams that form the primary authorization boundary for FieldFlow AI.';

-- Profiles extend auth.users with the fixed application role and team membership.
-- team_id is temporarily nullable because the auth trigger must not trust signup
-- metadata for team assignment. A privileged onboarding process must assign a
-- team before the profile can access team-scoped application records.
-- New signups are unassigned sales executives by default. Team creation and the
-- first manager assignment require a privileged admin/bootstrap process and
-- must never be performed through normal browser permissions.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'sales_executive',
  display_name text not null check (length(btrim(display_name)) > 0),
  team_id uuid references public.teams (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint manager_profiles_require_team check (
    role <> 'manager' or team_id is not null
  ),
  constraint profiles_id_team_key unique (id, team_id)
);

comment on table public.profiles is
  'Application profiles linked one-to-one with auth.users; role and team assignment are privileged fields.';

create unique index profiles_one_manager_per_team_idx
  on public.profiles (team_id)
  where role = 'manager' and team_id is not null;

-- Territories partition a team's field-sales coverage.
create table public.territories (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint territories_team_name_key unique (team_id, name),
  constraint territories_id_team_key unique (id, team_id)
);

comment on table public.territories is
  'Named sales territories owned by a single team.';

-- Customers are synthetic dealership or account records assigned to executives.
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  territory_id uuid not null,
  assigned_sales_executive_id uuid not null,
  company_name text not null check (length(btrim(company_name)) > 0),
  contact_name text,
  contact_phone text,
  contact_email text,
  status public.customer_status not null default 'prospect',
  priority public.priority_level not null default 'medium',
  last_interaction_at timestamptz,
  next_follow_up_date date,
  notes text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customers_id_team_key unique (id, team_id),
  constraint customers_territory_team_fkey
    foreign key (territory_id, team_id)
    references public.territories (id, team_id)
    on delete restrict,
  constraint customers_assigned_sales_executive_team_fkey
    foreign key (assigned_sales_executive_id, team_id)
    references public.profiles (id, team_id)
    on delete restrict,
  constraint customers_created_by_team_fkey
    foreign key (created_by, team_id)
    references public.profiles (id, team_id)
    on delete restrict
);

comment on table public.customers is
  'Synthetic customer and dealership accounts assigned to sales executives.';

-- Visit plans represent scheduled field activity before a visit is completed.
create table public.visit_plans (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  customer_id uuid not null,
  assigned_sales_executive_id uuid not null,
  scheduled_date date not null,
  scheduled_time time without time zone not null,
  status public.visit_plan_status not null default 'pending',
  priority public.priority_level not null default 'medium',
  planning_note text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visit_plans_id_team_key unique (id, team_id),
  constraint visit_plans_customer_team_fkey
    foreign key (customer_id, team_id)
    references public.customers (id, team_id)
    on delete cascade,
  constraint visit_plans_assigned_sales_executive_team_fkey
    foreign key (assigned_sales_executive_id, team_id)
    references public.profiles (id, team_id)
    on delete restrict,
  constraint visit_plans_created_by_team_fkey
    foreign key (created_by, team_id)
    references public.profiles (id, team_id)
    on delete restrict
);

comment on table public.visit_plans is
  'Scheduled customer visits, including assignment, timing, priority, and planning context.';

-- Visits capture completed field activity and its business outcome.
create table public.visits (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  visit_plan_id uuid,
  customer_id uuid not null,
  assigned_sales_executive_id uuid not null,
  completed_by uuid not null,
  outcome text not null check (length(btrim(outcome)) > 0),
  notes text,
  next_follow_up_action text,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visits_visit_plan_key unique (visit_plan_id),
  constraint visits_visit_plan_team_fkey
    foreign key (visit_plan_id, team_id)
    references public.visit_plans (id, team_id)
    on delete set null (visit_plan_id),
  constraint visits_customer_team_fkey
    foreign key (customer_id, team_id)
    references public.customers (id, team_id)
    on delete cascade,
  constraint visits_assigned_sales_executive_team_fkey
    foreign key (assigned_sales_executive_id, team_id)
    references public.profiles (id, team_id)
    on delete restrict,
  constraint visits_completed_by_team_fkey
    foreign key (completed_by, team_id)
    references public.profiles (id, team_id)
    on delete restrict
);

comment on table public.visits is
  'Completed customer visit records with outcomes, notes, and optional next actions.';

-- Follow-up urgency is derived later from due_date and state. Storing labels
-- such as overdue or due_today would become stale as calendar time advances.
create table public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  customer_id uuid not null,
  assigned_sales_executive_id uuid not null,
  title text not null check (length(btrim(title)) > 0),
  due_date date not null,
  priority public.priority_level not null default 'medium',
  state public.work_item_state not null default 'open',
  planning_note text,
  completion_note text,
  completed_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint follow_ups_completion_consistency check (
    (state = 'completed' and completed_at is not null)
    or (state <> 'completed' and completed_at is null)
  ),
  constraint follow_ups_customer_team_fkey
    foreign key (customer_id, team_id)
    references public.customers (id, team_id)
    on delete cascade,
  constraint follow_ups_assigned_sales_executive_team_fkey
    foreign key (assigned_sales_executive_id, team_id)
    references public.profiles (id, team_id)
    on delete restrict,
  constraint follow_ups_created_by_team_fkey
    foreign key (created_by, team_id)
    references public.profiles (id, team_id)
    on delete restrict
);

comment on table public.follow_ups is
  'Customer follow-up commitments; overdue and due-today labels are derived from due_date and state.';

-- Task urgency is also derived from due_date and state rather than stored as a
-- dynamic status, preventing date-based labels from becoming stale.
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  related_customer_id uuid,
  assigned_sales_executive_id uuid not null,
  title text not null check (length(btrim(title)) > 0),
  due_date date not null,
  priority public.priority_level not null default 'medium',
  state public.work_item_state not null default 'open',
  planning_note text,
  completion_note text,
  completed_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_completion_consistency check (
    (state = 'completed' and completed_at is not null)
    or (state <> 'completed' and completed_at is null)
  ),
  constraint tasks_related_customer_team_fkey
    foreign key (related_customer_id, team_id)
    references public.customers (id, team_id)
    on delete set null (related_customer_id),
  constraint tasks_assigned_sales_executive_team_fkey
    foreign key (assigned_sales_executive_id, team_id)
    references public.profiles (id, team_id)
    on delete restrict,
  constraint tasks_created_by_team_fkey
    foreign key (created_by, team_id)
    references public.profiles (id, team_id)
    on delete restrict
);

comment on table public.tasks is
  'General assigned work items; overdue and due-today labels are derived from due_date and state.';

-- Monthly targets hold one monthly goal set for each sales executive.
create table public.monthly_targets (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  sales_executive_id uuid not null,
  territory_id uuid,
  target_month date not null,
  target_visits integer not null default 0 check (target_visits >= 0),
  target_completions integer not null default 0 check (target_completions >= 0),
  target_conversions integer not null default 0 check (target_conversions >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_targets_first_day_check check (
    target_month = date_trunc('month', target_month::timestamp)::date
  ),
  constraint monthly_targets_sales_executive_month_key unique (
    sales_executive_id,
    target_month
  ),
  constraint monthly_targets_sales_executive_team_fkey
    foreign key (sales_executive_id, team_id)
    references public.profiles (id, team_id)
    on delete cascade,
  constraint monthly_targets_territory_team_fkey
    foreign key (territory_id, team_id)
    references public.territories (id, team_id)
    on delete set null (territory_id)
);

comment on table public.monthly_targets is
  'Monthly visit, completion, and conversion goals for a sales executive.';

-- AI insights store only explicitly requested manager summaries.
create table public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  requested_by uuid not null,
  period_start date not null,
  period_end date not null,
  provider public.insight_provider not null,
  summary text not null check (length(btrim(summary)) > 0),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint ai_insights_period_check check (period_end >= period_start),
  constraint ai_insights_requested_by_team_fkey
    foreign key (requested_by, team_id)
    references public.profiles (id, team_id)
    on delete restrict
);

comment on table public.ai_insights is
  'On-demand manager AI summaries and their bounded synthetic operational payloads.';

-- Foreign-key and workflow indexes support common team and assignment filters.
create index profiles_team_id_idx on public.profiles (team_id);
create index territories_team_id_idx on public.territories (team_id);

create index customers_team_id_idx on public.customers (team_id);
create index customers_territory_id_idx on public.customers (territory_id);
create index customers_assigned_sales_executive_id_idx
  on public.customers (assigned_sales_executive_id);
create index customers_status_idx on public.customers (status);
create index customers_next_follow_up_date_idx
  on public.customers (next_follow_up_date);
create index customers_created_by_idx on public.customers (created_by);

create index visit_plans_team_id_idx on public.visit_plans (team_id);
create index visit_plans_customer_id_idx on public.visit_plans (customer_id);
create index visit_plans_assigned_sales_executive_id_idx
  on public.visit_plans (assigned_sales_executive_id);
create index visit_plans_scheduled_date_idx
  on public.visit_plans (scheduled_date);
create index visit_plans_status_idx on public.visit_plans (status);
create index visit_plans_created_by_idx on public.visit_plans (created_by);

create index visits_team_id_idx on public.visits (team_id);
create index visits_customer_id_idx on public.visits (customer_id);
create index visits_assigned_sales_executive_id_idx
  on public.visits (assigned_sales_executive_id);
create index visits_completed_at_idx on public.visits (completed_at);
create index visits_completed_by_idx on public.visits (completed_by);

create index follow_ups_team_id_idx on public.follow_ups (team_id);
create index follow_ups_customer_id_idx on public.follow_ups (customer_id);
create index follow_ups_assigned_sales_executive_id_idx
  on public.follow_ups (assigned_sales_executive_id);
create index follow_ups_due_date_idx on public.follow_ups (due_date);
create index follow_ups_state_idx on public.follow_ups (state);
create index follow_ups_created_by_idx on public.follow_ups (created_by);

create index tasks_team_id_idx on public.tasks (team_id);
create index tasks_related_customer_id_idx
  on public.tasks (related_customer_id);
create index tasks_assigned_sales_executive_id_idx
  on public.tasks (assigned_sales_executive_id);
create index tasks_due_date_idx on public.tasks (due_date);
create index tasks_state_idx on public.tasks (state);
create index tasks_created_by_idx on public.tasks (created_by);

create index monthly_targets_team_id_idx on public.monthly_targets (team_id);
create index monthly_targets_sales_executive_id_idx
  on public.monthly_targets (sales_executive_id);
create index monthly_targets_territory_id_idx
  on public.monthly_targets (territory_id);
create index monthly_targets_target_month_idx
  on public.monthly_targets (target_month);

create index ai_insights_team_id_idx on public.ai_insights (team_id);
create index ai_insights_requested_by_idx on public.ai_insights (requested_by);
create index ai_insights_period_idx
  on public.ai_insights (period_start, period_end);

-- Reusable trigger for tables that expose an updated_at audit timestamp.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger teams_set_updated_at
before update on public.teams
for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger territories_set_updated_at
before update on public.territories
for each row execute function public.set_updated_at();

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create trigger visit_plans_set_updated_at
before update on public.visit_plans
for each row execute function public.set_updated_at();

create trigger visits_set_updated_at
before update on public.visits
for each row execute function public.set_updated_at();

create trigger follow_ups_set_updated_at
before update on public.follow_ups
for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create trigger monthly_targets_set_updated_at
before update on public.monthly_targets
for each row execute function public.set_updated_at();

-- Safe auth trigger: signup metadata may supply only a display name. Role is
-- always sales_executive and team assignment always remains privileged.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, display_name, team_id)
  values (
    new.id,
    'sales_executive'::public.app_role,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      'New user'
    ),
    null
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS helpers use security definer to read profiles without recursively
-- invoking profiles policies. Their empty search_path prevents object shadowing.
create function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select profile.role
  from public.profiles as profile
  where profile.id = (select auth.uid())
  limit 1;
$$;

comment on function public.current_user_role() is
  'Returns the authenticated user application role without recursive profile RLS evaluation.';

create function public.current_user_team_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select profile.team_id
  from public.profiles as profile
  where profile.id = (select auth.uid())
  limit 1;
$$;

comment on function public.current_user_team_id() is
  'Returns the authenticated user team id without recursive profile RLS evaluation.';

create function public.current_user_is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select profile.role = 'manager'::public.app_role
      from public.profiles as profile
      where profile.id = (select auth.uid())
      limit 1
    ),
    false
  );
$$;

comment on function public.current_user_is_manager() is
  'Returns whether the authenticated user has the manager role.';

create function public.current_user_is_manager_for_team(target_team_id uuid)
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
      and profile.team_id = target_team_id
  );
$$;

comment on function public.current_user_is_manager_for_team(uuid) is
  'Returns whether the authenticated user manages the specified team.';

-- Composite foreign keys enforce team membership. This internal trigger adds
-- the role rule that a foreign key cannot express: assignments must point to a
-- sales executive, never to a manager. FOR SHARE serializes this check with a
-- concurrent profile role change.
create function public.validate_sales_executive_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_profile_id uuid;
  target_profile_role public.app_role;
begin
  case tg_table_name
    when 'customers' then
      target_profile_id := new.assigned_sales_executive_id;
    when 'visit_plans' then
      target_profile_id := new.assigned_sales_executive_id;
    when 'visits' then
      target_profile_id := new.assigned_sales_executive_id;
    when 'follow_ups' then
      target_profile_id := new.assigned_sales_executive_id;
    when 'tasks' then
      target_profile_id := new.assigned_sales_executive_id;
    when 'monthly_targets' then
      target_profile_id := new.sales_executive_id;
    else
      raise exception using
        errcode = '55000',
        message = 'Sales executive assignment validation used on an unsupported table.';
  end case;

  select profile.role
  into target_profile_role
  from public.profiles as profile
  where profile.id = target_profile_id
    and profile.team_id = new.team_id
  for share;

  if not found then
    raise exception using
      errcode = '23503',
      message = 'Assigned sales executive must belong to the record team.';
  end if;

  if target_profile_role <> 'sales_executive'::public.app_role then
    raise exception using
      errcode = '23514',
      message = 'Assigned profile must have the sales_executive role.';
  end if;

  return new;
end;
$$;

-- Prevent a privileged profile update from turning an actively assigned sales
-- executive into a manager while child records still reference that profile.
create function public.prevent_assigned_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role <> 'sales_executive'::public.app_role
    and (
      exists (
        select 1
        from public.customers
        where assigned_sales_executive_id = new.id
      )
      or exists (
        select 1
        from public.visit_plans
        where assigned_sales_executive_id = new.id
      )
      or exists (
        select 1
        from public.visits
        where assigned_sales_executive_id = new.id
      )
      or exists (
        select 1
        from public.follow_ups
        where assigned_sales_executive_id = new.id
      )
      or exists (
        select 1
        from public.tasks
        where assigned_sales_executive_id = new.id
      )
      or exists (
        select 1
        from public.monthly_targets
        where sales_executive_id = new.id
      )
    )
  then
    raise exception using
      errcode = '23514',
      message = 'An assigned sales executive cannot change to a non-sales role.';
  end if;

  return new;
end;
$$;

-- Audit values are derived from auth.uid() for authenticated writes and are
-- immutable afterward. Tenant ids are immutable for all updates. Managers may
-- change same-team relationships; non-manager browser users may change only
-- workflow fields, never ownership or relationship ids.
create function public.protect_operational_record_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_role public.app_role;
begin
  if tg_op = 'INSERT' then
    if actor_id is not null then
      case tg_table_name
        when 'customers' then
          new.created_by := actor_id;
        when 'visit_plans' then
          new.created_by := actor_id;
        when 'visits' then
          new.completed_by := actor_id;
        when 'follow_ups' then
          new.created_by := actor_id;
        when 'tasks' then
          new.created_by := actor_id;
        when 'ai_insights' then
          new.requested_by := actor_id;
        else
          null;
      end case;
    end if;

    return new;
  end if;

  if new.team_id is distinct from old.team_id then
    raise exception using
      errcode = '23514',
      message = 'team_id cannot be changed after insert.';
  end if;

  case tg_table_name
    when 'customers' then
      if new.created_by is distinct from old.created_by then
        raise exception using
          errcode = '23514',
          message = 'created_by cannot be changed after insert.';
      end if;
    when 'visit_plans' then
      if new.created_by is distinct from old.created_by then
        raise exception using
          errcode = '23514',
          message = 'created_by cannot be changed after insert.';
      end if;
    when 'visits' then
      if new.completed_by is distinct from old.completed_by then
        raise exception using
          errcode = '23514',
          message = 'completed_by cannot be changed after insert.';
      end if;
    when 'follow_ups' then
      if new.created_by is distinct from old.created_by then
        raise exception using
          errcode = '23514',
          message = 'created_by cannot be changed after insert.';
      end if;
    when 'tasks' then
      if new.created_by is distinct from old.created_by then
        raise exception using
          errcode = '23514',
          message = 'created_by cannot be changed after insert.';
      end if;
    when 'ai_insights' then
      if new.requested_by is distinct from old.requested_by then
        raise exception using
          errcode = '23514',
          message = 'requested_by cannot be changed after insert.';
      end if;
    else
      null;
  end case;

  if actor_id is not null then
    select profile.role
    into actor_role
    from public.profiles as profile
    where profile.id = actor_id
    limit 1;

    if actor_role is distinct from 'manager'::public.app_role then
      case tg_table_name
        when 'customers' then
          if new.territory_id is distinct from old.territory_id
            or new.assigned_sales_executive_id is distinct from old.assigned_sales_executive_id
          then
            raise exception using
              errcode = '42501',
              message = 'Only managers may change customer ownership fields.';
          end if;
        when 'visit_plans' then
          if new.customer_id is distinct from old.customer_id
            or new.assigned_sales_executive_id is distinct from old.assigned_sales_executive_id
          then
            raise exception using
              errcode = '42501',
              message = 'Only managers may change visit plan relationship fields.';
          end if;
        when 'visits' then
          if new.visit_plan_id is distinct from old.visit_plan_id
            or new.customer_id is distinct from old.customer_id
            or new.assigned_sales_executive_id is distinct from old.assigned_sales_executive_id
          then
            raise exception using
              errcode = '42501',
              message = 'Only managers may change visit relationship fields.';
          end if;
        when 'follow_ups' then
          if new.customer_id is distinct from old.customer_id
            or new.assigned_sales_executive_id is distinct from old.assigned_sales_executive_id
          then
            raise exception using
              errcode = '42501',
              message = 'Only managers may change follow-up relationship fields.';
          end if;
        when 'tasks' then
          if new.related_customer_id is distinct from old.related_customer_id
            or new.assigned_sales_executive_id is distinct from old.assigned_sales_executive_id
          then
            raise exception using
              errcode = '42501',
              message = 'Only managers may change task relationship fields.';
          end if;
        when 'monthly_targets' then
          if new.sales_executive_id is distinct from old.sales_executive_id
            or new.territory_id is distinct from old.territory_id
          then
            raise exception using
              errcode = '42501',
              message = 'Only managers may change monthly target relationship fields.';
          end if;
        else
          null;
      end case;
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_prevent_assigned_role_change
before update of role on public.profiles
for each row execute function public.prevent_assigned_profile_role_change();

create trigger customers_validate_sales_executive_assignment
before insert or update on public.customers
for each row execute function public.validate_sales_executive_assignment();

create trigger visit_plans_validate_sales_executive_assignment
before insert or update on public.visit_plans
for each row execute function public.validate_sales_executive_assignment();

create trigger visits_validate_sales_executive_assignment
before insert or update on public.visits
for each row execute function public.validate_sales_executive_assignment();

create trigger follow_ups_validate_sales_executive_assignment
before insert or update on public.follow_ups
for each row execute function public.validate_sales_executive_assignment();

create trigger tasks_validate_sales_executive_assignment
before insert or update on public.tasks
for each row execute function public.validate_sales_executive_assignment();

create trigger monthly_targets_validate_sales_executive_assignment
before insert or update on public.monthly_targets
for each row execute function public.validate_sales_executive_assignment();

create trigger customers_protect_operational_fields
before insert or update on public.customers
for each row execute function public.protect_operational_record_fields();

create trigger visit_plans_protect_operational_fields
before insert or update on public.visit_plans
for each row execute function public.protect_operational_record_fields();

create trigger visits_protect_operational_fields
before insert or update on public.visits
for each row execute function public.protect_operational_record_fields();

create trigger follow_ups_protect_operational_fields
before insert or update on public.follow_ups
for each row execute function public.protect_operational_record_fields();

create trigger tasks_protect_operational_fields
before insert or update on public.tasks
for each row execute function public.protect_operational_record_fields();

create trigger monthly_targets_protect_operational_fields
before insert or update on public.monthly_targets
for each row execute function public.protect_operational_record_fields();

create trigger ai_insights_protect_operational_fields
before insert or update on public.ai_insights
for each row execute function public.protect_operational_record_fields();

-- Remove default function execution, then expose only read-only RLS helpers to
-- authenticated users. Trigger functions remain internal to database triggers.
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.validate_sales_executive_assignment() from public, anon, authenticated;
revoke all on function public.prevent_assigned_profile_role_change() from public, anon, authenticated;
revoke all on function public.protect_operational_record_fields() from public, anon, authenticated;
revoke all on function public.current_user_role() from public, anon;
revoke all on function public.current_user_team_id() from public, anon;
revoke all on function public.current_user_is_manager() from public, anon;
revoke all on function public.current_user_is_manager_for_team(uuid) from public, anon;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_user_team_id() to authenticated;
grant execute on function public.current_user_is_manager() to authenticated;
grant execute on function public.current_user_is_manager_for_team(uuid) to authenticated;

-- RLS is explicit on every application table.
alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.territories enable row level security;
alter table public.customers enable row level security;
alter table public.visit_plans enable row level security;
alter table public.visits enable row level security;
alter table public.follow_ups enable row level security;
alter table public.tasks enable row level security;
alter table public.monthly_targets enable row level security;
alter table public.ai_insights enable row level security;

-- No application table is accessible to anonymous clients. Authenticated
-- grants expose operations only where an RLS policy below can authorize rows.
revoke all on table public.teams from public, anon, authenticated;
revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.territories from public, anon, authenticated;
revoke all on table public.customers from public, anon, authenticated;
revoke all on table public.visit_plans from public, anon, authenticated;
revoke all on table public.visits from public, anon, authenticated;
revoke all on table public.follow_ups from public, anon, authenticated;
revoke all on table public.tasks from public, anon, authenticated;
revoke all on table public.monthly_targets from public, anon, authenticated;
revoke all on table public.ai_insights from public, anon, authenticated;

grant select on table public.teams to authenticated;
grant select on table public.profiles to authenticated;
grant select on table public.territories to authenticated;
grant select, insert, update, delete on table public.customers to authenticated;
grant select, insert, update, delete on table public.visit_plans to authenticated;
grant select, insert, update, delete on table public.visits to authenticated;
grant select, insert, update, delete on table public.follow_ups to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, update, delete on table public.monthly_targets to authenticated;
grant select, insert on table public.ai_insights to authenticated;

-- Profiles policy group: users see themselves; managers also see teammates.
-- No profile mutation grant exists for browser clients, protecting role/team.
create policy profiles_select_self_or_managed_team
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or public.current_user_is_manager_for_team(team_id)
);

-- Teams policy group: authenticated users can read only their own team.
create policy teams_select_own_team
on public.teams
for select
to authenticated
using (id = public.current_user_team_id());

-- Territories policy group: users can read territories belonging to their team.
create policy territories_select_own_team
on public.territories
for select
to authenticated
using (team_id = public.current_user_team_id());

-- Customers policy group: managers manage their team; sales executives only
-- read customers assigned to their own profile.
create policy customers_managers_manage_team
on public.customers
for all
to authenticated
using (public.current_user_is_manager_for_team(team_id))
with check (public.current_user_is_manager_for_team(team_id));

create policy customers_sales_executives_read_assigned
on public.customers
for select
to authenticated
using (
  assigned_sales_executive_id = (select auth.uid())
  and team_id = public.current_user_team_id()
);

-- Visit plans policy group: managers manage team plans; sales executives manage
-- only plans assigned to them and create plans as themselves.
create policy visit_plans_managers_manage_team
on public.visit_plans
for all
to authenticated
using (public.current_user_is_manager_for_team(team_id))
with check (public.current_user_is_manager_for_team(team_id));

create policy visit_plans_sales_executives_read_assigned
on public.visit_plans
for select
to authenticated
using (
  assigned_sales_executive_id = (select auth.uid())
  and team_id = public.current_user_team_id()
);

create policy visit_plans_sales_executives_create_assigned
on public.visit_plans
for insert
to authenticated
with check (
  assigned_sales_executive_id = (select auth.uid())
  and created_by = (select auth.uid())
  and team_id = public.current_user_team_id()
);

create policy visit_plans_sales_executives_update_assigned
on public.visit_plans
for update
to authenticated
using (
  assigned_sales_executive_id = (select auth.uid())
  and team_id = public.current_user_team_id()
)
with check (
  assigned_sales_executive_id = (select auth.uid())
  and team_id = public.current_user_team_id()
);

create policy visit_plans_sales_executives_delete_assigned
on public.visit_plans
for delete
to authenticated
using (
  assigned_sales_executive_id = (select auth.uid())
  and team_id = public.current_user_team_id()
);

-- Visits policy group: managers manage team visits; sales executives manage
-- only visits assigned to them.
create policy visits_managers_manage_team
on public.visits
for all
to authenticated
using (public.current_user_is_manager_for_team(team_id))
with check (public.current_user_is_manager_for_team(team_id));

create policy visits_sales_executives_read_assigned
on public.visits
for select
to authenticated
using (
  assigned_sales_executive_id = (select auth.uid())
  and team_id = public.current_user_team_id()
);

create policy visits_sales_executives_create_assigned
on public.visits
for insert
to authenticated
with check (
  assigned_sales_executive_id = (select auth.uid())
  and completed_by = (select auth.uid())
  and team_id = public.current_user_team_id()
);

create policy visits_sales_executives_update_assigned
on public.visits
for update
to authenticated
using (
  assigned_sales_executive_id = (select auth.uid())
  and team_id = public.current_user_team_id()
)
with check (
  assigned_sales_executive_id = (select auth.uid())
  and completed_by = (select auth.uid())
  and team_id = public.current_user_team_id()
);

create policy visits_sales_executives_delete_assigned
on public.visits
for delete
to authenticated
using (
  assigned_sales_executive_id = (select auth.uid())
  and team_id = public.current_user_team_id()
);

-- Follow-ups policy group: managers manage team follow-ups; sales executives
-- manage only their assigned follow-ups.
create policy follow_ups_managers_manage_team
on public.follow_ups
for all
to authenticated
using (public.current_user_is_manager_for_team(team_id))
with check (public.current_user_is_manager_for_team(team_id));

create policy follow_ups_sales_executives_read_assigned
on public.follow_ups
for select
to authenticated
using (
  assigned_sales_executive_id = (select auth.uid())
  and team_id = public.current_user_team_id()
);

create policy follow_ups_sales_executives_create_assigned
on public.follow_ups
for insert
to authenticated
with check (
  assigned_sales_executive_id = (select auth.uid())
  and created_by = (select auth.uid())
  and team_id = public.current_user_team_id()
);

create policy follow_ups_sales_executives_update_assigned
on public.follow_ups
for update
to authenticated
using (
  assigned_sales_executive_id = (select auth.uid())
  and team_id = public.current_user_team_id()
)
with check (
  assigned_sales_executive_id = (select auth.uid())
  and team_id = public.current_user_team_id()
);

create policy follow_ups_sales_executives_delete_assigned
on public.follow_ups
for delete
to authenticated
using (
  assigned_sales_executive_id = (select auth.uid())
  and team_id = public.current_user_team_id()
);

-- Tasks policy group: managers manage team tasks; sales executives manage only
-- tasks assigned to them.
create policy tasks_managers_manage_team
on public.tasks
for all
to authenticated
using (public.current_user_is_manager_for_team(team_id))
with check (public.current_user_is_manager_for_team(team_id));

create policy tasks_sales_executives_read_assigned
on public.tasks
for select
to authenticated
using (
  assigned_sales_executive_id = (select auth.uid())
  and team_id = public.current_user_team_id()
);

create policy tasks_sales_executives_create_assigned
on public.tasks
for insert
to authenticated
with check (
  assigned_sales_executive_id = (select auth.uid())
  and created_by = (select auth.uid())
  and team_id = public.current_user_team_id()
);

create policy tasks_sales_executives_update_assigned
on public.tasks
for update
to authenticated
using (
  assigned_sales_executive_id = (select auth.uid())
  and team_id = public.current_user_team_id()
)
with check (
  assigned_sales_executive_id = (select auth.uid())
  and team_id = public.current_user_team_id()
);

create policy tasks_sales_executives_delete_assigned
on public.tasks
for delete
to authenticated
using (
  assigned_sales_executive_id = (select auth.uid())
  and team_id = public.current_user_team_id()
);

-- Monthly targets policy group: managers manage team targets; sales executives
-- can read only their own targets.
create policy monthly_targets_managers_manage_team
on public.monthly_targets
for all
to authenticated
using (public.current_user_is_manager_for_team(team_id))
with check (public.current_user_is_manager_for_team(team_id));

create policy monthly_targets_sales_executives_read_own
on public.monthly_targets
for select
to authenticated
using (
  sales_executive_id = (select auth.uid())
  and team_id = public.current_user_team_id()
);

-- AI insights policy group: only managers can create or read insights for the
-- team they manage. Sales executives receive no grant-backed policy.
create policy ai_insights_managers_read_team
on public.ai_insights
for select
to authenticated
using (public.current_user_is_manager_for_team(team_id));

create policy ai_insights_managers_create_team
on public.ai_insights
for insert
to authenticated
with check (
  public.current_user_is_manager_for_team(team_id)
  and requested_by = (select auth.uid())
);
