-- Local Livestock Marketplace: database schema and access rules for Supabase.
--
-- Run this ONCE in a new Supabase project (SQL Editor > New query > paste > Run).
-- Sellers and buyers are separate account types. The rules below are enforced by
-- the database itself, so they hold even if someone tampers with the web page.
--
--   seller: creates, edits and deletes only their own listings, and manages the
--           orders, moderation and store records that belong to them.
--   buyer : reads available listings, sees a seller's contact details only with a
--           completed profile, keeps a private list of favourites, and places
--           orders (whose history the database writes itself).
--   admin : an account flagged is_admin by hand (see the note at the very end);
--           reads everything and owns account_moderation, payment_holds and
--           store_sales.
--
-- Tables: profiles, listings, favourites, orders, order_events, account_moderation,
-- payment_holds, store_sales, preferences, plus the listing-photos storage bucket.

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
  about        text not null default '' check (char_length(about) <= 300),
  is_admin     boolean not null default false,
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

-- The administrator flag is set only by hand in the SQL editor (see the note at
-- the end of this file). profile_role() lets the badge rules read an account's
-- type without tripping over the profiles rules themselves.
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

create function public.profile_role(u uuid) returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = u
$$;

revoke all on function public.my_role(), public.my_profile_complete(), public.is_admin(), public.profile_role(uuid) from public;
grant execute on function public.my_role(), public.my_profile_complete(), public.is_admin(), public.profile_role(uuid) to authenticated;

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
  paused             boolean not null default false,
  boosted_until      timestamptz,
  -- Sold the moment it went out of stock; sold_out_by remembers the order that
  -- took the last animals, so a cancel can put the listing back on sale.
  sold_at            timestamptz,
  sold_out_by        uuid,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (status <> 'sold' or not paused)
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
  -- The saved listing's name, kept so the card still reads correctly if the
  -- listing itself is later deleted.
  label      text not null default '' check (char_length(label) <= 80),
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
grant update (display_name, phone, location, about) on public.profiles to authenticated;
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
      where l.seller_id = profiles.id and l.status = 'available' and not l.paused
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
    or (status = 'available' and not paused and public.my_role() = 'buyer')
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

-- ---------------------------------------------------------------------------
-- Orders: a buyer orders from a listing, the seller accepts, the buyer pays.
-- Money, quantities and both sides' details are frozen at placement; only the
-- status and the held-stock flag can change afterwards, and only by someone on
-- one side of the order (or the administrator).
-- ---------------------------------------------------------------------------
create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  listing_id       uuid not null references public.listings (id) on delete cascade,
  buyer_id         uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- Snapshots, so an order still reads correctly if the listing or profile changes.
  listing_label    text not null default '' check (char_length(listing_label) <= 80),
  listing_location text not null default '' check (char_length(listing_location) <= 80),
  buyer_name       text not null default '' check (char_length(buyer_name) <= 80),
  buyer_phone      text not null default '' check (char_length(buyer_phone) <= 30),
  buyer_location   text not null default '' check (char_length(buyer_location) <= 80),
  quantity         integer not null check (quantity >= 1),
  unit_price       numeric(14, 3) not null check (unit_price >= 0),
  total            numeric(14, 3) not null check (total >= 0),
  used_bulk        boolean not null default false,
  currency         text not null default 'KES' check (currency ~ '^[A-Z]{3}$'),
  payment_method   text not null check (payment_method in ('mpesa', 'card', 'cash')),
  mpesa_channel    text not null default ''
    check (mpesa_channel = '' or mpesa_channel in ('till', 'paybill', 'pochi')),
  delivery         text not null default '' check (char_length(delivery) <= 120),
  note             text not null default '' check (char_length(note) <= 300),
  status           text not null default 'placed'
    check (status in ('placed', 'accepted', 'paid', 'completed', 'declined', 'cancelled')),
  stock_held       boolean not null default false,
  created_at       timestamptz not null default now(),
  -- Paying by M-Pesa means choosing how: till, paybill or Pochi.
  check (payment_method <> 'mpesa' or mpesa_channel <> '')
);

create index orders_buyer_idx on public.orders (buyer_id);
create index orders_listing_idx on public.orders (listing_id);

-- The order history the app displays. The database writes these rows itself
-- whenever an order appears or its status changes, so the history can never
-- disagree with the order it belongs to.
create table public.order_events (
  id       bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  status   text not null check (status in ('placed', 'accepted', 'paid', 'completed', 'declined', 'cancelled')),
  at       timestamptz not null default now()
);

create index order_events_order_idx on public.order_events (order_id, at);

create function public.record_order_event() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (order_id, status, at)
    values (new.id, new.status, new.created_at);
  elsif new.status is distinct from old.status then
    insert into public.order_events (order_id, status, at)
    values (new.id, new.status, now());
  end if;
  return coalesce(new, old);
end;
$$;

create trigger orders_record_event
  after insert or update on public.orders
  for each row execute function public.record_order_event();

-- True when the signed-in account stands on one side of this order: the buyer,
-- or the seller of the listing. Read as the table owner so the order and the
-- listing rules never get tangled up inside each other.
create function public.is_order_party(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    select true
    from public.orders ord
    join public.listings l on l.id = ord.listing_id
    where ord.id = o and (ord.buyer_id = auth.uid() or l.seller_id = auth.uid())
    limit 1), false)
$$;

alter table public.orders enable row level security;
alter table public.order_events enable row level security;

revoke all on public.orders, public.order_events from anon, authenticated;
grant select, insert on public.orders to authenticated;
-- Only these two columns may ever change after an order exists.
grant update (status, stock_held) on public.orders to authenticated;
-- No delete: orders are ended (cancelled, declined, completed), never removed.
grant select on public.order_events to authenticated;
-- No insert: record_order_event() writes the history itself.

revoke all on function public.is_order_party(uuid) from public;
grant execute on function public.is_order_party(uuid) to authenticated;

create policy "parties and admin read orders" on public.orders
  for select to authenticated
  using (public.is_order_party(id) or public.is_admin());

-- Placing an order: as myself, as a buyer with a finished profile, for a listing
-- that is on sale right now and not my own. The listing lookup must also pass the
-- listings rules, so a paused, sold or hidden listing can never be ordered.
create policy "buyers place orders" on public.orders
  for insert to authenticated
  with check (
    buyer_id = auth.uid()
    and public.my_role() = 'buyer'
    and public.my_profile_complete()
    and status = 'placed'
    and stock_held = false
    and exists (
      select 1 from public.listings l
      where l.id = listing_id and l.seller_id <> auth.uid()
        and l.status = 'available' and not l.paused
    )
  );

create policy "parties and admin update orders" on public.orders
  for update to authenticated
  using (public.is_order_party(id) or public.is_admin())
  with check (public.is_order_party(id) or public.is_admin());

create policy "parties and admin read order history" on public.order_events
  for select to authenticated
  using (public.is_order_party(order_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- Account moderation: status, verification and Pro for each account, as the
-- admin page sees them. Rows are written only by the administrator or by
-- request_verification() below -- never by a plain update from the account.
-- ---------------------------------------------------------------------------
create table public.account_moderation (
  account_id   uuid primary key references public.profiles (id) on delete cascade,
  status       text not null default 'active'
    check (status in ('active', 'suspended', 'terminated')),
  verification text not null default 'none'
    check (verification in ('none', 'pending', 'verified')),
  pro_until    timestamptz,
  updated_at   timestamptz not null default now()
);

create trigger account_moderation_touch_updated_at
  before update on public.account_moderation
  for each row execute function public.touch_updated_at();

-- A seller asks from the app. Only this function may record it, and only ever
-- as 'pending': marking an account 'verified' is the administrator's decision.
create function public.request_verification() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if public.my_role() <> 'seller' then
    raise exception 'only sellers can request verification';
  end if;
  insert into public.account_moderation (account_id, verification)
  values (auth.uid(), 'pending')
  on conflict (account_id) do update
    set verification = 'pending', updated_at = now()
    where public.account_moderation.verification = 'none';
end;
$$;

alter table public.account_moderation enable row level security;

revoke all on public.account_moderation from anon, authenticated;
grant select, insert, delete on public.account_moderation to authenticated;
grant update (status, verification, pro_until, updated_at) on public.account_moderation to authenticated;

revoke all on function public.request_verification() from public;
grant execute on function public.request_verification() to authenticated;

create policy "read your own account record" on public.account_moderation
  for select to authenticated
  using (account_id = auth.uid());

-- Verified and Pro badges appear on seller cards for every reader, so any
-- signed-in account may read *seller* records -- never other buyers'.
create policy "read seller badges" on public.account_moderation
  for select to authenticated
  using (public.profile_role(account_id) = 'seller');

create policy "admin reads every account" on public.account_moderation
  for select to authenticated
  using (public.is_admin());

-- Non-admins have no write policy at all, so the write grants above are useless
-- to them; self-service only happens through request_verification().
create policy "admin writes account records" on public.account_moderation
  for insert to authenticated
  with check (public.is_admin());

create policy "admin updates account records" on public.account_moderation
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin deletes account records" on public.account_moderation
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Escrow: an order's payment is parked until the administrator releases it.
-- ---------------------------------------------------------------------------
create table public.payment_holds (
  order_id uuid primary key references public.orders (id) on delete cascade,
  held_at  timestamptz not null default now(),
  reason   text not null default '' check (char_length(reason) <= 200)
);

alter table public.payment_holds enable row level security;

revoke all on public.payment_holds from anon, authenticated;
grant select, insert, update, delete on public.payment_holds to authenticated;

create policy "admin reads holds" on public.payment_holds
  for select to authenticated
  using (public.is_admin());

create policy "admin places holds" on public.payment_holds
  for insert to authenticated
  with check (public.is_admin());

create policy "admin updates holds" on public.payment_holds
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin releases holds" on public.payment_holds
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Sales ledger: demo payments for verification, boosts and Seller Pro.
-- Append-only -- a record of what happened, never edited or erased.
-- ---------------------------------------------------------------------------
create table public.store_sales (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind       text not null check (kind in ('verification', 'boost', 'pro')),
  label      text not null check (char_length(label) between 1 and 80),
  amount     numeric(14, 3) not null check (amount >= 0),
  currency   text not null check (currency ~ '^[A-Z]{3}$'),
  at         timestamptz not null default now()
);

create index store_sales_account_idx on public.store_sales (account_id);

alter table public.store_sales enable row level security;

revoke all on public.store_sales from anon, authenticated;
grant select, insert on public.store_sales to authenticated;

create policy "admin and the purchaser read sales" on public.store_sales
  for select to authenticated
  using (public.is_admin() or account_id = auth.uid());

create policy "sellers record their own purchase" on public.store_sales
  for insert to authenticated
  with check (account_id = auth.uid() and public.my_role() = 'seller');
-- No update or delete policy and no grant for either: the ledger stands.

-- ---------------------------------------------------------------------------
-- Display preferences: theme, text size and preferred currency. The column
-- defaults stand in until a row exists, so a fresh account already reads well.
-- ---------------------------------------------------------------------------
create table public.preferences (
  account_id       uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  theme            text not null default 'light' check (theme in ('light', 'dark')),
  text_size        text not null default 'normal' check (text_size in ('small', 'normal', 'large')),
  display_currency text not null default '' check (display_currency = '' or display_currency ~ '^[A-Z]{3}$'),
  updated_at       timestamptz not null default now()
);

create trigger preferences_touch_updated_at
  before update on public.preferences
  for each row execute function public.touch_updated_at();

alter table public.preferences enable row level security;

revoke all on public.preferences from anon, authenticated;
grant select, insert, update, delete on public.preferences to authenticated;

create policy "read own preferences" on public.preferences
  for select to authenticated
  using (account_id = auth.uid());

create policy "save own preferences" on public.preferences
  for insert to authenticated
  with check (account_id = auth.uid());

create policy "change own preferences" on public.preferences
  for update to authenticated
  using (account_id = auth.uid())
  with check (account_id = auth.uid());

create policy "clear own preferences" on public.preferences
  for delete to authenticated
  using (account_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Photos: files in one public bucket, one folder per listing (<listing id>/name).
-- The listing id is the first path part, which the rules below check.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create function public.owns_listing_photo(path text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    select true
    from public.listings l
    where l.id::text = split_part(path, '/', 1) and l.seller_id = auth.uid()
    limit 1), false)
$$;

revoke all on function public.owns_listing_photo(text) from public;
grant execute on function public.owns_listing_photo(text) to authenticated;

-- Supabase's storage.objects already has row-level security; these four rules
-- are ours (the local test shim sets the table up the same way).
create policy "anyone can view listing photos" on storage.objects
  for select
  using (bucket_id = 'listing-photos');

create policy "sellers upload photos for their own listings" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'listing-photos'
    and public.my_role() = 'seller'
    and public.owns_listing_photo(name)
  );

create policy "sellers replace their own photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'listing-photos' and public.owns_listing_photo(name))
  with check (bucket_id = 'listing-photos' and public.owns_listing_photo(name));

create policy "sellers delete their own photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-photos' and public.owns_listing_photo(name));

-- ---------------------------------------------------------------------------
-- Becoming the administrator -- run once, by hand, after you sign up:
--
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'you@example.com');
--
-- Nothing in the app can set this flag; is_admin() above simply reads it.
-- ---------------------------------------------------------------------------
