# Plan: earning from the marketplace

> **Status (demo build):** the three *first* extras — **Boosted listings**, **Seller Pro** and the
> **Verified seller badge** — are now built as demos (`src/store.js`, `src/SellerStore.jsx`): prices
> are placeholders, payments record a sale in the admin's ledger but take no money, and approval of
> verification sits with the admin. The commission on in-app payments still waits on real payment
> rails (Phase H).

This lists the ways the site can earn money without pushing a seller or a buyer away. Every
option below is chosen because it is something the user *wants* to pay for (more buyers, more
trust, less hassle), not a toll on using the site. Nothing here is built yet; it is a decision
document to review before any of it is coded.

The order flow built in `src/orders.js` is the foundation: every order that reaches
`completed` is a billable event, and the stock tally already behaves like a real ledger.

## Decisions

| Decision | Choice |
|---|---|
| Who pays | **Sellers only, and only for extras they choose.** Buyers never pay anything, ever. |
| What is free forever | Creating an account, unlimited listings, all orders, contact, search and filters. The working marketplace stays complete at no cost. |
| First revenue | **Boosted (featured) listings** — a seller pays to appear first in buyer results |
| Second revenue | **Seller Pro subscription** — a monthly plan with extras that matter to a busy seller |
| Later revenue | **Small commission on orders paid in the app** (M-Pesa/card), only once real payments exist |
| Also later | **Delivery coordination fee** and **verified-seller badge** — both optional, both worth their price |
| Prices | To be decided by the owner before building; shown in KES |

## The positive options (what we build)

### 1. Boosted listings — first slice
A seller pays once per listing to appear at the top of buyer results, with a small **Boosted**
badge. Buyers browsing normally are unaffected otherwise; results only gain one promoted card
at the top, clearly labelled so it never looks like a trick.

- Free listings stay unlimited — a boost buys *position*, not the right to list.
- The badge and position expire after 7 days and the listing returns to its normal place.
- Payment to start: M-Pesa till number, activated by hand (no payment code needed yet).

### 2. Seller Pro — monthly plan
A monthly subscription for sellers with real volume. Ideas for what it includes:
- More photos per listing.
- A weekly summary: views, saves and orders on their listings.
- The **Verified seller** badge once their business details are checked (see 5).

### 3. Commission on in-app payments — only after real payments exist
A small percentage (decided by the owner) taken when an order is **paid in the app** by M-Pesa
or card. `completeOrder` in `src/orders.js` becomes the billing event, so the accounting is
already in place.

- The buyer's price never changes: the fee is absorbed as the cost of using the payment rails,
  or shown to the seller as what the platform costs — decided with the owner before launch.
- **Cash orders carry no commission**, because the platform cannot see them and pretending
  otherwise would push sellers back to arranging deals off-app.

### 4. Delivery coordination — optional
The order form already asks for a delivery address. When the seller offers delivery, the
platform can arrange a vetted livestock transporter for a small fee on top. Both sides opt in;
no one is forced to use it.

### 5. Verified seller badge — optional
A one-off check of the seller's business details and phone number, after which their card
carries a **Verified** badge. Buyers trust it, so verified sellers sell better — the seller
wants this badge, it is not a tax.

## Later, once there is real traffic

- **Advertising** from adjacent businesses (vets, feed suppliers, transport) — sold as clearly
  labelled sponsored cards in the buyer feed, kept to one per screenful.
- **A regional price index** built from completed orders, sold as a subscription to processors,
  NGOs and county agriculture offices. A privacy note must come first.

## Omitted on purpose (would drive sellers or buyers away)

Recorded here so they are not proposed again later:

- **Charging buyers anything** — listing-to-order friction kills the side we need most.
- **Pay-per-listing fees** — sellers would list less; there is no leverage for it yet.
- **Commission on cash orders** — unenforceable; would push deals off-app entirely.
- **Intrusive or banner ads on the buyer page** — the clean, fast experience is the
  differentiator against classifieds sites and WhatsApp groups.
- **Charging for the core flow** (placing an order, seeing contact details once profiles
  exist) — the marketplace must work completely for free.

## Slices

### Phase F: first revenue (after accounts exist)
1. **Boost a listing.** Button on the seller's listing card, a payment step (M-Pesa till),
   a `boosted` flag with an expiry, and boosted-first sorting on the buyer page.
2. **Boost expiry.** Expired boosts drop back on their own; the seller is told when theirs ends.
3. **README and acceptance checks** updated for the boost flow.

### Phase G: subscription
4. **Seller Pro page.** What it includes, the price, how to pay, how to cancel.
5. **Pro extras.** Weekly summary of views, saves and orders; extra photo slots.

### Phase H: payments (depends on M-Pesa integration)
6. **In-app payment.** The demo pay step becomes a real M-Pesa/card charge.
7. **Commission ledger.** Each completed in-app order records its fee; the seller sees
   what was taken and why.

### Phase I: trust and delivery
8. **Verified badge.** A check the seller requests, the owner approves, the badge displays.
9. **Delivery coordination.** Offer a transporter when both sides want delivery.

## What only the owner can do
- Decide the prices for boosts, Pro and commission before each slice is built.
- Choose the M-Pesa till number and any sponsored-card partners.
- Keep the "Omitted on purpose" list: proposals that charge for the core experience are
  turned down here, not in code.
