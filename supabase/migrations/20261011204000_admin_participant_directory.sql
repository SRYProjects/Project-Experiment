-- Private admin participant directory for the Worker service boundary.
-- This function joins Auth identity to Project Meaningful profile/activity data.
-- It is callable only by the service role; the Worker separately requires
-- allowlisted admin access plus AAL2 before returning the result.

create or replace function public.admin_participant_directory()
returns table(
  user_id uuid,
  username text,
  email text,
  account_created_at timestamptz,
  profile_created_at timestamptz,
  email_confirmed_at timestamptz,
  action_count bigint,
  discovery_count bigint,
  is_admin boolean
)
language sql
stable
security definer
set search_path to ''
as $function$
  select
    p.id as user_id,
    p.username,
    u.email,
    u.created_at as account_created_at,
    p.created_at as profile_created_at,
    u.email_confirmed_at,
    (
      select count(*)
      from public.meaningful_actions a
      where a.user_id = p.id
        and a.is_demo = false
    )::bigint as action_count,
    (
      select count(*)
      from public.discoveries d
      where d.user_id = p.id
        and d.is_demo = false
    )::bigint as discovery_count,
    exists (
      select 1
      from public.admin_users au
      where au.user_id = p.id
    ) as is_admin
  from public.profiles p
  join auth.users u
    on u.id = p.id
  where p.is_demo = false
  order by p.created_at desc;
$function$;

revoke all on function public.admin_participant_directory()
  from public, anon, authenticated;

grant execute on function public.admin_participant_directory()
  to service_role;
