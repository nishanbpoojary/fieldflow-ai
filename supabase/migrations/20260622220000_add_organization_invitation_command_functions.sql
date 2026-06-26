-- FieldFlow AI invitation lifecycle command functions.
-- These service-role-only commands centralize invitation state changes and
-- audit-event writes. They do not call Supabase Auth Admin, send email, expose
-- invite links, activate accounts, or add browser-executable write paths.

create function public.reserve_organization_invitation(
  p_actor_profile_id uuid,
  p_invited_email text,
  p_target_role public.app_role,
  p_target_team_id uuid,
  p_job_title text default null,
  p_expires_at timestamptz default null
)
returns table (
  invitation_id uuid,
  invitation_status public.organization_invitation_status,
  outcome text,
  newly_created boolean,
  resend_count integer,
  last_sent_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_organization_id uuid;
  command_now timestamptz := now();
  normalized_email text;
  normalized_job_title text;
  existing_invitation public.organization_invitations%rowtype;
  created_invitation public.organization_invitations%rowtype;
begin
  select profile.organization_id
  into actor_organization_id
  from public.profiles as profile
  where profile.id = p_actor_profile_id
    and profile.status = 'active'::public.profile_status
    and profile.is_organization_admin = true
    and profile.organization_id is not null;

  if actor_organization_id is null then
    raise exception using
      errcode = '42501',
      message = 'invitation_actor_unavailable';
  end if;

  normalized_email := lower(btrim(coalesce(p_invited_email, '')));
  normalized_job_title :=
    nullif(regexp_replace(btrim(coalesce(p_job_title, '')), '[[:space:]]+', ' ', 'g'), '');

  if normalized_email = ''
    or char_length(normalized_email) > 254
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  then
    raise exception using
      errcode = '22023',
      message = 'invitation_invalid_input';
  end if;

  if p_target_role is null
    or p_target_role not in (
      'manager'::public.app_role,
      'sales_executive'::public.app_role
    )
  then
    raise exception using
      errcode = '22023',
      message = 'invitation_invalid_input';
  end if;

  if normalized_job_title is not null
    and (
      char_length(normalized_job_title) < 2
      or char_length(normalized_job_title) > 80
    )
  then
    raise exception using
      errcode = '22023',
      message = 'invitation_invalid_input';
  end if;

  if p_expires_at is null or p_expires_at <= command_now then
    raise exception using
      errcode = '22023',
      message = 'invitation_invalid_input';
  end if;

  if not exists (
    select 1
    from public.teams as team
    where team.id = p_target_team_id
      and team.organization_id = actor_organization_id
  ) then
    raise exception using
      errcode = '42501',
      message = 'invitation_target_unavailable';
  end if;

  if p_target_role = 'manager'::public.app_role
    and exists (
      select 1
      from public.profiles as profile
      where profile.organization_id = actor_organization_id
        and profile.team_id = p_target_team_id
        and profile.role = 'manager'::public.app_role
        and profile.status = 'active'::public.profile_status
    )
  then
    raise exception using
      errcode = '23505',
      message = 'invitation_manager_already_assigned';
  end if;

  -- Serialize reservations for the same normalized email before checking the
  -- global live-invitation unique index. This gives retries and concurrent
  -- requests a stable result without duplicate rows or duplicate created events.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(normalized_email, 0)
  );

  select invitation.*
  into existing_invitation
  from public.organization_invitations as invitation
  where invitation.normalized_invited_email = normalized_email
    and invitation.status in (
      'pending'::public.organization_invitation_status,
      'sent'::public.organization_invitation_status,
      'send_failed'::public.organization_invitation_status
    )
  order by invitation.created_at
  limit 1
  for update;

  if found then
    if existing_invitation.expires_at <= command_now then
      -- Expire stale live rows before reserving. Cross-organization expiry is
      -- recorded as a system lifecycle event so the requesting admin is not
      -- falsely attributed to another organization's invitation.
      update public.organization_invitations as invitation
      set status = 'expired'::public.organization_invitation_status
      where invitation.id = existing_invitation.id;

      insert into public.organization_invitation_events (
        invitation_id,
        organization_id,
        event_type,
        actor_profile_id,
        occurred_at
      )
      values (
        existing_invitation.id,
        existing_invitation.organization_id,
        'expired'::public.organization_invitation_event_type,
        case
          when existing_invitation.organization_id = actor_organization_id
            then p_actor_profile_id
          else null
        end,
        command_now
      );
    elsif existing_invitation.organization_id = actor_organization_id
      and existing_invitation.target_role = p_target_role
      and existing_invitation.target_team_id = p_target_team_id
    then
      return query
      select
        existing_invitation.id,
        existing_invitation.status,
        'already_reserved'::text,
        false,
        existing_invitation.resend_count,
        existing_invitation.last_sent_at,
        existing_invitation.expires_at;
      return;
    else
      raise exception using
        errcode = '23505',
        message = 'invitation_conflict';
    end if;
  end if;

  insert into public.organization_invitations (
    organization_id,
    normalized_invited_email,
    target_role,
    target_team_id,
    job_title,
    status,
    invited_by_profile_id,
    expires_at
  )
  values (
    actor_organization_id,
    normalized_email,
    p_target_role,
    p_target_team_id,
    normalized_job_title,
    'pending'::public.organization_invitation_status,
    p_actor_profile_id,
    p_expires_at
  )
  returning *
  into created_invitation;

  insert into public.organization_invitation_events (
    invitation_id,
    organization_id,
    event_type,
    actor_profile_id,
    occurred_at
  )
  values (
    created_invitation.id,
    actor_organization_id,
    'created'::public.organization_invitation_event_type,
    p_actor_profile_id,
    command_now
  );

  return query
  select
    created_invitation.id,
    created_invitation.status,
    'created'::text,
    true,
    created_invitation.resend_count,
    created_invitation.last_sent_at,
    created_invitation.expires_at;
end;
$$;

create function public.mark_organization_invitation_sent(
  p_actor_profile_id uuid,
  p_invitation_id uuid
)
returns table (
  invitation_id uuid,
  invitation_status public.organization_invitation_status,
  outcome text,
  newly_created boolean,
  resend_count integer,
  last_sent_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_organization_id uuid;
  command_now timestamptz := now();
  existing_invitation public.organization_invitations%rowtype;
  updated_invitation public.organization_invitations%rowtype;
begin
  select profile.organization_id
  into actor_organization_id
  from public.profiles as profile
  where profile.id = p_actor_profile_id
    and profile.status = 'active'::public.profile_status
    and profile.is_organization_admin = true
    and profile.organization_id is not null;

  if actor_organization_id is null then
    raise exception using
      errcode = '42501',
      message = 'invitation_actor_unavailable';
  end if;

  select invitation.*
  into existing_invitation
  from public.organization_invitations as invitation
  where invitation.id = p_invitation_id
    and invitation.organization_id = actor_organization_id
  for update;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'invitation_unavailable';
  end if;

  if existing_invitation.status in (
      'pending'::public.organization_invitation_status,
      'sent'::public.organization_invitation_status,
      'send_failed'::public.organization_invitation_status
    )
    and existing_invitation.expires_at <= command_now
  then
    update public.organization_invitations as invitation
    set status = 'expired'::public.organization_invitation_status
    where invitation.id = existing_invitation.id
    returning *
    into updated_invitation;

    insert into public.organization_invitation_events (
      invitation_id,
      organization_id,
      event_type,
      actor_profile_id,
      occurred_at
    )
    values (
      updated_invitation.id,
      actor_organization_id,
      'expired'::public.organization_invitation_event_type,
      p_actor_profile_id,
      command_now
    );

    return query
    select
      updated_invitation.id,
      updated_invitation.status,
      'expired'::text,
      false,
      updated_invitation.resend_count,
      updated_invitation.last_sent_at,
      updated_invitation.expires_at;
    return;
  end if;

  if existing_invitation.status = 'sent'::public.organization_invitation_status then
    return query
    select
      existing_invitation.id,
      existing_invitation.status,
      'already_sent'::text,
      false,
      existing_invitation.resend_count,
      existing_invitation.last_sent_at,
      existing_invitation.expires_at;
    return;
  end if;

  if existing_invitation.status not in (
    'pending'::public.organization_invitation_status,
    'send_failed'::public.organization_invitation_status
  ) then
    raise exception using
      errcode = '22023',
      message = 'invitation_state_unavailable';
  end if;

  update public.organization_invitations as invitation
  set
    status = 'sent'::public.organization_invitation_status,
    sent_at = command_now,
    last_sent_at = command_now
  where invitation.id = existing_invitation.id
  returning *
  into updated_invitation;

  insert into public.organization_invitation_events (
    invitation_id,
    organization_id,
    event_type,
    actor_profile_id,
    occurred_at
  )
  values (
    updated_invitation.id,
    actor_organization_id,
    'sent'::public.organization_invitation_event_type,
    p_actor_profile_id,
    command_now
  );

  return query
  select
    updated_invitation.id,
    updated_invitation.status,
    'sent'::text,
    false,
    updated_invitation.resend_count,
    updated_invitation.last_sent_at,
    updated_invitation.expires_at;
end;
$$;

create function public.mark_organization_invitation_send_failed(
  p_actor_profile_id uuid,
  p_invitation_id uuid
)
returns table (
  invitation_id uuid,
  invitation_status public.organization_invitation_status,
  outcome text,
  newly_created boolean,
  resend_count integer,
  last_sent_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_organization_id uuid;
  command_now timestamptz := now();
  existing_invitation public.organization_invitations%rowtype;
  updated_invitation public.organization_invitations%rowtype;
begin
  select profile.organization_id
  into actor_organization_id
  from public.profiles as profile
  where profile.id = p_actor_profile_id
    and profile.status = 'active'::public.profile_status
    and profile.is_organization_admin = true
    and profile.organization_id is not null;

  if actor_organization_id is null then
    raise exception using
      errcode = '42501',
      message = 'invitation_actor_unavailable';
  end if;

  select invitation.*
  into existing_invitation
  from public.organization_invitations as invitation
  where invitation.id = p_invitation_id
    and invitation.organization_id = actor_organization_id
  for update;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'invitation_unavailable';
  end if;

  if existing_invitation.status in (
      'pending'::public.organization_invitation_status,
      'send_failed'::public.organization_invitation_status
    )
    and existing_invitation.expires_at <= command_now
  then
    update public.organization_invitations as invitation
    set status = 'expired'::public.organization_invitation_status
    where invitation.id = existing_invitation.id
    returning *
    into updated_invitation;

    insert into public.organization_invitation_events (
      invitation_id,
      organization_id,
      event_type,
      actor_profile_id,
      occurred_at
    )
    values (
      updated_invitation.id,
      actor_organization_id,
      'expired'::public.organization_invitation_event_type,
      p_actor_profile_id,
      command_now
    );

    return query
    select
      updated_invitation.id,
      updated_invitation.status,
      'expired'::text,
      false,
      updated_invitation.resend_count,
      updated_invitation.last_sent_at,
      updated_invitation.expires_at;
    return;
  end if;

  if existing_invitation.status = 'send_failed'::public.organization_invitation_status then
    return query
    select
      existing_invitation.id,
      existing_invitation.status,
      'already_send_failed'::text,
      false,
      existing_invitation.resend_count,
      existing_invitation.last_sent_at,
      existing_invitation.expires_at;
    return;
  end if;

  if existing_invitation.status <> 'pending'::public.organization_invitation_status then
    raise exception using
      errcode = '22023',
      message = 'invitation_state_unavailable';
  end if;

  update public.organization_invitations as invitation
  set status = 'send_failed'::public.organization_invitation_status
  where invitation.id = existing_invitation.id
  returning *
  into updated_invitation;

  insert into public.organization_invitation_events (
    invitation_id,
    organization_id,
    event_type,
    actor_profile_id,
    occurred_at
  )
  values (
    updated_invitation.id,
    actor_organization_id,
    'send_failed'::public.organization_invitation_event_type,
    p_actor_profile_id,
    command_now
  );

  return query
  select
    updated_invitation.id,
    updated_invitation.status,
    'send_failed'::text,
    false,
    updated_invitation.resend_count,
    updated_invitation.last_sent_at,
    updated_invitation.expires_at;
end;
$$;

create function public.record_organization_invitation_resend_success(
  p_actor_profile_id uuid,
  p_invitation_id uuid,
  p_expected_prior_last_sent_at timestamptz
)
returns table (
  invitation_id uuid,
  invitation_status public.organization_invitation_status,
  outcome text,
  newly_created boolean,
  resend_count integer,
  last_sent_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_organization_id uuid;
  command_now timestamptz := now();
  existing_invitation public.organization_invitations%rowtype;
  updated_invitation public.organization_invitations%rowtype;
begin
  select profile.organization_id
  into actor_organization_id
  from public.profiles as profile
  where profile.id = p_actor_profile_id
    and profile.status = 'active'::public.profile_status
    and profile.is_organization_admin = true
    and profile.organization_id is not null;

  if actor_organization_id is null then
    raise exception using
      errcode = '42501',
      message = 'invitation_actor_unavailable';
  end if;

  select invitation.*
  into existing_invitation
  from public.organization_invitations as invitation
  where invitation.id = p_invitation_id
    and invitation.organization_id = actor_organization_id
  for update;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'invitation_unavailable';
  end if;

  if existing_invitation.status = 'sent'::public.organization_invitation_status
    and existing_invitation.expires_at <= command_now
  then
    update public.organization_invitations as invitation
    set status = 'expired'::public.organization_invitation_status
    where invitation.id = existing_invitation.id
    returning *
    into updated_invitation;

    insert into public.organization_invitation_events (
      invitation_id,
      organization_id,
      event_type,
      actor_profile_id,
      occurred_at
    )
    values (
      updated_invitation.id,
      actor_organization_id,
      'expired'::public.organization_invitation_event_type,
      p_actor_profile_id,
      command_now
    );

    return query
    select
      updated_invitation.id,
      updated_invitation.status,
      'expired'::text,
      false,
      updated_invitation.resend_count,
      updated_invitation.last_sent_at,
      updated_invitation.expires_at;
    return;
  end if;

  if existing_invitation.status <> 'sent'::public.organization_invitation_status then
    raise exception using
      errcode = '22023',
      message = 'invitation_state_unavailable';
  end if;

  if p_expected_prior_last_sent_at is null
    or existing_invitation.last_sent_at is distinct from p_expected_prior_last_sent_at
  then
    return query
    select
      existing_invitation.id,
      existing_invitation.status,
      'concurrency_mismatch'::text,
      false,
      existing_invitation.resend_count,
      existing_invitation.last_sent_at,
      existing_invitation.expires_at;
    return;
  end if;

  update public.organization_invitations as invitation
  set
    last_sent_at = command_now,
    resend_count = invitation.resend_count + 1
  where invitation.id = existing_invitation.id
  returning *
  into updated_invitation;

  insert into public.organization_invitation_events (
    invitation_id,
    organization_id,
    event_type,
    actor_profile_id,
    occurred_at
  )
  values (
    updated_invitation.id,
    actor_organization_id,
    'resent'::public.organization_invitation_event_type,
    p_actor_profile_id,
    command_now
  );

  return query
  select
    updated_invitation.id,
    updated_invitation.status,
    'resent'::text,
    false,
    updated_invitation.resend_count,
    updated_invitation.last_sent_at,
    updated_invitation.expires_at;
end;
$$;

create function public.record_organization_invitation_resend_failure(
  p_actor_profile_id uuid,
  p_invitation_id uuid
)
returns table (
  invitation_id uuid,
  invitation_status public.organization_invitation_status,
  outcome text,
  newly_created boolean,
  resend_count integer,
  last_sent_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_organization_id uuid;
  command_now timestamptz := now();
  existing_invitation public.organization_invitations%rowtype;
  updated_invitation public.organization_invitations%rowtype;
  failure_event_exists boolean;
begin
  select profile.organization_id
  into actor_organization_id
  from public.profiles as profile
  where profile.id = p_actor_profile_id
    and profile.status = 'active'::public.profile_status
    and profile.is_organization_admin = true
    and profile.organization_id is not null;

  if actor_organization_id is null then
    raise exception using
      errcode = '42501',
      message = 'invitation_actor_unavailable';
  end if;

  select invitation.*
  into existing_invitation
  from public.organization_invitations as invitation
  where invitation.id = p_invitation_id
    and invitation.organization_id = actor_organization_id
  for update;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'invitation_unavailable';
  end if;

  if existing_invitation.status = 'sent'::public.organization_invitation_status
    and existing_invitation.expires_at <= command_now
  then
    update public.organization_invitations as invitation
    set status = 'expired'::public.organization_invitation_status
    where invitation.id = existing_invitation.id
    returning *
    into updated_invitation;

    insert into public.organization_invitation_events (
      invitation_id,
      organization_id,
      event_type,
      actor_profile_id,
      occurred_at
    )
    values (
      updated_invitation.id,
      actor_organization_id,
      'expired'::public.organization_invitation_event_type,
      p_actor_profile_id,
      command_now
    );

    return query
    select
      updated_invitation.id,
      updated_invitation.status,
      'expired'::text,
      false,
      updated_invitation.resend_count,
      updated_invitation.last_sent_at,
      updated_invitation.expires_at;
    return;
  end if;

  if existing_invitation.status <> 'sent'::public.organization_invitation_status then
    raise exception using
      errcode = '22023',
      message = 'invitation_state_unavailable';
  end if;

  select exists (
    select 1
    from public.organization_invitation_events as event
    where event.invitation_id = existing_invitation.id
      and event.organization_id = actor_organization_id
      and event.event_type = 'send_failed'::public.organization_invitation_event_type
      and event.occurred_at >= existing_invitation.last_sent_at
  )
  into failure_event_exists;

  if not failure_event_exists then
    insert into public.organization_invitation_events (
      invitation_id,
      organization_id,
      event_type,
      actor_profile_id,
      occurred_at
    )
    values (
      existing_invitation.id,
      actor_organization_id,
      'send_failed'::public.organization_invitation_event_type,
      p_actor_profile_id,
      command_now
    );
  end if;

  return query
  select
    existing_invitation.id,
    existing_invitation.status,
    case
      when failure_event_exists then 'already_recorded'::text
      else 'failure_recorded'::text
    end,
    false,
    existing_invitation.resend_count,
    existing_invitation.last_sent_at,
    existing_invitation.expires_at;
end;
$$;

create function public.revoke_organization_invitation(
  p_actor_profile_id uuid,
  p_invitation_id uuid
)
returns table (
  invitation_id uuid,
  invitation_status public.organization_invitation_status,
  outcome text,
  newly_created boolean,
  resend_count integer,
  last_sent_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_organization_id uuid;
  command_now timestamptz := now();
  existing_invitation public.organization_invitations%rowtype;
  updated_invitation public.organization_invitations%rowtype;
begin
  select profile.organization_id
  into actor_organization_id
  from public.profiles as profile
  where profile.id = p_actor_profile_id
    and profile.status = 'active'::public.profile_status
    and profile.is_organization_admin = true
    and profile.organization_id is not null;

  if actor_organization_id is null then
    raise exception using
      errcode = '42501',
      message = 'invitation_actor_unavailable';
  end if;

  select invitation.*
  into existing_invitation
  from public.organization_invitations as invitation
  where invitation.id = p_invitation_id
    and invitation.organization_id = actor_organization_id
  for update;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'invitation_unavailable';
  end if;

  if existing_invitation.status = 'revoked'::public.organization_invitation_status then
    return query
    select
      existing_invitation.id,
      existing_invitation.status,
      'already_revoked'::text,
      false,
      existing_invitation.resend_count,
      existing_invitation.last_sent_at,
      existing_invitation.expires_at;
    return;
  end if;

  if existing_invitation.status = 'expired'::public.organization_invitation_status then
    return query
    select
      existing_invitation.id,
      existing_invitation.status,
      'already_expired'::text,
      false,
      existing_invitation.resend_count,
      existing_invitation.last_sent_at,
      existing_invitation.expires_at;
    return;
  end if;

  if existing_invitation.status in (
      'pending'::public.organization_invitation_status,
      'sent'::public.organization_invitation_status,
      'send_failed'::public.organization_invitation_status
    )
    and existing_invitation.expires_at <= command_now
  then
    update public.organization_invitations as invitation
    set status = 'expired'::public.organization_invitation_status
    where invitation.id = existing_invitation.id
    returning *
    into updated_invitation;

    insert into public.organization_invitation_events (
      invitation_id,
      organization_id,
      event_type,
      actor_profile_id,
      occurred_at
    )
    values (
      updated_invitation.id,
      actor_organization_id,
      'expired'::public.organization_invitation_event_type,
      p_actor_profile_id,
      command_now
    );

    return query
    select
      updated_invitation.id,
      updated_invitation.status,
      'expired'::text,
      false,
      updated_invitation.resend_count,
      updated_invitation.last_sent_at,
      updated_invitation.expires_at;
    return;
  end if;

  if existing_invitation.status not in (
    'pending'::public.organization_invitation_status,
    'sent'::public.organization_invitation_status,
    'send_failed'::public.organization_invitation_status
  ) then
    raise exception using
      errcode = '22023',
      message = 'invitation_state_unavailable';
  end if;

  update public.organization_invitations as invitation
  set
    status = 'revoked'::public.organization_invitation_status,
    revoked_at = command_now,
    revoked_by_profile_id = p_actor_profile_id
  where invitation.id = existing_invitation.id
  returning *
  into updated_invitation;

  insert into public.organization_invitation_events (
    invitation_id,
    organization_id,
    event_type,
    actor_profile_id,
    occurred_at
  )
  values (
    updated_invitation.id,
    actor_organization_id,
    'revoked'::public.organization_invitation_event_type,
    p_actor_profile_id,
    command_now
  );

  return query
  select
    updated_invitation.id,
    updated_invitation.status,
    'revoked'::text,
    false,
    updated_invitation.resend_count,
    updated_invitation.last_sent_at,
    updated_invitation.expires_at;
end;
$$;

create function public.expire_organization_invitation(
  p_actor_profile_id uuid,
  p_invitation_id uuid
)
returns table (
  invitation_id uuid,
  invitation_status public.organization_invitation_status,
  outcome text,
  newly_created boolean,
  resend_count integer,
  last_sent_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_organization_id uuid;
  command_now timestamptz := now();
  existing_invitation public.organization_invitations%rowtype;
  updated_invitation public.organization_invitations%rowtype;
begin
  select profile.organization_id
  into actor_organization_id
  from public.profiles as profile
  where profile.id = p_actor_profile_id
    and profile.status = 'active'::public.profile_status
    and profile.is_organization_admin = true
    and profile.organization_id is not null;

  if actor_organization_id is null then
    raise exception using
      errcode = '42501',
      message = 'invitation_actor_unavailable';
  end if;

  select invitation.*
  into existing_invitation
  from public.organization_invitations as invitation
  where invitation.id = p_invitation_id
    and invitation.organization_id = actor_organization_id
  for update;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'invitation_unavailable';
  end if;

  if existing_invitation.status in (
    'accepted'::public.organization_invitation_status,
    'revoked'::public.organization_invitation_status
  ) then
    return query
    select
      existing_invitation.id,
      existing_invitation.status,
      'not_expirable'::text,
      false,
      existing_invitation.resend_count,
      existing_invitation.last_sent_at,
      existing_invitation.expires_at;
    return;
  end if;

  if existing_invitation.status = 'expired'::public.organization_invitation_status then
    return query
    select
      existing_invitation.id,
      existing_invitation.status,
      'already_expired'::text,
      false,
      existing_invitation.resend_count,
      existing_invitation.last_sent_at,
      existing_invitation.expires_at;
    return;
  end if;

  if existing_invitation.expires_at > command_now then
    return query
    select
      existing_invitation.id,
      existing_invitation.status,
      'not_expired'::text,
      false,
      existing_invitation.resend_count,
      existing_invitation.last_sent_at,
      existing_invitation.expires_at;
    return;
  end if;

  update public.organization_invitations as invitation
  set status = 'expired'::public.organization_invitation_status
  where invitation.id = existing_invitation.id
  returning *
  into updated_invitation;

  insert into public.organization_invitation_events (
    invitation_id,
    organization_id,
    event_type,
    actor_profile_id,
    occurred_at
  )
  values (
    updated_invitation.id,
    actor_organization_id,
    'expired'::public.organization_invitation_event_type,
    p_actor_profile_id,
    command_now
  );

  return query
  select
    updated_invitation.id,
    updated_invitation.status,
    'expired'::text,
    false,
    updated_invitation.resend_count,
    updated_invitation.last_sent_at,
    updated_invitation.expires_at;
end;
$$;

comment on function public.reserve_organization_invitation(uuid, text, public.app_role, uuid, text, timestamptz) is
  'Service-role-only command for reserving a safe pending organization invitation without sending email or activating accounts.';
comment on function public.mark_organization_invitation_sent(uuid, uuid) is
  'Service-role-only command for recording the first successful invitation delivery.';
comment on function public.mark_organization_invitation_send_failed(uuid, uuid) is
  'Service-role-only command for recording an initial invitation delivery failure before any successful send.';
comment on function public.record_organization_invitation_resend_success(uuid, uuid, timestamptz) is
  'Service-role-only command for recording a successful resend using last_sent_at as a concurrency token.';
comment on function public.record_organization_invitation_resend_failure(uuid, uuid) is
  'Service-role-only command for recording one safe resend failure event per successful-send cycle.';
comment on function public.revoke_organization_invitation(uuid, uuid) is
  'Service-role-only command for revoking a live organization invitation.';
comment on function public.expire_organization_invitation(uuid, uuid) is
  'Service-role-only command for expiring a past-due live organization invitation.';

revoke all on function public.reserve_organization_invitation(uuid, text, public.app_role, uuid, text, timestamptz)
  from public, anon, authenticated;
revoke all on function public.mark_organization_invitation_sent(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.mark_organization_invitation_send_failed(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.record_organization_invitation_resend_success(uuid, uuid, timestamptz)
  from public, anon, authenticated;
revoke all on function public.record_organization_invitation_resend_failure(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.revoke_organization_invitation(uuid, uuid)
  from public, anon, authenticated;
revoke all on function public.expire_organization_invitation(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.reserve_organization_invitation(uuid, text, public.app_role, uuid, text, timestamptz)
  to service_role;
grant execute on function public.mark_organization_invitation_sent(uuid, uuid)
  to service_role;
grant execute on function public.mark_organization_invitation_send_failed(uuid, uuid)
  to service_role;
grant execute on function public.record_organization_invitation_resend_success(uuid, uuid, timestamptz)
  to service_role;
grant execute on function public.record_organization_invitation_resend_failure(uuid, uuid)
  to service_role;
grant execute on function public.revoke_organization_invitation(uuid, uuid)
  to service_role;
grant execute on function public.expire_organization_invitation(uuid, uuid)
  to service_role;
