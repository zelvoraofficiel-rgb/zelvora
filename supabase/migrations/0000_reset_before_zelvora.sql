-- ⚠️ DESTRUCTIVE RESET — THIS CANNOT BE UNDONE.
-- Run only in the correct Supabase project after exporting anything worth keeping.
-- This clears every application object in `public` and every end-user account in Supabase Auth.
-- Supabase blocks direct SQL deletion of Storage files/buckets; clean those separately in Storage UI if needed.

begin;

-- Remove the old application schema, including old tables, policies, functions and triggers.
drop schema if exists public cascade;
create schema public;

-- Restore the standard, least-privilege grants required by Supabase clients + RLS.
revoke all on schema public from public;
grant all on schema public to postgres, service_role;
grant usage on schema public to anon, authenticated;

-- The new migration is executed as `postgres`; these defaults ensure the API roles can
-- reach tables while Row Level Security still determines which rows they may access.
alter default privileges for role postgres in schema public grant all on tables to postgres, service_role;
alter default privileges for role postgres in schema public grant select on tables to anon;
alter default privileges for role postgres in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges for role postgres in schema public grant all on sequences to postgres, service_role;
alter default privileges for role postgres in schema public grant usage, select on sequences to anon, authenticated;

-- Remove every end-user identity created with Supabase Auth.
-- Dashboard/team-member accounts are NOT stored in auth.users and are not affected.
delete from auth.users;

-- Do NOT delete from storage.objects or storage.buckets here.
-- Supabase intentionally blocks direct SQL deletion; use Storage → each bucket → Delete
-- in the Dashboard if you also need to remove legacy files/buckets.

commit;
