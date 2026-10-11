-- Allow an account deletion workflow to de-identify an admin's audit history
-- without making the append-only audit log generally mutable.

alter table public.admin_audit_log
  alter column admin_user_id drop not null;

create or replace function public.prevent_admin_audit_mutation()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if tg_op = 'UPDATE'
     and coalesce(auth.role(), '') = 'service_role'
     and old.admin_user_id is not null
     and new.admin_user_id is null
     and new.id = old.id
     and new.event_type is not distinct from old.event_type
     and new.target_type is not distinct from old.target_type
     and new.target_id is not distinct from old.target_id
     and new.details is not distinct from old.details
     and new.created_at is not distinct from old.created_at then
    return new;
  end if;

  raise exception 'Admin audit log is append-only.';
end;
$function$;

revoke all on function public.prevent_admin_audit_mutation()
  from public, anon, authenticated;

grant execute on function public.prevent_admin_audit_mutation()
  to service_role;
