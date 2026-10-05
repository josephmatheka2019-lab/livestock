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

-- Supabase's file store, faked as two tables so schema.sql's photo rules can be
-- tested. schema.sql then creates the bucket and the policies on top of these.
create schema storage;

create table storage.buckets (
  id     text primary key,
  name   text not null,
  public boolean not null default false
);

create table storage.objects (
  id         uuid primary key default gen_random_uuid(),
  bucket_id  text not null references storage.buckets (id),
  name       text not null,
  owner      uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (bucket_id, name)
);

alter table storage.objects enable row level security;

grant usage on schema storage to anon, authenticated;
grant select, insert, update, delete on storage.buckets to anon, authenticated;
grant select, insert, update, delete on storage.objects to anon, authenticated;
