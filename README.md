# Local Livestock Marketplace

A small web app where farmers list livestock for bulk sale and buyers browse, compare and place orders.
Built with React and Vite. It began as the Vibe Coding SDLC workshop starter.

When you open it, it asks whether you want to continue as a **seller** or a **buyer**, and each
has its own page.

## What it does

**Sellers**
- Keep a seller profile (business name, phone, location). It is needed before posting.
- Add, edit and delete listings: animal, quantity, currency, price per animal, an optional bulk price
  for the whole lot, breed, age, weight, vaccinated / health certificate / negotiable / delivery,
  accepted payment methods (M-Pesa, credit card, cash), a description and a photo.
- See how a listing will look to buyers before posting it.
- Mark listings sold (the sale date is recorded) or available again, and pause a listing to hide it
  from buyers without deleting it.
- See an at-a-glance summary, filter by animal, place or availability, and sort.
- Review orders from buyers: accept (which holds the stock), decline, cancel, or mark one completed.

**Buyers**
- Browse the listings that are on sale (sold and paused ones are hidden), each showing who is selling,
  a New tag for the first week, and the saving on a bulk deal.
- Search by any word and filter by animal, place, payment method, minimum animals, price range, and
  delivery / vaccinated / health certificate / negotiable.
- View all prices in another currency (KES, USD, EUR, GBP, KWD and every other currency), converted with
  daily exchange rates. Converted prices are marked as approximate.
- Open a listing to see the full details, choose how many you want and how to pay, then place the order.
  A confirmation asks **Place this order?** before it goes to the seller, who accepts or declines it.
  You see the outcome under **My orders**, and when an M-Pesa or card order is accepted you are asked
  whether to pay then (a demonstration; cash orders skip that and are paid on delivery). You can also
  see the seller's phone with Call and WhatsApp buttons once you have added your own name and number.
- Save listings for later. A saved listing that is sold, paused or deleted stays on the list, marked
  as no longer available.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- A modern browser

## Run it

    npm install
    npm run dev

Open the address shown in the terminal and keep the terminal running.

To build and preview a production version:

    npm run build
    npm run preview

## How the pages are reached

| Address | Page |
|---|---|
| `#/` | The first screen: continue as a seller or a buyer |
| `#/seller` | The seller page |
| `#/buyer` | The buyer page |
| `#/seller/login`, `#/buyer/login` | Sign-in and sign-up pages. Built, but not linked yet and switched off until accounts are connected |

Any other address shows the first screen.

## Design, and the previous version

The look was refreshed to make the pages shorter and warmer: a header with a logo on every page, a landing page
with a picture, one-line bars for the profile and the currency choice, listing cards that lead with the photo and
the price, a listing form that opens on request, and a warmer palette. The type is Figtree, served from the
app itself so nothing is fetched from outside.

The design from before the refresh is kept so the two can be compared. With the app running, open `/previous/`
(for example http://localhost:5173/previous/). It is a built copy of git tag `design-v1`, lives in
`public/previous`, and reads the same browser data as the new design, so both show the same listings. When you no
longer need it, delete `public/previous` and the small `previousDesign` plugin in `vite.config.js`.

## Important limits (read before relying on it)

- **Everything is stored in one browser.** Listings, profiles, saved listings and choices are kept in the
  browser's local storage. A buyer on another phone or computer cannot see a seller's listings, and
  clearing the site's data deletes them. The app shows a warning if the browser cannot save.
- **There are no accounts yet.** Sellers and buyers are not signed in, so the roles are a convenience, not
  security. The seller's phone number is hidden from a buyer who has not added their details, but it is
  still in the browser's storage. The database rules that enforce this properly are written (see below)
  but not connected.
- **No real payments.** Payment methods are recorded on the order, and paying in the app is a
  demonstration: the app takes no money. Cash is paid to the seller on delivery.
- **Converted prices are approximate.** They use a free daily rates service, fetched only when a buyer
  asks for a converted currency. A buyer pays in the seller's own currency.
- **No messaging, by design.** Buying happens by placing an order, not by chatting: there is no enquiry
  form or inbox, and buyers cannot propose a price — the seller's price is the price. Buyers can still
  call or WhatsApp the seller with questions.
- Photos are shrunk to small thumbnails so they fit in the browser's roughly 5 MB of storage.

## Project map

- `src/App.jsx`, `src/router.js`: which page to show for an address
- `src/Landing.jsx`, `HeroArt.jsx`, `SiteHeader.jsx`: the seller or buyer choice, its picture, and the header shared by every page
- `src/SellerPage.jsx` and `SellerProfile`, `ListingForm`, `ListingPreview`, `SellerSummary`, `ConfirmDelete`: the seller side
- `src/BuyerPage.jsx` and `BuyerProfile`, `BuyerFilters`, `CurrencyPicker`, `OrderForm`, `SellerContact`, `SavedList`, `SaveButton`, `MyOrders`: the buyer side
- `src/orders.js`, `OrderCard.jsx`, `OrdersPanel.jsx`, `ConfirmDialog.jsx`: order rules and the yes/no confirmations, shared by both sides
- `src/ListingList.jsx`, `ListingSummary.jsx`, `ListingDetails.jsx`: shared by both sides (`ListingFilters.jsx` is the seller's filter bar)
- `src/listing.js`: listing rules (validation, filtering, sorting, sold / paused state, quotes)
- `src/currency.js`, `src/rates.js`: currencies, formatting and exchange rates
- `src/contact.js`: Call and WhatsApp links
- `src/saved.js`, `sellerProfile.js`, `buyerProfile.js`, `profileRules.js`, `photo.js`: smaller helpers
- `src/storage.js`: safe read and write of everything kept in the browser
- `src/auth.js`, `AuthPage.jsx`, `authValidation.js`: the sign-in pages, waiting for accounts
- `supabase/`: the database for real accounts (see below)
- `docx/`: the project plan and the implementation plans (`Accounts and Backend Plan.md`, `Monetisation Plan.md`)
- `WORKSHOP-CHECKS.md`: the acceptance checks to run by hand

## What is kept in the browser

| Storage key | What it holds |
|---|---|
| `livestock-listings` | The seller's listings |
| `livestock-seller-profile` | The seller profile |
| `livestock-buyer-profile` | The buyer's name, phone and location |
| `livestock-saved-listings` | The buyer's saved listings |
| `livestock-orders` | The orders buyers have placed, and their status |
| `livestock-display-currency` | The currency the buyer chose to see prices in |
| `livestock-exchange-rates` | Today's exchange rates, kept for 12 hours |

## Real accounts (not connected yet)

`supabase/` holds the database definition for separate seller and buyer accounts on different devices,
with the access rules enforced by the database (a buyer cannot change a listing, a seller can only change
their own, and so on). `supabase/tests/rls.test.sql` checks 45 of those rules against a throwaway local
PostgreSQL. To switch accounts on, follow `supabase/README.md`, then connect the app. Keep secret keys out
of the repository: `.env.local` is ignored by git, and only the public key and project address belong in
the app. The plan is in `docx/Accounts and Backend Plan.md`.

## Testing

There is no automated test suite for the app yet. Run the checks in `WORKSHOP-CHECKS.md` by hand after
any change, and run `npm run build` to catch errors. The database rules have their own tests, described above.
