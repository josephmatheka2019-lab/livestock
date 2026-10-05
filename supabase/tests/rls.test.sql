-- Permission tests for supabase/schema.sql. Local use only (see local-shim.sql).
--
-- Each line prints PASS or FAIL. It signs in as fake accounts and checks both what
-- is allowed and, more importantly, what must be refused.
--
--   psql -d <throwaway db> -f local-shim.sql -f ../schema.sql -f rls.test.sql

\set ON_ERROR_STOP on
\set s1 '00000000-0000-0000-0000-0000000000a1'
\set s2 '00000000-0000-0000-0000-0000000000a2'
\set s3 '00000000-0000-0000-0000-0000000000a3'
\set s4 '00000000-0000-0000-0000-0000000000a4'
\set b1 '00000000-0000-0000-0000-0000000000b1'
\set b2 '00000000-0000-0000-0000-0000000000b2'
\set b3 '00000000-0000-0000-0000-0000000000b3'
\set x1 '00000000-0000-0000-0000-0000000000c1'
\set x2 '00000000-0000-0000-0000-0000000000c2'

-- Test helpers -------------------------------------------------------------
create function public.expect_error(test_name text, sql text) returns void
language plpgsql as $f$
begin
  execute sql;
  raise notice 'FAIL  % (it was allowed)', test_name;
exception when others then
  raise notice 'PASS  % (refused: %)', test_name, sqlerrm;
end;
$f$;

create function public.expect_count(test_name text, q text, expected bigint) returns void
language plpgsql as $f$
declare n bigint;
begin
  execute q into n;
  raise notice '%  % (got %, expected %)', case when n = expected then 'PASS' else 'FAIL' end, test_name, n, expected;
end;
$f$;

create function public.expect_rows(test_name text, dml text, expected bigint) returns void
language plpgsql as $f$
declare n bigint;
begin
  execute dml;
  get diagnostics n = row_count;
  raise notice '%  % (changed %, expected %)', case when n = expected then 'PASS' else 'FAIL' end, test_name, n, expected;
end;
$f$;

-- Fixtures (as the database owner) -------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  (:'s1', 's1@test', '{"role":"seller"}'),
  (:'s2', 's2@test', '{"role":"seller"}'),
  (:'s3', 's3@test', '{"role":"seller"}'),
  (:'s4', 's4@test', '{"role":"seller"}'),
  (:'b1', 'b1@test', '{"role":"buyer"}'),
  (:'b2', 'b2@test', '{"role":"buyer"}'),
  (:'b3', 'b3@test', '{"role":"buyer"}'),
  (:'x1', 'x1@test', '{"role":"admin"}'),
  (:'x2', 'x2@test', '{}');

-- s3 (seller) and b2 (buyer) keep an incomplete profile on purpose.
update public.profiles set display_name = 'Name', phone = '0700000000'
  where id in (:'s1', :'s2', :'s4', :'b1', :'b3');

insert into public.listings (seller_id, animal_type, quantity, price, location, payment_methods, status) values
  (:'s1', 'Goats',  5, 100, 'Nakuru',  '{mpesa}', 'available'),
  (:'s1', 'Cattle', 2, 900, 'Nakuru',  '{cash}',  'sold'),
  (:'s2', 'Sheep',  9,  50, 'Kisumu',  '{card}',  'available'),
  (:'s4', 'Pigs',   4,  70, 'Eldoret', '{cash}',  'sold');

select '--- account types' as section;
select public.expect_count('sign-up as seller gives a seller', format('select count(*) from public.profiles where id=%L and role=''seller''', :'s1'), 1);
select public.expect_count('sign-up as buyer gives a buyer',   format('select count(*) from public.profiles where id=%L and role=''buyer''',  :'b1'), 1);
select public.expect_count('sign-up claiming role "admin" gives a buyer', format('select count(*) from public.profiles where id=%L and role=''buyer''', :'x1'), 1);
select public.expect_count('sign-up with no role gives a buyer', format('select count(*) from public.profiles where id=%L and role=''buyer''', :'x2'), 1);

-- Seller s1 ------------------------------------------------------------------
select '--- seller (complete profile)' as section;
set role authenticated;
select set_config('request.jwt.claim.sub', :'s1', false);

select public.expect_rows('seller can post a listing', $q$insert into public.listings (animal_type, quantity, price, location, payment_methods) values ('Goats', 3, 120, 'Nakuru', '{mpesa,cash}')$q$, 1);
select public.expect_error('seller cannot post as another seller', format($q$insert into public.listings (seller_id, animal_type, quantity, price, location, payment_methods) values (%L, 'Goats', 3, 120, 'Nakuru', '{mpesa}')$q$, :'s2'));
select public.expect_error('rejects quantity 0',            $q$insert into public.listings (animal_type, quantity, price, location, payment_methods) values ('Goats', 0, 120, 'Nakuru', '{mpesa}')$q$);
select public.expect_error('rejects an empty payment list', $q$insert into public.listings (animal_type, quantity, price, location, payment_methods) values ('Goats', 3, 120, 'Nakuru', '{}')$q$);
select public.expect_error('rejects an unknown payment method', $q$insert into public.listings (animal_type, quantity, price, location, payment_methods) values ('Goats', 3, 120, 'Nakuru', '{bitcoin}')$q$);
select public.expect_error('rejects a negative price',      $q$insert into public.listings (animal_type, quantity, price, location, payment_methods) values ('Goats', 3, -1, 'Nakuru', '{mpesa}')$q$);
select public.expect_error('rejects an invalid status',     $q$insert into public.listings (animal_type, quantity, price, location, payment_methods, status) values ('Goats', 3, 1, 'Nakuru', '{mpesa}', 'reserved')$q$);
select public.expect_error('rejects a bad currency code',   $q$insert into public.listings (animal_type, quantity, price, location, payment_methods, currency) values ('Goats', 3, 1, 'Nakuru', '{mpesa}', 'kes')$q$);
select public.expect_count('seller sees only their own listings (3, including sold)', 'select count(*) from public.listings', 3);
select public.expect_rows('seller can edit their own listing', $q$update public.listings set price = 130 where seller_id = auth.uid() and status = 'sold'$q$, 1);
select public.expect_rows('seller cannot edit another seller''s listing', format('update public.listings set price = 1 where seller_id = %L', :'s2'), 0);
select public.expect_rows('seller cannot delete another seller''s listing', format('delete from public.listings where seller_id = %L', :'s2'), 0);
select public.expect_error('seller cannot hand a listing to someone else', format('update public.listings set seller_id = %L where seller_id = auth.uid()', :'s2'));
select public.expect_error('seller cannot change their own account type', $q$update public.profiles set role = 'buyer' where id = auth.uid()$q$);
select public.expect_rows('seller can update their own phone', $q$update public.profiles set phone = '0711111111' where id = auth.uid()$q$, 1);
select public.expect_count('seller cannot read other sellers'' profiles', format('select count(*) from public.profiles where id = %L', :'s2'), 0);
select public.expect_count('seller cannot read buyers'' profiles', format('select count(*) from public.profiles where id = %L', :'b1'), 0);
select public.expect_error('seller cannot use favourites', $q$insert into public.favourites (listing_id) select id from public.listings limit 1$q$);
reset role;

select '--- seller (incomplete profile)' as section;
set role authenticated;
select set_config('request.jwt.claim.sub', :'s3', false);
select public.expect_error('seller with no name/phone cannot post', $q$insert into public.listings (animal_type, quantity, price, location, payment_methods) values ('Goats', 3, 120, 'Nakuru', '{mpesa}')$q$);
reset role;

-- Buyer b1 -------------------------------------------------------------------
select '--- buyer (complete profile)' as section;
set role authenticated;
select set_config('request.jwt.claim.sub', :'b1', false);

select public.expect_count('buyer sees available listings from all sellers only (3)', 'select count(*) from public.listings', 3);
select public.expect_count('buyer never sees sold listings', $q$select count(*) from public.listings where status = 'sold'$q$, 0);
select public.expect_error('buyer cannot post a listing', $q$insert into public.listings (animal_type, quantity, price, location, payment_methods) values ('Goats', 3, 120, 'Nakuru', '{mpesa}')$q$);
select public.expect_rows('buyer cannot edit a listing', 'update public.listings set price = 1', 0);
select public.expect_rows('buyer cannot delete a listing', 'delete from public.listings', 0);
select public.expect_count('buyer can read the contact details of sellers with something available (2)', $q$select count(*) from public.profiles where role = 'seller' and phone <> ''$q$, 2);
select public.expect_count('buyer cannot read a seller who only has sold listings', format('select count(*) from public.profiles where id = %L', :'s4'), 0);
select public.expect_count('buyer cannot read another buyer''s profile', format('select count(*) from public.profiles where id = %L', :'b3'), 0);
select public.expect_count('buyer can read their own profile', format('select count(*) from public.profiles where id = %L', :'b1'), 1);
select public.expect_error('buyer cannot promote themselves to seller', $q$update public.profiles set role = 'seller' where id = auth.uid()$q$);
select public.expect_rows('buyer can update their own phone', $q$update public.profiles set phone = '0722222222' where id = auth.uid()$q$, 1);
select public.expect_rows('buyer can save a favourite', $q$insert into public.favourites (listing_id) select id from public.listings limit 1$q$, 1);
select public.expect_error('buyer cannot save a favourite as someone else', format($q$insert into public.favourites (buyer_id, listing_id) select %L, id from public.listings limit 1$q$, :'b3'));
select public.expect_count('buyer can read their own favourites', 'select count(*) from public.favourites', 1);
reset role;

select '--- buyer (favourites are private)' as section;
set role authenticated;
select set_config('request.jwt.claim.sub', :'b3', false);
select public.expect_count('another buyer cannot see b1''s favourites', 'select count(*) from public.favourites', 0);
select public.expect_rows('another buyer cannot delete b1''s favourites', 'delete from public.favourites', 0);
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', :'b1', false);
select public.expect_rows('buyer can remove their own favourite', 'delete from public.favourites', 1);
reset role;

select '--- buyer (incomplete profile)' as section;
set role authenticated;
select set_config('request.jwt.claim.sub', :'b2', false);
select public.expect_count('buyer with no name/phone can still browse (3)', 'select count(*) from public.listings', 3);
select public.expect_count('buyer with no name/phone cannot read seller contact details', $q$select count(*) from public.profiles where role = 'seller'$q$, 0);
reset role;

-- Signed-out visitor ----------------------------------------------------------
select '--- signed-out visitor' as section;
set role anon;
select public.expect_error('visitor cannot read listings', 'select count(*) from public.listings');
select public.expect_error('visitor cannot read profiles', 'select count(*) from public.profiles');
select public.expect_error('visitor cannot post', $q$insert into public.listings (animal_type, quantity, price, location, payment_methods) values ('Goats', 3, 120, 'Nakuru', '{mpesa}')$q$);
reset role;

-- Orders, moderation, store and photos ----------------------------------------
-- Fixtures (as the database owner): three orders across two sellers, a paused
-- listing, one administrator, two account records, one ledger entry and one photo.
select id as l_goats  from public.listings where animal_type = 'Goats'  and price = 100 \gset
select id as l_sheep  from public.listings where animal_type = 'Sheep'  \gset
select id as l_cattle from public.listings where animal_type = 'Cattle' \gset

insert into public.orders (id, listing_id, buyer_id, listing_label, listing_location, buyer_name, buyer_phone, quantity, unit_price, total, payment_method, mpesa_channel, status) values
  ('00000000-0000-0000-0000-0000000000f1', :'l_goats',  :'b1', 'Goats',  'Nakuru', 'Buyer One',   '0711111111', 2, 100, 200, 'mpesa', 'till', 'placed'),
  ('00000000-0000-0000-0000-0000000000f2', :'l_cattle', :'b3', 'Cattle', 'Nakuru', 'Buyer Three', '0733333333', 1, 130, 130, 'cash',  '',    'completed'),
  ('00000000-0000-0000-0000-0000000000f3', :'l_sheep',  :'b3', 'Sheep',  'Kisumu', 'Buyer Three', '0733333333', 3,  50, 150, 'cash',  '',    'placed');

update public.listings set paused = true where animal_type = 'Goats' and price = 100;
update public.profiles set is_admin = true where id = :'x2';

insert into public.account_moderation (account_id, status, verification, pro_until) values
  (:'s4', 'active',    'verified', now() + interval '30 days'),
  (:'b3', 'suspended', 'none',     null);

insert into public.store_sales (account_id, kind, label, amount, currency, at)
  values (:'s2', 'boost', 'Boosted listing', 250, 'KES', now() - interval '1 day');

insert into storage.objects (bucket_id, name)
  values ('listing-photos', :'l_sheep' || '/main.jpg');

select '--- orders (seller side)' as section;
set role authenticated;
select set_config('request.jwt.claim.sub', :'s1', false);
select public.expect_count('seller sees the orders on their own listings (2)', 'select count(*) from public.orders', 2);
select public.expect_count('seller cannot see an order on someone else''s listing', $q$select count(*) from public.orders where id = '00000000-0000-0000-0000-0000000000f3'$q$, 0);
select public.expect_count('seller reads the history of their orders (2 events)', 'select count(*) from public.order_events', 2);
select public.expect_rows('seller can accept an order', $q$update public.orders set status = 'accepted', stock_held = true where id = '00000000-0000-0000-0000-0000000000f1'$q$, 1);
select public.expect_count('the acceptance is written into the history (3 events)', 'select count(*) from public.order_events', 3);
select public.expect_error('seller cannot change an order''s money', $q$update public.orders set total = 1 where id = '00000000-0000-0000-0000-0000000000f1'$q$);
select public.expect_error('seller cannot rewrite the buyer''s details', $q$update public.orders set buyer_name = 'Me' where id = '00000000-0000-0000-0000-0000000000f1'$q$);
select public.expect_error('seller cannot delete an order', $q$delete from public.orders where id = '00000000-0000-0000-0000-0000000000f1'$q$);
select public.expect_error('a seller cannot place an order', $q$insert into public.orders (listing_id, quantity, unit_price, total, payment_method) select id, 1, price, price, 'cash' from public.listings where status = 'available' limit 1$q$);
reset role;

-- Orders: buyer side ------------------------------------------------------------------
select '--- orders (buyer side)' as section;
set role authenticated;
select set_config('request.jwt.claim.sub', :'b1', false);
select public.expect_count('a paused listing drops out of browsing (2)', 'select count(*) from public.listings', 2);
select public.expect_count('buyer sees only their own order (1)', 'select count(*) from public.orders', 1);
select public.expect_count('buyer reads their order''s history (2 events)', 'select count(*) from public.order_events', 2);
select public.expect_count('buyer cannot see another buyer''s order', $q$select count(*) from public.orders where id = '00000000-0000-0000-0000-0000000000f2'$q$, 0);
select public.expect_count('buyer cannot see an order they are not party to', $q$select count(*) from public.orders where id = '00000000-0000-0000-0000-0000000000f3'$q$, 0);
select public.expect_rows('buyer can pay their order', $q$update public.orders set status = 'paid' where id = '00000000-0000-0000-0000-0000000000f1'$q$, 1);
select public.expect_count('the payment is written into the history (3 events)', 'select count(*) from public.order_events', 3);
select public.expect_error('buyer cannot change an order''s money', $q$update public.orders set total = 1 where id = '00000000-0000-0000-0000-0000000000f1'$q$);
select public.expect_error('buyer cannot delete an order', $q$delete from public.orders where id = '00000000-0000-0000-0000-0000000000f1'$q$);
select public.expect_error('buyer cannot place an order in someone else''s name', format($q$insert into public.orders (listing_id, buyer_id, quantity, unit_price, total, payment_method) select id, %L, 1, price, price, 'cash' from public.listings limit 1$q$, :'b3'));
select public.expect_error('buyer cannot order a paused listing', format($q$insert into public.orders (listing_id, quantity, unit_price, total, payment_method) values (%L, 1, 100, 100, 'cash')$q$, :'l_goats'));
select public.expect_error('buyer cannot order a sold listing', format($q$insert into public.orders (listing_id, quantity, unit_price, total, payment_method) values (%L, 1, 130, 130, 'cash')$q$, :'l_cattle'));
select public.expect_error('buyer cannot fake order history', $q$insert into public.order_events (order_id, status) values ('00000000-0000-0000-0000-0000000000f2', 'completed')$q$);
reset role;

select '--- orders (other buyers and the administrator)' as section;
set role authenticated;
select set_config('request.jwt.claim.sub', :'b3', false);
select public.expect_count('another buyer sees their own orders only (2)', 'select count(*) from public.orders', 2);
select public.expect_count('they cannot see b1''s order', $q$select count(*) from public.orders where id = '00000000-0000-0000-0000-0000000000f1'$q$, 0);
select public.expect_rows('a buyer can cancel their own order', $q$update public.orders set status = 'cancelled' where id = '00000000-0000-0000-0000-0000000000f3'$q$, 1);
select public.expect_count('the cancellation reaches the history (2 events)', $q$select count(*) from public.order_events where order_id = '00000000-0000-0000-0000-0000000000f3'$q$, 2);
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', :'b2', false);
select public.expect_count('an unfinished buyer profile sees no orders', 'select count(*) from public.orders', 0);
select public.expect_error('an unfinished buyer profile cannot order', format($q$insert into public.orders (listing_id, quantity, unit_price, total, payment_method) values (%L, 1, 50, 50, 'cash')$q$, :'l_sheep'));
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', :'x2', false);
select public.expect_count('the administrator reads every order (3)', 'select count(*) from public.orders', 3);
select public.expect_count('the administrator reads the whole history (6 events)', 'select count(*) from public.order_events', 6);
reset role;

-- Account moderation -------------------------------------------------------------
select '--- account moderation' as section;
set role authenticated;
select set_config('request.jwt.claim.sub', :'s1', false);
select public.expect_count('a seller starts with no account record', format('select count(*) from public.account_moderation where account_id = %L', :'s1'), 0);
select public.request_verification();
select public.expect_count('the request records a pending verification', format($q$select count(*) from public.account_moderation where account_id = %L and verification = 'pending'$q$, :'s1'), 1);
select public.expect_rows('a seller cannot mark themselves verified', $q$update public.account_moderation set verification = 'verified' where account_id = auth.uid()$q$, 0);
select public.expect_error('a seller cannot write another account''s record', format($q$insert into public.account_moderation (account_id, status) values (%L, 'suspended')$q$, :'s2'));
select public.expect_rows('a seller cannot suspend another account', format($q$update public.account_moderation set status = 'suspended' where account_id = %L$q$, :'s4'), 0);
select public.expect_count('a seller reads seller badges only (own + s4 = 2)', 'select count(*) from public.account_moderation', 2);
select public.expect_rows('a seller cannot delete their account record', $q$delete from public.account_moderation where account_id = auth.uid()$q$, 0);
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', :'b1', false);
select public.expect_count('a buyer reads seller badges only (2)', 'select count(*) from public.account_moderation', 2);
select public.expect_count('a buyer cannot read another buyer''s record', format('select count(*) from public.account_moderation where account_id = %L', :'b3'), 0);
select public.expect_error('a buyer cannot ask for verification', 'select public.request_verification()');
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', :'x2', false);
select public.expect_count('the administrator reads every account record (3)', 'select count(*) from public.account_moderation', 3);
select public.expect_rows('the administrator can verify a seller', format($q$update public.account_moderation set verification = 'verified' where account_id = %L$q$, :'s1'), 1);
select public.expect_rows('the administrator can suspend an account', format($q$update public.account_moderation set status = 'suspended' where account_id = %L$q$, :'s4'), 1);
select public.expect_rows('the administrator can delete an account record', format($q$delete from public.account_moderation where account_id = %L$q$, :'b3'), 1);
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', :'s1', false);
select public.request_verification();
select public.expect_count('a repeat request cannot undo the administrator''s decision', format($q$select count(*) from public.account_moderation where account_id = %L and verification = 'verified'$q$, :'s1'), 1);
reset role;

-- Escrow holds and sales ledger --------------------------------------------------
select '--- escrow holds' as section;
set role authenticated;
select set_config('request.jwt.claim.sub', :'x2', false);
select public.expect_rows('the administrator can place a hold', $q$insert into public.payment_holds (order_id, reason) values ('00000000-0000-0000-0000-0000000000f2', 'Payment under review')$q$, 1);
select public.expect_count('the hold reads back', $q$select count(*) from public.payment_holds where order_id = '00000000-0000-0000-0000-0000000000f2'$q$, 1);
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', :'s1', false);
select public.expect_count('a seller cannot read escrow holds', 'select count(*) from public.payment_holds', 0);
select public.expect_error('a seller cannot place a hold', $q$insert into public.payment_holds (order_id, reason) values ('00000000-0000-0000-0000-0000000000f1', 'mine')$q$);
select public.expect_rows('a seller cannot release a hold', 'delete from public.payment_holds', 0);
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', :'b1', false);
select public.expect_count('a buyer cannot read escrow holds', 'select count(*) from public.payment_holds', 0);
select public.expect_rows('a buyer cannot release a hold', 'delete from public.payment_holds', 0);
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', :'x2', false);
select public.expect_rows('the administrator can release the hold', $q$delete from public.payment_holds where order_id = '00000000-0000-0000-0000-0000000000f2'$q$, 1);
reset role;

select '--- sales ledger' as section;
set role authenticated;
select set_config('request.jwt.claim.sub', :'s1', false);
select public.expect_rows('a seller records their own purchase', $q$insert into public.store_sales (kind, label, amount, currency) values ('verification', 'Verified badge', 500, 'KES')$q$, 1);
select public.expect_count('a seller reads only their own sales (1)', 'select count(*) from public.store_sales', 1);
select public.expect_error('a seller cannot record a purchase for someone else', format($q$insert into public.store_sales (account_id, kind, label, amount, currency) values (%L, 'pro', 'Seller Pro', 300, 'KES')$q$, :'s2'));
select public.expect_error('a seller cannot edit the ledger', $q$update public.store_sales set amount = 1$q$);
select public.expect_error('a seller cannot erase the ledger', $q$delete from public.store_sales$q$);
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', :'b1', false);
select public.expect_error('a buyer cannot record a purchase', $q$insert into public.store_sales (kind, label, amount, currency) values ('boost', 'Boost', 100, 'KES')$q$);
select public.expect_count('a buyer reads no sales', 'select count(*) from public.store_sales', 0);
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', :'x2', false);
select public.expect_count('the administrator reads the whole ledger (2)', 'select count(*) from public.store_sales', 2);
reset role;

-- Display preferences -------------------------------------------------------------
select '--- display preferences' as section;
set role authenticated;
select set_config('request.jwt.claim.sub', :'s1', false);
select public.expect_rows('a seller saves their own preferences', $q$insert into public.preferences (theme, text_size, display_currency) values ('dark', 'large', 'KES')$q$, 1);
select public.expect_count('their preferences read back (1)', 'select count(*) from public.preferences', 1);
select public.expect_rows('they can change them', $q$update public.preferences set theme = 'light' where account_id = auth.uid()$q$, 1);
select public.expect_error('they cannot hand them to another account', format($q$update public.preferences set account_id = %L where account_id = auth.uid()$q$, :'b1'));
select public.expect_rows('they cannot delete another account''s settings', format($q$delete from public.preferences where account_id = %L$q$, :'b1'), 0);
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', :'b1', false);
select public.expect_rows('a buyer saves their own preferences', $q$insert into public.preferences (theme, text_size) values ('dark', 'small')$q$, 1);
select public.expect_count('settings stay private: only their own reads back (1)', 'select count(*) from public.preferences', 1);
select public.expect_rows('they cannot change someone else''s settings', format($q$update public.preferences set theme = 'light' where account_id = %L$q$, :'s1'), 0);
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', :'x2', false);
select public.expect_count('settings are private even from an administrator (0)', 'select count(*) from public.preferences', 0);
reset role;

select '--- listing photos' as section;
set role authenticated;
select set_config('request.jwt.claim.sub', :'s1', false);
select public.expect_rows('a seller uploads a photo for their own listing', $q$insert into storage.objects (bucket_id, name) select 'listing-photos', id::text || '/main.jpg' from public.listings where seller_id = auth.uid() and price = 100 limit 1$q$, 1);
select public.expect_error('a seller cannot upload into another seller''s folder', format($q$insert into storage.objects (bucket_id, name) values ('listing-photos', %L || '/stolen.jpg')$q$, :'l_sheep'));
select public.expect_count('every signed-in account can view the photos (2)', 'select count(*) from storage.objects', 2);
select public.expect_rows('a seller can replace their own photo', format($q$update storage.objects set created_at = created_at where name like %L$q$, :'l_goats' || '%'), 1);
select public.expect_rows('a seller cannot touch another seller''s photo', format($q$update storage.objects set created_at = created_at where name like %L$q$, :'l_sheep' || '%'), 0);
select public.expect_rows('a seller cannot delete another seller''s photo', format($q$delete from storage.objects where name like %L$q$, :'l_sheep' || '%'), 0);
reset role;

set role authenticated;
select set_config('request.jwt.claim.sub', :'b1', false);
select public.expect_error('a buyer cannot upload photos', format($q$insert into storage.objects (bucket_id, name) values ('listing-photos', %L || '/x.jpg')$q$, :'l_sheep'));
reset role;

select '--- signed-out visitor (new tables)' as section;
set role anon;
select public.expect_count('a visitor can view listing photos (2)', 'select count(*) from storage.objects', 2);
select public.expect_error('a visitor cannot upload photos', format($q$insert into storage.objects (bucket_id, name) values ('listing-photos', %L || '/x.jpg')$q$, :'l_sheep'));
select public.expect_error('a visitor cannot read orders', 'select count(*) from public.orders');
select public.expect_error('a visitor cannot read account records', 'select count(*) from public.account_moderation');
select public.expect_error('a visitor cannot read escrow holds', 'select count(*) from public.payment_holds');
select public.expect_error('a visitor cannot read sales', 'select count(*) from public.store_sales');
select public.expect_error('a visitor cannot read preferences', 'select count(*) from public.preferences');
reset role;
