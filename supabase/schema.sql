-- Project Meaningful — canonical database baseline
-- Snapshot verified against the live Supabase public schema on 2026-09-29.
--
-- PURPOSE
--   Reproducible definition of the application's public database schema.
--   Supabase-managed schemas (auth, storage, etc.) are intentionally excluded.
--
-- IMPORTANT
--   This is a BASELINE for a fresh Supabase project. Do not run it against the
--   existing production database, where these objects already exist.
--   Future database changes must be committed as dated files under
--   supabase/migrations/ and applied deliberately to Supabase.
--
-- Assumes Supabase auth schema/roles already exist.

create type public.action_category as enum (
  'Family',
  'Relationships',
  'Health',
  'Work',
  'Learning',
  'Creativity',
  'Service',
  'Faith',
  'Responsibility',
  'Other',
  'Sacrifice'
);

create type public.moderation_status as enum (
  'pending',
  'published',
  'rejected'
);

create table public.profiles (
  id uuid not null,
  username text not null,
  username_normalized text generated always as (lower(username)) stored,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey
    foreign key (id) references auth.users(id) on delete cascade,
  constraint username_format
    check (username ~ '^[A-Za-z0-9_]+$'::text),
  constraint username_length
    check (char_length(username) >= 3 and char_length(username) <= 30),
  constraint username_normalized_unique unique (username_normalized)
);

create table public.meaningful_actions (
  id bigint generated always as identity,
  user_id uuid null,
  demo_username text null,
  category public.action_category not null,
  action_text text not null,
  moderation_status public.moderation_status not null default 'pending',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  moderated_at timestamptz null,
  constraint meaningful_actions_pkey primary key (id),
  constraint meaningful_actions_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade,
  constraint action_text_length
    check (
      char_length(trim(both from action_text)) >= 1
      and char_length(trim(both from action_text)) <= 140
    ),
  constraint meaningful_actions_identity_check
    check (
      (
        is_demo = false
        and user_id is not null
        and demo_username is null
      )
      or
      (
        is_demo = true
        and user_id is null
        and demo_username is not null
        and demo_username = lower(demo_username)
        and demo_username ~ '^[a-z0-9_]{3,30}$'
      )
    )
);

create table public.discoveries (
  id bigint generated always as identity,
  user_id uuid null,
  demo_username text null,
  discovery_text text not null,
  moderation_status public.moderation_status not null default 'pending',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  moderated_at timestamptz null,
  constraint discoveries_pkey primary key (id),
  constraint discoveries_user_id_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade,
  constraint discovery_text_length
    check (
      char_length(trim(both from discovery_text)) >= 1
      and char_length(trim(both from discovery_text)) <= 280
    ),
  constraint discoveries_identity_check
    check (
      (
        is_demo = false
        and user_id is not null
        and demo_username is null
      )
      or
      (
        is_demo = true
        and user_id is null
        and demo_username is not null
        and demo_username = lower(demo_username)
        and demo_username ~ '^[a-z0-9_]{3,30}$'
      )
    )
);

create table public.admin_users (
  user_id uuid not null,
  created_at timestamptz not null default now(),
  constraint admin_users_pkey primary key (user_id),
  constraint admin_users_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade
);

create table public.admin_audit_log (
  id bigint generated always as identity,
  admin_user_id uuid not null,
  event_type text not null,
  target_type text null,
  target_id text null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint admin_audit_log_pkey primary key (id),
  constraint admin_audit_log_admin_user_id_fkey
    foreign key (admin_user_id) references auth.users(id)
);

create index meaningful_actions_public_feed_idx
  on public.meaningful_actions (created_at desc)
  where moderation_status = 'published';

create index meaningful_actions_category_idx
  on public.meaningful_actions (category, created_at desc)
  where moderation_status = 'published';

create index meaningful_actions_user_idx
  on public.meaningful_actions (user_id, created_at desc);

create index discoveries_public_feed_idx
  on public.discoveries (created_at desc)
  where moderation_status = 'published';

create index discoveries_user_idx
  on public.discoveries (user_id, created_at desc);

create index admin_audit_log_created_idx
  on public.admin_audit_log (created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$function$;

create or replace function public.project_stats()
returns table(
  total_actions bigint,
  actions_today bigint,
  real_participants bigint
)
language sql
stable
security definer
set search_path to ''
as $function$
  select
    count(*) filter (
      where a.moderation_status = 'published'
        and a.is_demo = false
    )::bigint,

    count(*) filter (
      where a.moderation_status = 'published'
        and a.is_demo = false
        and (a.created_at at time zone 'America/New_York')::date =
            (now() at time zone 'America/New_York')::date
    )::bigint,

    count(distinct a.user_id) filter (
      where a.moderation_status = 'published'
        and a.is_demo = false
    )::bigint
  from public.meaningful_actions a;
$function$;

create or replace function public.protect_profile_system_fields()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not public.is_admin() then
    new.id := old.id;
    new.is_demo := old.is_demo;
    new.created_at := old.created_at;
  end if;

  return new;
end;
$function$;

create or replace function public.require_admin_for_action_update()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not public.is_admin() then
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
  if not public.is_admin() then
    raise exception 'Only administrators may modify existing discoveries.';
  end if;

  return new;
end;
$function$;

create or replace function public.set_moderated_at()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  if new.moderation_status is distinct from old.moderation_status
     and new.moderation_status in ('published', 'rejected') then
    new.moderated_at := now();
  end if;

  return new;
end;
$function$;

create trigger protect_profile_system_fields_trigger
before update on public.profiles
for each row execute function public.protect_profile_system_fields();

create trigger require_admin_for_action_update_trigger
before update on public.meaningful_actions
for each row execute function public.require_admin_for_action_update();

create trigger actions_set_moderated_at
before update on public.meaningful_actions
for each row execute function public.set_moderated_at();

create trigger require_admin_for_discovery_update_trigger
before update on public.discoveries
for each row execute function public.require_admin_for_discovery_update();

create trigger discoveries_set_moderated_at
before update on public.discoveries
for each row execute function public.set_moderated_at();

alter table public.profiles enable row level security;
alter table public.meaningful_actions enable row level security;
alter table public.discoveries enable row level security;
alter table public.admin_users enable row level security;
alter table public.admin_audit_log enable row level security;

create policy "Public profiles are readable"
on public.profiles
for select
to anon, authenticated
using (true);

create policy "Users create own profile"
on public.profiles
for insert
to authenticated
with check ((id = auth.uid()) and (is_demo = false));

create policy "Users update own profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check ((id = auth.uid()) and (is_demo = false));

create policy "Admins manage profiles"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public reads published actions"
on public.meaningful_actions
for select
to anon, authenticated
using (
  (moderation_status = 'published')
  or (user_id = auth.uid())
  or public.is_admin()
);

create policy "Users submit own actions"
on public.meaningful_actions
for insert
to authenticated
with check (
  (user_id = auth.uid())
  and (moderation_status = 'pending')
  and (is_demo = false)
);

create policy "Admins manage actions"
on public.meaningful_actions
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Public reads published discoveries"
on public.discoveries
for select
to anon, authenticated
using (
  (moderation_status = 'published')
  or (user_id = auth.uid())
  or public.is_admin()
);

create policy "Users submit own discoveries"
on public.discoveries
for insert
to authenticated
with check (
  (user_id = auth.uid())
  and (moderation_status = 'pending')
  and (is_demo = false)
);

create policy "Admins manage discoveries"
on public.discoveries
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins read admin allowlist"
on public.admin_users
for select
to authenticated
using (public.is_admin());

create policy "Admins read audit log"
on public.admin_audit_log
for select
to authenticated
using (public.is_admin());

create policy "Admins insert audit events"
on public.admin_audit_log
for insert
to authenticated
with check (
  public.is_admin()
  and (admin_user_id = auth.uid())
);

-- Live Supabase inspection showed the standard API roles currently hold table
-- privileges while RLS governs row access. Preserve that effective arrangement.
grant all privileges on table public.profiles to anon, authenticated, service_role;
grant all privileges on table public.meaningful_actions to anon, authenticated, service_role;
grant all privileges on table public.discoveries to anon, authenticated, service_role;
grant all privileges on table public.admin_users to anon, authenticated, service_role;
grant all privileges on table public.admin_audit_log to anon, authenticated, service_role;

grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.project_stats() to anon, authenticated, service_role;
grant execute on function public.protect_profile_system_fields() to anon, authenticated, service_role;
grant execute on function public.require_admin_for_action_update() to anon, authenticated, service_role;
grant execute on function public.require_admin_for_discovery_update() to anon, authenticated, service_role;
grant execute on function public.set_moderated_at() to anon, authenticated, service_role;

-- Abuse/security controls added 2026-10-08.
-- Abuse/security controls for Project Experiment.
-- Adds reserved usernames and service-role-only fixed-window rate limiting.

create table public.reserved_usernames (
  username_normalized text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint reserved_usernames_pkey primary key (username_normalized),
  constraint reserved_username_format
    check (
      username_normalized = lower(username_normalized)
      and username_normalized ~ '^[a-z0-9_]{3,30}$'
    )
);

insert into public.reserved_usernames (username_normalized, reason)
values
  ('admin', 'system'),
  ('administrator', 'system'),
  ('api', 'system'),
  ('help', 'system'),
  ('meaningful', 'brand'),
  ('mod', 'system'),
  ('moderator', 'system'),
  ('official', 'system'),
  ('privacy', 'system'),
  ('project_meaningful', 'brand'),
  ('projectmeaningful', 'brand'),
  ('root', 'system'),
  ('security', 'system'),
  ('staff', 'system'),
  ('support', 'system'),
  ('system', 'system'),
  ('terms', 'system'),
  ('www', 'system')
on conflict (username_normalized) do nothing;

insert into public.reserved_usernames (username_normalized, reason)
select distinct demo_username, 'demo'
from (
  select demo_username
  from public.meaningful_actions
  where is_demo = true

  union

  select demo_username
  from public.discoveries
  where is_demo = true
) demo_names
where demo_username is not null
on conflict (username_normalized) do nothing;

create table public.abuse_rate_limits (
  scope text not null,
  key_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint abuse_rate_limits_pkey
    primary key (scope, key_hash, window_start),
  constraint abuse_rate_limits_scope_length
    check (char_length(scope) between 1 and 80),
  constraint abuse_rate_limits_hash_format
    check (key_hash ~ '^[a-f0-9]{64}$'),
  constraint abuse_rate_limits_positive_count
    check (request_count >= 1)
);

create index abuse_rate_limits_updated_idx
  on public.abuse_rate_limits (updated_at);

create or replace function public.enforce_reserved_username()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if exists (
    select 1
    from public.reserved_usernames r
    where r.username_normalized = lower(new.username)
  ) then
    raise exception 'Username is reserved.'
      using errcode = '23514';
  end if;

  return new;
end;
$function$;

create trigger enforce_reserved_username_trigger
before insert or update of username on public.profiles
for each row execute function public.enforce_reserved_username();

create or replace function public.consume_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table(
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
volatile
security definer
set search_path to ''
as $function$
declare
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_count integer;
  v_retry integer;
begin
  if p_scope is null
     or char_length(p_scope) < 1
     or char_length(p_scope) > 80 then
    raise exception 'Invalid rate-limit scope.';
  end if;

  if p_key_hash is null
     or p_key_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid rate-limit key.';
  end if;

  if p_limit < 1 or p_limit > 10000 then
    raise exception 'Invalid rate-limit maximum.';
  end if;

  if p_window_seconds < 1
     or p_window_seconds > 86400 then
    raise exception 'Invalid rate-limit window.';
  end if;

  v_window_start :=
    to_timestamp(
      floor(
        extract(epoch from v_now) /
        p_window_seconds
      ) * p_window_seconds
    );

  insert into public.abuse_rate_limits (
    scope,
    key_hash,
    window_start,
    request_count,
    updated_at
  )
  values (
    p_scope,
    p_key_hash,
    v_window_start,
    1,
    v_now
  )
  on conflict (scope, key_hash, window_start)
  do update
  set
    request_count =
      public.abuse_rate_limits.request_count + 1,
    updated_at = excluded.updated_at
  returning request_count into v_count;

  delete from public.abuse_rate_limits
  where scope = p_scope
    and key_hash = p_key_hash
    and window_start < v_now - interval '2 days';

  v_retry :=
    greatest(
      1,
      ceil(
        extract(
          epoch from (
            v_window_start +
            make_interval(secs => p_window_seconds) -
            v_now
          )
        )
      )::integer
    );

  return query
  select
    (v_count <= p_limit),
    greatest(p_limit - v_count, 0),
    v_retry;
end;
$function$;

alter table public.reserved_usernames enable row level security;
alter table public.abuse_rate_limits enable row level security;

revoke all privileges on table public.reserved_usernames
  from anon, authenticated;
revoke all privileges on table public.abuse_rate_limits
  from anon, authenticated;

grant all privileges on table public.reserved_usernames
  to service_role;
grant all privileges on table public.abuse_rate_limits
  to service_role;

revoke all on function public.enforce_reserved_username()
  from public, anon, authenticated;
grant execute on function public.enforce_reserved_username()
  to service_role;

revoke all on function public.consume_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer)
  to service_role;

-- Applied migration: 20261008194500_lock_down_direct_writes.sql
-- Force all profile/content writes through the Cloudflare Worker.
-- Public/authenticated clients retain read access where required by V1.

revoke insert, update, delete
on table public.profiles
from anon, authenticated;

revoke insert, update, delete
on table public.meaningful_actions
from anon, authenticated;

revoke insert, update, delete
on table public.discoveries
from anon, authenticated;


-- Applied migration: 20261008195500_security_grant_cleanup.sql
-- Tighten public API grants and bound rate-limit data retention.

revoke all privileges on table public.profiles
  from anon, authenticated;
grant select on table public.profiles
  to anon, authenticated;

revoke all privileges on table public.meaningful_actions
  from anon, authenticated;
grant select on table public.meaningful_actions
  to anon, authenticated;

revoke all privileges on table public.discoveries
  from anon, authenticated;
grant select on table public.discoveries
  to anon, authenticated;

create or replace function public.consume_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table(
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
volatile
security definer
set search_path to ''
as $function$
declare
  v_now timestamptz := clock_timestamp();
  v_window_start timestamptz;
  v_count integer;
  v_retry integer;
begin
  if p_scope is null
     or char_length(p_scope) < 1
     or char_length(p_scope) > 80 then
    raise exception 'Invalid rate-limit scope.';
  end if;

  if p_key_hash is null
     or p_key_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid rate-limit key.';
  end if;

  if p_limit < 1 or p_limit > 10000 then
    raise exception 'Invalid rate-limit maximum.';
  end if;

  if p_window_seconds < 1
     or p_window_seconds > 86400 then
    raise exception 'Invalid rate-limit window.';
  end if;

  v_window_start :=
    to_timestamp(
      floor(
        extract(epoch from v_now) /
        p_window_seconds
      ) * p_window_seconds
    );

  insert into public.abuse_rate_limits (
    scope,
    key_hash,
    window_start,
    request_count,
    updated_at
  )
  values (
    p_scope,
    p_key_hash,
    v_window_start,
    1,
    v_now
  )
  on conflict (scope, key_hash, window_start)
  do update
  set
    request_count =
      public.abuse_rate_limits.request_count + 1,
    updated_at = excluded.updated_at
  returning request_count into v_count;

  delete from public.abuse_rate_limits
  where updated_at < v_now - interval '2 days';

  v_retry :=
    greatest(
      1,
      ceil(
        extract(
          epoch from (
            v_window_start +
            make_interval(secs => p_window_seconds) -
            v_now
          )
        )
      )::integer
    );

  return query
  select
    (v_count <= p_limit),
    greatest(p_limit - v_count, 0),
    v_retry;
end;
$function$;

revoke all on function public.consume_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer)
  to service_role;


-- Applied migration: 20261008200500_admin_security_hardening.sql
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


-- Applied migration: 20261008202000_worker_data_boundary.sql
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
