-- FieldFlow AI organization invitation schema foundation.
-- This migration adds only durable invitation metadata and read-only
-- Organization Admin visibility. It does not add Auth Admin calls, email
-- delivery, invite links, onboarding routes, browser writes, or service-role
-- clients.

create type public.organization_invitation_status as enum (
  'pending',
  'sent',
  'accepted',
  'expired',
  'revoked',
  'send_failed'
);

create type public.organization_invitation_event_type as enum (
  'created',
  'sent',
  'resent',
  'send_failed',
  'accepted',
  'expired',
  'revoked'
);

-- Composite profile references keep invitation actors and accepted profiles in
-- the same organization as the invitation. The primary key already guarantees
-- profile id uniqueness; this pair exists only to support safe composite FKs.
alter table public.profiles
add constraint profiles_id_organization_key unique (id, organization_id);

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete restrict,
  normalized_invited_email text not null,
  target_role public.app_role not null,
  target_team_id uuid not null,
  job_title text,
  status public.organization_invitation_status not null default 'pending',
  invited_by_profile_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  sent_at timestamptz,
  last_sent_at timestamptz,
  resend_count integer not null default 0,
  accepted_at timestamptz,
  accepted_profile_id uuid,
  revoked_at timestamptz,
  revoked_by_profile_id uuid,
  constraint organization_invitations_id_organization_key
    unique (id, organization_id),
  constraint organization_invitations_team_organization_fkey
    foreign key (target_team_id, organization_id)
    references public.teams (id, organization_id)
    on delete restrict,
  constraint organization_invitations_inviter_profile_fkey
    foreign key (invited_by_profile_id, organization_id)
    references public.profiles (id, organization_id)
    on delete restrict,
  constraint organization_invitations_accepted_profile_fkey
    foreign key (accepted_profile_id, organization_id)
    references public.profiles (id, organization_id)
    on delete restrict,
  constraint organization_invitations_revoker_profile_fkey
    foreign key (revoked_by_profile_id, organization_id)
    references public.profiles (id, organization_id)
    on delete restrict,
  constraint organization_invitations_email_format_check check (
    normalized_invited_email = lower(btrim(normalized_invited_email))
    and char_length(normalized_invited_email) between 3 and 254
    and normalized_invited_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint organization_invitations_job_title_format_check check (
    job_title is null
    or (
      job_title = btrim(job_title)
      and char_length(job_title) between 2 and 80
    )
  ),
  constraint organization_invitations_expires_after_created_check check (
    expires_at > created_at
  ),
  constraint organization_invitations_resend_count_check check (
    resend_count >= 0
  ),
  constraint organization_invitations_accepted_state_check check (
    (
      status = 'accepted'::public.organization_invitation_status
      and accepted_at is not null
      and accepted_profile_id is not null
      and revoked_at is null
      and revoked_by_profile_id is null
      and sent_at is not null
      and last_sent_at is not null
    )
    or (
      status <> 'accepted'::public.organization_invitation_status
      and accepted_at is null
      and accepted_profile_id is null
    )
  ),
  constraint organization_invitations_revoked_state_check check (
    (
      status = 'revoked'::public.organization_invitation_status
      and revoked_at is not null
      and revoked_by_profile_id is not null
      and accepted_at is null
      and accepted_profile_id is null
    )
    or (
      status <> 'revoked'::public.organization_invitation_status
      and revoked_at is null
      and revoked_by_profile_id is null
    )
  ),
  constraint organization_invitations_send_timestamp_state_check check (
    (
      status in (
        'pending'::public.organization_invitation_status,
        'send_failed'::public.organization_invitation_status
      )
      and sent_at is null
      and last_sent_at is null
    )
    or (
      status in (
        'sent'::public.organization_invitation_status,
        'accepted'::public.organization_invitation_status
      )
      and sent_at is not null
      and last_sent_at is not null
      and last_sent_at >= sent_at
    )
    or (
      status in (
        'expired'::public.organization_invitation_status,
        'revoked'::public.organization_invitation_status
      )
      and (
        (
          sent_at is null
          and last_sent_at is null
        )
        or (
          sent_at is not null
          and last_sent_at is not null
          and last_sent_at >= sent_at
        )
      )
    )
  )
);

comment on table public.organization_invitations is
  'Safe invitation metadata for future invite-only onboarding; stores no Auth tokens, raw invite links, passwords, provider payloads, or raw delivery errors.';
comment on column public.organization_invitations.normalized_invited_email is
  'Lowercase trimmed invited email used for future invite lookup and duplicate prevention.';
comment on column public.organization_invitations.target_team_id is
  'Required target team for the MVP because invited Manager and Sales Executive app users require a team after activation.';
comment on column public.organization_invitations.status is
  'Invitation lifecycle status; send_failed is a safe state and does not store provider error details.';

create trigger organization_invitations_set_updated_at
before update on public.organization_invitations
for each row execute function public.set_updated_at();

create unique index organization_invitations_one_live_email_idx
  on public.organization_invitations (normalized_invited_email)
  where status in (
    'pending'::public.organization_invitation_status,
    'sent'::public.organization_invitation_status,
    'send_failed'::public.organization_invitation_status
  );

create unique index organization_invitations_one_live_manager_team_idx
  on public.organization_invitations (organization_id, target_team_id)
  where target_role = 'manager'::public.app_role
    and status in (
      'pending'::public.organization_invitation_status,
      'sent'::public.organization_invitation_status,
      'send_failed'::public.organization_invitation_status
    );

create index organization_invitations_organization_id_idx
  on public.organization_invitations (organization_id);
create index organization_invitations_status_idx
  on public.organization_invitations (status);
create index organization_invitations_target_team_id_idx
  on public.organization_invitations (target_team_id);
create index organization_invitations_invited_by_profile_id_idx
  on public.organization_invitations (invited_by_profile_id);
create index organization_invitations_accepted_profile_id_idx
  on public.organization_invitations (accepted_profile_id)
  where accepted_profile_id is not null;

create table public.organization_invitation_events (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null,
  organization_id uuid not null,
  event_type public.organization_invitation_event_type not null,
  actor_profile_id uuid,
  occurred_at timestamptz not null default now(),
  constraint organization_invitation_events_invitation_org_fkey
    foreign key (invitation_id, organization_id)
    references public.organization_invitations (id, organization_id)
    on delete cascade,
  constraint organization_invitation_events_actor_profile_fkey
    foreign key (actor_profile_id, organization_id)
    references public.profiles (id, organization_id)
    on delete restrict
);

comment on table public.organization_invitation_events is
  'Safe invitation audit facts only; stores no raw provider errors, tokens, invite links, email delivery payloads, passwords, or sensitive metadata.';
comment on column public.organization_invitation_events.actor_profile_id is
  'Optional profile actor for human-initiated invitation events, constrained to the event organization.';

create index organization_invitation_events_invitation_id_idx
  on public.organization_invitation_events (invitation_id);
create index organization_invitation_events_organization_id_idx
  on public.organization_invitation_events (organization_id);
create index organization_invitation_events_actor_profile_id_idx
  on public.organization_invitation_events (actor_profile_id)
  where actor_profile_id is not null;

alter table public.organization_invitations enable row level security;
alter table public.organization_invitation_events enable row level security;

revoke all on table public.organization_invitations
  from public, anon, authenticated;
revoke all on table public.organization_invitation_events
  from public, anon, authenticated;

grant select on table public.organization_invitations
  to authenticated;
grant select on table public.organization_invitation_events
  to authenticated;

create policy organization_invitations_select_org_admin
on public.organization_invitations
for select
to authenticated
using (
  public.current_user_is_organization_admin()
  and organization_id = public.current_user_organization_id()
);

create policy organization_invitation_events_select_org_admin
on public.organization_invitation_events
for select
to authenticated
using (
  public.current_user_is_organization_admin()
  and organization_id = public.current_user_organization_id()
);
