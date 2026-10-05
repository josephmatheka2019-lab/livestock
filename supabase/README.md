# Supabase setup

The app uses [Supabase](https://supabase.com) for separate seller and buyer accounts, a
shared database and photo storage. This folder holds the database definition.

## One-time setup (about 10 minutes)

1. Create a free account at https://supabase.com and click **New project**.
   - Name it `livestock`, choose the region closest to your users, and set a strong
     database password. Save that password in a password manager; the app never needs it.
2. Open **SQL Editor > New query**, paste the whole of [schema.sql](schema.sql) and click **Run**.
   It should finish with "Success. No rows returned".
3. Open **Project Settings > API** and copy two values:
   - **Project URL** (looks like `https://abcdxyz.supabase.co`)
   - **anon public** key (a long text starting `eyJ...`)
4. In the project folder, copy `.env.example` to `.env.local` and paste the two values in.
   `.env.local` is ignored by git, so it is never uploaded.
5. After you create your first account, make it the administrator by running the
   one-line `update` shown at the very end of [schema.sql](schema.sql).

## Keys: what is safe to share

| Key | Safe to put in the app or share with me? |
|---|---|
| Project URL | Yes |
| `anon` public key | Yes. It is meant to be public. The rules in `schema.sql` are what protect the data. |
| `service_role` key | **No. Never.** It bypasses every rule. Do not paste it anywhere, and never commit it. This repository is public. |
| Database password | **No.** The app does not need it. |

## Sign-up settings

Under **Authentication > Providers > Email**, keep **Confirm email** on for real use.
While testing you may turn it off so test accounts work immediately.

## Testing the rules locally (optional)

`tests/rls.test.sql` checks 129 permission rules (for example "a buyer cannot edit a
listing", "a seller cannot mark themselves verified", "settings are private even from an
administrator" and "a visitor cannot read orders") against a throwaway local PostgreSQL
database, using `tests/local-shim.sql` to stand in for Supabase's login system. From this
folder, with any empty local database:

    psql -d <throwaway db> -f tests/local-shim.sql -f schema.sql -f tests/rls.test.sql

Every line should print PASS. Never run `local-shim.sql` in Supabase. The same rules are
re-checked against real accounts in slice 15.
