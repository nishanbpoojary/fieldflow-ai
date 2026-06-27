-- FieldFlow AI invitation acceptance command.
-- This service-role-only command is the future trusted activation boundary for
-- recipient-side invite completion. It does not exchange Auth links, set
-- passwords, send email, create routes/UI, or expose browser-executable writes.

create function public.accept_organization_invitation(
  p_recipient_profile_id uuid,
  p_display_name text
)
returns table (
  profile_id uuid,
  app_role public.app_role,
  outcome text,
  activated boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  command_now timestamptz := now();
  normalized_display_name text;
  normalized_email text;
  recipient_profile public.profiles%rowtype;
  matching_invitation public.organization_invitations%rowtype;
  target_team public.teams%rowtype;
  manager_assignment_exists boolean;
begin
  normalized_display_name :=
    regexp_replace(btrim(coalesce(p_display_name, '')), '[[:space:]]+', ' ', 'g');

  if p_recipient_profile_id is null
    or normalized_display_name = ''
    or char_length(normalized_display_name) > 120
  then
    return query
    select
      null::uuid,
      null::public.app_role,
      'unavailable'::text,
      false;
    return;
  end if;

  -- Lock the profile first. The future route must derive this id from the
  -- authenticated invite recipient session; the browser must not choose role,
  -- team, organization, status, accepted profile id, or audit fields.
  select profile.*
  into recipient_profile
  from public.profiles as profile
  where profile.id = p_recipient_profile_id
  for update;

  if not found then
    return query
    select
      null::uuid,
      null::public.app_role,
      'unavailable'::text,
      false;
    return;
  end if;

  -- Resolve the recipient email internally from Auth. It is used only for
  -- matching the invitation and is never returned, logged, or stored by this
  -- command.
  select lower(btrim(auth_user.email))
  into normalized_email
  from auth.users as auth_user
  where auth_user.id = p_recipient_profile_id;

  if normalized_email is null
    or normalized_email = ''
    or char_length(normalized_email) > 254
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  then
    return query
    select
      null::uuid,
      null::public.app_role,
      'unavailable'::text,
      false;
    return;
  end if;

  -- Prefer a live invitation for the normalized email. If activation already
  -- completed, allow only the same accepted profile to receive an idempotent
  -- success result without writing another accepted event.
  select invitation.*
  into matching_invitation
  from public.organization_invitations as invitation
  where invitation.normalized_invited_email = normalized_email
    and (
      invitation.status in (
        'pending'::public.organization_invitation_status,
        'sent'::public.organization_invitation_status,
        'send_failed'::public.organization_invitation_status
      )
      or invitation.accepted_profile_id = p_recipient_profile_id
    )
  order by
    case
      when invitation.status = 'sent'::public.organization_invitation_status then 1
      when invitation.status = 'pending'::public.organization_invitation_status then 2
      when invitation.status = 'send_failed'::public.organization_invitation_status then 3
      when invitation.status = 'accepted'::public.organization_invitation_status then 4
      else 5
    end,
    invitation.created_at desc
  limit 1
  for update;

  if not found then
    return query
    select
      null::uuid,
      null::public.app_role,
      'unavailable'::text,
      false;
    return;
  end if;

  if matching_invitation.status = 'accepted'::public.organization_invitation_status then
    if matching_invitation.accepted_profile_id = p_recipient_profile_id
      and recipient_profile.status = 'active'::public.profile_status
      and recipient_profile.organization_id = matching_invitation.organization_id
      and recipient_profile.team_id = matching_invitation.target_team_id
      and recipient_profile.role = matching_invitation.target_role
    then
      return query
      select
        recipient_profile.id,
        recipient_profile.role,
        'already_active'::text,
        true;
      return;
    end if;

    return query
    select
      null::uuid,
      null::public.app_role,
      'unavailable'::text,
      false;
    return;
  end if;

  -- Active/disabled/already-assigned profiles are not claimable here. The
  -- activation command only moves a safe invited, unassigned profile into the
  -- organization/team/role defined by the locked invitation.
  if recipient_profile.status <> 'invited'::public.profile_status
    or recipient_profile.organization_id is not null
    or recipient_profile.team_id is not null
    or recipient_profile.is_organization_admin is not false
  then
    return query
    select
      null::uuid,
      null::public.app_role,
      'unavailable'::text,
      false;
    return;
  end if;

  if matching_invitation.expires_at <= command_now then
    update public.organization_invitations as invitation
    set status = 'expired'::public.organization_invitation_status
    where invitation.id = matching_invitation.id;

    insert into public.organization_invitation_events (
      invitation_id,
      organization_id,
      event_type,
      actor_profile_id,
      occurred_at
    )
    values (
      matching_invitation.id,
      matching_invitation.organization_id,
      'expired'::public.organization_invitation_event_type,
      null,
      command_now
    );

    return query
    select
      null::uuid,
      null::public.app_role,
      'unavailable'::text,
      false;
    return;
  end if;

  if matching_invitation.status not in (
    'pending'::public.organization_invitation_status,
    'sent'::public.organization_invitation_status
  ) then
    return query
    select
      null::uuid,
      null::public.app_role,
      'unavailable'::text,
      false;
    return;
  end if;

  -- Delivery-state-unknown recovery: if Auth delivered a valid invite link but
  -- the sender route failed before mark_organization_invitation_sent, repair
  -- the successful-send timestamps and write a system sent event before the
  -- accepted transition. send_failed invitations are never repaired here.
  if matching_invitation.status = 'pending'::public.organization_invitation_status then
    update public.organization_invitations as invitation
    set
      status = 'sent'::public.organization_invitation_status,
      sent_at = command_now,
      last_sent_at = command_now
    where invitation.id = matching_invitation.id
    returning *
    into matching_invitation;

    insert into public.organization_invitation_events (
      invitation_id,
      organization_id,
      event_type,
      actor_profile_id,
      occurred_at
    )
    values (
      matching_invitation.id,
      matching_invitation.organization_id,
      'sent'::public.organization_invitation_event_type,
      null,
      command_now
    );
  end if;

  select team.*
  into target_team
  from public.teams as team
  where team.id = matching_invitation.target_team_id
    and team.organization_id = matching_invitation.organization_id
  for update;

  if not found then
    return query
    select
      null::uuid,
      null::public.app_role,
      'unavailable'::text,
      false;
    return;
  end if;

  if matching_invitation.target_role = 'manager'::public.app_role then
    select exists (
      select 1
      from public.profiles as profile
      where profile.team_id = target_team.id
        and profile.role = 'manager'::public.app_role
        and profile.id <> p_recipient_profile_id
    )
    into manager_assignment_exists;

    if manager_assignment_exists then
      return query
      select
        null::uuid,
        null::public.app_role,
        'manager_unavailable'::text,
        false;
      return;
    end if;
  end if;

  update public.profiles as profile
  set
    organization_id = matching_invitation.organization_id,
    team_id = matching_invitation.target_team_id,
    role = matching_invitation.target_role,
    job_title = matching_invitation.job_title,
    status = 'active'::public.profile_status,
    display_name = normalized_display_name,
    updated_at = command_now
  where profile.id = recipient_profile.id
  returning *
  into recipient_profile;

  update public.organization_invitations as invitation
  set
    status = 'accepted'::public.organization_invitation_status,
    accepted_at = command_now,
    accepted_profile_id = recipient_profile.id
  where invitation.id = matching_invitation.id
  returning *
  into matching_invitation;

  insert into public.organization_invitation_events (
    invitation_id,
    organization_id,
    event_type,
    actor_profile_id,
    occurred_at
  )
  values (
    matching_invitation.id,
    matching_invitation.organization_id,
    'accepted'::public.organization_invitation_event_type,
    recipient_profile.id,
    command_now
  );

  return query
  select
    recipient_profile.id,
    recipient_profile.role,
    'activated'::text,
    true;
end;
$$;

comment on function public.accept_organization_invitation(uuid, text) is
  'Service-role-only command for atomically accepting a matching organization invitation and activating the invited profile without exposing Auth email, invite IDs, or privileged assignment inputs.';

revoke all on function public.accept_organization_invitation(uuid, text)
  from public, anon, authenticated;

grant execute on function public.accept_organization_invitation(uuid, text)
  to service_role;
