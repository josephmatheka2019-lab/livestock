-- Local Livestock Marketplace: database schema and access rules for Supabase.
--
-- Run this ONCE in a new Supabase project (SQL Editor > New query > paste > Run).
-- Sellers and buyers are separate account types. The rules below are enforced by
-- the database itself, so they hold even if someone tampers with the web page.
--
--   seller: creates, edits and deletes only their own listings.
--   buyer : reads available listings, sees a seller's contact details only with a
--           completed profile, and keeps a private list of favourites.

create type public.user_role as enum ('seller', 'buyer');

-- ---------------------------------------------------------------------------
-- Profiles: one row per account, created automatically at sign-up.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  role         public.user_role not null,
  display_name text not null default '' check (char_length(display_name) <= 80),
  phone        text not null default '' check (char_length(phone) <= 30),
  location     text not null default '' check (char_length(location) <= 80),
  created_at   timestamptz not null default now()
);

-- The account type is chosen at sign-up and read once, here. Anything other than
-- an explicit 'seller' becomes 'buyer', the least-privileged role. After this the
-- role can never be changed by the user (see the column grants below).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'role' = 'seller'
         then 'seller'::public.user_role
         else 'buyer'::public.user_role end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpers used by the access rules. They read profiles as the table owner, so the
-- rules can ask "what am I?" without tripping over the profiles rules themselves.
create function public.my_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.my_profile_complete() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select display_name <> '' and phone <> '' from public.profiles where id = auth.uid()),
    false)
$$;

revoke all on function public.my_role(), public.my_profile_complete() from public;
grant execute on function public.my_role(), public.my_profile_complete() to authenticated;

-- ---------------------------------------------------------------------------
-- Listings
-- ---------------------------------------------------------------------------
create table public.listings (
  id                 uuid primary key default gen_random_uuid(),
  seller_id          uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  animal_type        text not null check (char_length(animal_type) between 1 and 60),
  other_animal       text not null default '' check (char_length(other_animal) <= 60),
  quantity           integer not null check (quantity >= 1),
  currency           text not null default 'KES' check (currency ~ '^[A-Z]{3}$'),
  price              numeric(14, 3) not null check (price >= 0),
  bulk_price         numeric(14, 3) check (bulk_price >= 0),
  location           text not null check (char_length(location) between 1 and 80),
  status             text not null default 'available' check (status in ('available', 'sold')),
  breed              text not null default '' check (char_length(breed) <= 60),
  age                text not null default '' check (char_length(age) <= 40),
  weight             numeric(8, 2) check (weight > 0),
  vaccinated         boolean not null default false,
  health_certificate boolean not null default false,
  negotiable         boolean not null default false,
  delivery           boolean not null default false,
  payment_methods    text[] not null
    check (cardinality(payment_methods) >= 1 and payment_methods <@ array['mpesa', 'card', 'cash']),
  description        text not null default '' check (char_length(description) <= 500),
  photo_path         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index listings_seller_idx on public.listings (seller_id);
create index listings_browse_idx on public.listings (status, created_at desc);

create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_touch_updated_at
  before update on public.listings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Favourites: a buyer's private saved list.
-- ---------------------------------------------------------------------------
create table public.favourites (
  buyer_id   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (buyer_id, listing_id)
);

-- ---------------------------------------------------------------------------
-- Access rules. Row level security is deny-by-default: with it switched on, a
-- request can only do what a policy below explicitly allows.
-- ---------------------------------------------------------------------------
alter table public.profiles   enable row level security;
alter table public.listings   enable row level security;
alter table public.favourites enable row level security;

-- Signed-out visitors get nothing. Signed-in users get only the grants below.
revoke all on public.profiles, public.listings, public.favourites from anon, authenticated;
grant select on public.profiles to authenticated;
-- No "role" here, so an account can never promote itself to another type.
grant update (display_name, phone, location) on public.profiles to authenticated;
grant select, insert, update, delete on public.listings to authenticated;
grant select, insert, delete on public.favourites to authenticated;

-- profiles
create policy "read own profile" on public.profiles
  for select to authenticated
  using (id = auth.uid());

-- A buyer with a completed profile can read the contact details of sellers who
-- currently have something available, and nobody else's profile.
create policy "buyers read sellers with available listings" on public.profiles
  for select to authenticated
  using (
    role = 'seller'
    and public.my_role() = 'buyer'
    and public.my_profile_complete()
    and exists (
      select 1 from public.listings l
      where l.seller_id = profiles.id and l.status = 'available'
    )
  );

create policy "update own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- listings
create policy "read own listings, or available ones as a buyer" on public.listings
  for select to authenticated
  using (
    seller_id = auth.uid()
    or (status = 'available' and public.my_role() = 'buyer')
  );

-- Only sellers with a completed profile can post, and only as themselves.
create policy "sellers create their own listings" on public.listings
  for insert to authenticated
  with check (
    seller_id = auth.uid()
    and public.my_role() = 'seller'
    and public.my_profile_complete()
  );

create policy "sellers update their own listings" on public.listings
  for update to authenticated
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

create policy "sellers delete their own listings" on public.listings
  for delete to authenticated
  using (seller_id = auth.uid());

-- favourites
create policy "buyers read their favourites" on public.favourites
  for select to authenticated
  using (buyer_id = auth.uid() and public.my_role() = 'buyer');

create policy "buyers add favourites" on public.favourites
  for insert to authenticated
  with check (buyer_id = auth.uid() and public.my_role() = 'buyer');

create policy "buyers remove favourites" on public.favourites
  for delete to authenticated
  using (buyer_id = auth.uid() and public.my_role() = 'buyer');
