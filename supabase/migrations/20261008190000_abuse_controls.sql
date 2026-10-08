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
