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
