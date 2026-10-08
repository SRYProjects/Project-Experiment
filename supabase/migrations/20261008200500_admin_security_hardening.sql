-- Harden admin tables before exposing the moderation API.

revoke all privileges on table public.admin_users
  from anon, authenticated;

revoke all privileges on table public.admin_audit_log
  from anon, authenticated;

create or replace function public.prevent_admin_audit_mutation()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  raise exception 'Admin audit log is append-only.';
end;
$function$;

create trigger prevent_admin_audit_update
before update on public.admin_audit_log
for each row execute function public.prevent_admin_audit_mutation();

create trigger prevent_admin_audit_delete
before delete on public.admin_audit_log
for each row execute function public.prevent_admin_audit_mutation();

revoke all on function public.prevent_admin_audit_mutation()
  from public, anon, authenticated;
grant execute on function public.prevent_admin_audit_mutation()
  to service_role;
