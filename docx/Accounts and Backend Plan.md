# Plan: separate seller and buyer accounts on separate devices

This replaces the earlier "sellers vs buyers" notes. Sellers and buyers each create their
own account and log in on their own devices. That needs a real backend: accounts, a shared
database, and rules enforced by the server. Browser storage cannot do it.

## Decisions

| Decision | Choice |
|---|---|
| Backend | Supabase (accounts, database, photo storage, access rules) |
| Login method | Email and password |
| Seller and buyer accounts | Separate accounts with separate sign-up pages. One email cannot be both. |
| Hosting | Vercel or Netlify (free), so the app opens on any device |

## Who can do what (enforced by the database)

| Action | Seller | Buyer |
|---|---|---|
| Sign up and log in | Seller page | Buyer page |
| Create, edit, delete, mark sold | Own listings only | Never |
| See listings | Own listings, including sold | Available listings from all sellers |
| See a seller's phone | It is their own | Only when logged in with a completed profile |
| Save favourites | No | Yes, and they follow the buyer across devices |

An account's type is fixed at sign-up and cannot be changed by the user. Anything unclear
becomes a buyer, the least-privileged type.

## Slices

### Phase A: setup
1. **Database and rules.** DONE (needs your Supabase project to go live). See `supabase/schema.sql`.
   Tested locally: 45 permission checks pass, 0 fail (`supabase/tests/rls.test.sql`).
2. **Connect the app.** Add the Supabase connection; keys live in a git-ignored `.env.local`.
3. **Put the app online.** Deploy to a free host so it opens on any device.

### Phase B: logins
4. **Seller sign up and login.** Own page, email and password, log out, password reset.
5. **Buyer sign up and login.** A separate page with the same features.
6. **Role guards.** The role comes from the server. The wrong side is turned away with a clear
   message. Sessions survive a refresh.
7. **Profiles.** Seller: business name, phone, location. Buyer: name and phone.

### Phase C: seller side
8. **Listings in the database.** The seller page moves off browser storage. Each listing belongs
   to its seller. A button imports listings saved locally.
9. **Photos in storage.** Photos go to online storage, removing the 5 MB browser limit.
10. **Seller summary.** Counts and total value. Sold listings disappear from the buyer side.

### Phase D: buyer side
11. **Browse.** A read-only page of available listings from all sellers.
12. **Search and filters.** Search text, animal type, location, price range, payment method,
    delivery, negotiable, vaccinated; sort by price and newest.
13. **Details and contact.** Full details; the seller's phone is visible only to logged-in buyers,
    with Call and WhatsApp buttons. The database enforces this, not just the page.
14. **Favourites.** Save and remove, with a Saved page. A saved listing that sells shows
    "No longer available".

### Phase E: safety and finish
15. **Security tests with real accounts.** One seller and one buyer prove the rules on the live project.
16. **Loading, error and offline states**, plus a phone-width and accessibility pass.
17. **Acceptance checks per role**, updated README, a privacy note and a way to delete an account
    (the app stores phone numbers; check local data-protection rules before real use).

Later, only if wanted: in-app messaging, M-Pesa payments, email verification, phone-number
login, an admin who can remove bad listings.

## Limits kept on purpose
- Payment methods are information only; the app takes no payments.
- Prices are not converted between currencies.
- Buyers cannot reserve an animal, only contact the seller.

## What only the owner can do
- Create the free Supabase project and run `supabase/schema.sql` (steps in `supabase/README.md`).
- Create the free hosting account.
- Never share the `service_role` key or the database password. The repository is public.
