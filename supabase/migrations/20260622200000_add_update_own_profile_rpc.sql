-- FieldFlow AI self-profile settings foundation.
-- This migration adds only personal profile fields and one narrow RPC for
-- future account settings. It does not add admin profile management, invite
-- flows, Auth email/password changes, or privileged role/team/organization
-- updates.

alter table public.profiles
add column job_title text;

alter table public.profiles
add constraint profiles_job_title_format_check check (
  job_title is null
  or (
    job_title = btrim(job_title)
    and char_length(job_title) between 2 and 80
  )
);

comment on column public.profiles.job_title is
  'Optional professional designation shown on the user profile; users may edit only their own personal value through the self-profile RPC.';

-- Browser clients intentionally have no direct UPDATE grant on profiles.
-- This SECURITY DEFINER RPC is the narrow trusted path for personal settings:
-- it derives identity only from auth.uid(), requires an active profile, updates
-- only display_name/job_title/updated_at, and never accepts privileged fields.
create function public.update_own_profile(
  p_display_name text,
  p_job_title text default null
)
returns table (
  display_name text,
  job_title text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  normalized_display_name text;
  normalized_job_title text;
begin
  if caller_id is null then
    raise exception using
      errcode = '42501',
      message = 'Profile update is unavailable.';
  end if;

  normalized_display_name :=
    regexp_replace(btrim(coalesce(p_display_name, '')), '[[:space:]]+', ' ', 'g');
  normalized_job_title :=
    nullif(regexp_replace(btrim(coalesce(p_job_title, '')), '[[:space:]]+', ' ', 'g'), '');

  if normalized_display_name = ''
    or char_length(normalized_display_name) > 120
  then
    raise exception using
      errcode = '22023',
      message = 'Profile update is unavailable.';
  end if;

  if normalized_job_title is not null
    and (
      char_length(normalized_job_title) < 2
      or char_length(normalized_job_title) > 80
    )
  then
    raise exception using
      errcode = '22023',
      message = 'Profile update is unavailable.';
  end if;

  return query
  update public.profiles as profile
  set
    display_name = normalized_display_name,
    job_title = normalized_job_title,
    updated_at = now()
  where profile.id = caller_id
    and profile.status = 'active'::public.profile_status
  returning
    profile.display_name,
    profile.job_title,
    profile.updated_at;

  if not found then
    raise exception using
      errcode = '42501',
      message = 'Profile update is unavailable.';
  end if;
end;
$$;

comment on function public.update_own_profile(text, text) is
  'Allows an active authenticated user to update only their own display name and optional job title without granting direct profile UPDATE access.';

revoke all on function public.update_own_profile(text, text)
  from public, anon, authenticated;

grant execute on function public.update_own_profile(text, text)
  to authenticated;
