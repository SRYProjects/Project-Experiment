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
