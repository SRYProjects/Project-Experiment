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
