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
