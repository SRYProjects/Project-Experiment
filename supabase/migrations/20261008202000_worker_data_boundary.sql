-- Make the Worker the only application data-access path and allow
-- its service-role moderation updates through the existing admin triggers.

revoke all privileges on table public.profiles
  from anon, authenticated;

revoke all privileges on table public.meaningful_actions
  from anon, authenticated;

revoke all privileges on table public.discoveries
  from anon, authenticated;

create or replace function public.require_admin_for_action_update()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and not public.is_admin() then
    raise exception 'Only administrators may modify existing actions.';
  end if;

  return new;
end;
$function$;

create or replace function public.require_admin_for_discovery_update()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and not public.is_admin() then
    raise exception 'Only administrators may modify existing discoveries.';
  end if;

  return new;
end;
$function$;

revoke all on function public.require_admin_for_action_update()
  from public, anon, authenticated;
grant execute on function public.require_admin_for_action_update()
  to service_role;

revoke all on function public.require_admin_for_discovery_update()
  from public, anon, authenticated;
grant execute on function public.require_admin_for_discovery_update()
  to service_role;
