-- LOCAL TESTING ONLY. Never run this in Supabase.
--
-- Supabase provides the "auth" schema, the anon/authenticated roles and auth.uid()
-- itself. This file fakes just enough of them in a throwaway local PostgreSQL
-- database so that schema.sql and rls.test.sql can be tested without an account.

-- Roles belong to the whole PostgreSQL server, so allow re-running on a fresh database.
do $$
begin
  create role anon nologin;
exception when duplicate_object then null;
end $$;
do $$
begin
  create role authenticated nologin;
exception when duplicate_object then null;
end $$;

create schema auth;
create table auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text unique,
  raw_user_meta_data jsonb not null default '{}'
);

-- Supabase reads the signed-in user from the request's token; here a setting stands in.
create function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

grant usage on schema auth to anon, authenticated;
grant usage on schema public to anon, authenticated;
