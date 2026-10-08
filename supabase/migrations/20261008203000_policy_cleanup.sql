-- Remove obsolete browser-facing RLS policies now that application data
-- access is Worker-only. RLS remains enabled and therefore deny-all for client roles.

drop policy if exists "Public profiles are readable"
  on public.profiles;
drop policy if exists "Users create own profile"
  on public.profiles;
drop policy if exists "Users update own profile"
  on public.profiles;
drop policy if exists "Admins manage profiles"
  on public.profiles;

drop policy if exists "Public reads published actions"
  on public.meaningful_actions;
drop policy if exists "Users submit own actions"
  on public.meaningful_actions;
drop policy if exists "Admins manage actions"
  on public.meaningful_actions;

drop policy if exists "Public reads published discoveries"
  on public.discoveries;
drop policy if exists "Users submit own discoveries"
  on public.discoveries;
drop policy if exists "Admins manage discoveries"
  on public.discoveries;

drop policy if exists "Admins read admin allowlist"
  on public.admin_users;

drop policy if exists "Admins read audit log"
  on public.admin_audit_log;
drop policy if exists "Admins insert audit events"
  on public.admin_audit_log;

revoke all on function public.is_admin()
  from public, anon, authenticated;
grant execute on function public.is_admin()
  to service_role;

revoke all on function public.protect_profile_system_fields()
  from public, anon, authenticated;
grant execute on function public.protect_profile_system_fields()
  to service_role;

create index if not exists admin_audit_log_admin_user_idx
  on public.admin_audit_log (admin_user_id, created_at desc);
