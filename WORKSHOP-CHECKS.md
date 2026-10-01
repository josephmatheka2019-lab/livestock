# Acceptance checks

Run these by hand in the browser after any change and tick each one off. Each check says what to do and
what you should see. Use a fresh private window (or clear the site's data) when a check says "with no saved
data". To reach a page directly, add `#/seller` or `#/buyer` to the address.

Two things to know first:
- Everything is stored in one browser, so the seller and buyer pages both read the same data.
- Checks marked *(needs internet)* use the live exchange-rate service.

## A. The five acceptance criteria from the project plan

1. - [ ] **Create.** As a seller with a completed profile, choose **+ Add a listing**, fill in the form (animal,
   quantity, currency, price, location, at least one payment method) and choose **Add listing**. The form
   closes and the listing appears at the top of the list straight away.
2. - [ ] **View.** Choose **View** on a listing. Every detail is shown: animal, breed, age, weight, quantity,
   price, total, bulk price, currency, payment, location, availability and date listed.
3. - [ ] **Edit.** Choose **Edit**, change something, choose **Save changes**. The list and the details show
   the new value.
4. - [ ] **Delete.** Choose **Delete**, then **Yes, delete**. The listing is gone from the list and, on the
   buyer page, from the results.
5. - [ ] **Keep and filter.** Refresh the page. The listings are still there. On the seller page, open
   **Filter listings** and filter by animal type or place; the list narrows and **Clear filters** restores it.

## B. First screen and header

- [ ] Opening the app shows the logo, a headline, a countryside picture and two choices: **I am a seller**
  and **I am a buyer**.
- [ ] The seller, buyer and sign-in pages share a header with the logo; on the seller and buyer pages it also
  shows which side you are on and a **Switch role** link.
- [ ] **Continue as a seller** opens the seller page and **Continue as a buyer** opens the buyer page,
  with no sign-in.
- [ ] **Switch role** (or the logo) on either page returns to the first screen.
- [ ] A made-up address such as `#/nonsense` shows the first screen.

## C. Seller

### Profile
- [ ] With no saved data, the seller page shows **Set up your seller profile** and, instead of the listing
  form, a message asking you to finish the profile first.
- [ ] **Save profile** with nothing entered shows errors for name and phone and puts the cursor in the first.
- [ ] A phone number like `abc` or `12345` is rejected; `+254 712 345 678` and `0712 345 678` are accepted.
- [ ] After saving, the profile shrinks to a one-line bar (business name, phone, place) and the
  **+ Add a listing** button appears.
- [ ] **Edit profile** opens the form filled in; **Cancel** keeps the old details.

### Listing form
- [ ] The page opens on the listings, with no form showing. **+ Add a listing** opens the form and puts the
  cursor in the first field; **Cancel** closes it without saving; saving closes it and moves focus to the list.
- [ ] Submitting an empty form (the form stays open) shows an error under each required field and moves the cursor to the first one.
- [ ] Quantity `0` and `2.5` are rejected; a price with more than three decimals is rejected; a bulk price,
  if given, must be a valid amount.
- [ ] Choosing **Other** as the animal shows a required **Which animal?** box.
- [ ] Submitting with no payment method ticked is rejected.
- [ ] A file that is not an image is rejected in the photo box; a real photo shows a preview and can be removed.
- [ ] The location box starts filled from the profile and can be changed. After adding a listing it returns
  to the profile's location.
- [ ] **Preview how buyers will see this** shows the listing as a buyer's card, including the New tag,
  "Sold by", and the bulk saving when the bulk price is lower than paying per animal.

### Managing listings
- [ ] With no listings, the list area says **No livestock listings available yet.** and **Add Your First
  Listing** opens the form with the cursor in the first field.
- [ ] **Delete** asks "Delete this listing?". **No, keep it** and the Escape key keep the listing;
  **Yes, delete** removes it.
- [ ] **Mark as sold** shows a **Sold** badge and "Sold on <date>"; **Mark available** clears it.
  The date also appears as **Date sold** in the details.
- [ ] **Pause** shows a **Paused** badge and the button becomes **Resume**; a sold listing has no Pause button.
  Marking a paused listing sold ends the pause.
- [ ] The summary row above the list shows the right counts (Available, Paused when any, Sold) and the value
  of stock per currency; paused stock is left out of the value of what is for sale.
- [ ] **Filter listings** opens the filters; its Availability box has **All, Available, Sold, Paused** and each
  shows the right listings. Closing the panel with a filter on shows "Filter listings (on)".
- [ ] **Sort by** offers Newest, Animal type A–Z and Z–A, and **Recently sold**.

### Orders from buyers
- [ ] The seller page has **Listings (n)** and **Orders (n, m new)** tabs; a new order shows as new.
- [ ] **Accept** asks first and, once accepted, the listing's quantity drops by the ordered amount (a
  listing emptied this way is marked **Sold**). The buyer's order shows **Accepted**.
- [ ] **Decline** asks first and the stock is untouched; the buyer sees **Declined**.
- [ ] When the seller accepts an M-Pesa or card order, the buyer's **My orders** opens
  **"The seller accepted your order. Proceed with payment?"** with **Yes, pay now (demo)** and
  **No, not now**. **No** leaves the order accepted, with **Pay now (demo)** still on the card, and the
  question is not repeated on a reload of the same tab.
- [ ] A **cash** order never asks: it simply shows "Accepted: pay the seller in cash on delivery."
- [ ] A **declined** order shows a Declined badge and "The seller declined this order. Nothing has been
  charged."
- [ ] **Mark completed** is offered to the seller only when the order is paid (online) or accepted (cash).
- [ ] Cancelling an accepted order asks first and returns the held animals to the listing's quantity.
- [ ] After **Mark completed**, the tally stays correct: the listing keeps the reduced quantity (the
  animals were deducted when the order was accepted, so completing never deducts a second time), and
  the summary's "Value of available stock" matches quantity × price of what is left.

## D. Buyer

### Browsing
- [ ] Only listings that are on sale appear; sold and paused ones do not.
- [ ] Each card shows "Sold by <business> · <place>", a **New** tag on listings under a week old, and
  "Save … on the whole lot" only when the bulk price really is cheaper.
- [ ] There are no Edit, Delete, Mark as sold or Pause buttons and no listing form.

### Search and filters
- [ ] The **Search** box finds a listing by breed, animal, description or place, ignores capitals, matches part
  of a word, and needs every word you type to match.
- [ ] Searching for something that does not exist shows **No listings match these filters** with a
  **Clear filters** button that restores everything.
- [ ] **More filters** shows payment method, minimum animals, price range and the delivery / vaccinated /
  health certificate / negotiable ticks. Each narrows the list correctly and they combine.
- [ ] Closing the panel with a filter on shows "More filters (1 on)".
- [ ] The price boxes are switched off, with an explanation, until a currency is chosen under
  **Show prices in**.

### Currency *(needs internet)*
- [ ] Choosing **USD** turns prices into `≈ $… (KES …)`, with the seller's original price in brackets, and a
  note gives the rate date and says the figures are approximate.
- [ ] KWD shows three decimals; **More currencies…** offers every other currency.
- [ ] With a currency chosen, the price range works in that currency, a backwards range shows a warning, and
  **Price: low to high / high to low** appear in the sort list.
- [ ] Changing currency clears the price limits. Going back to **Seller's currency** removes the price sorts.
- [ ] With the internet switched off and no saved rates, a message says so and prices stay in the sellers' currencies.

### Details, ordering and contact
- [ ] **View** opens the full details above the list, with the **Order this** form and, below it,
  **Contact stays on the platform**.
- [ ] The contact box shows the seller's business name and place but **never a phone number**, and
  says questions go in the order's note. There are no Call or WhatsApp buttons anywhere.
- [ ] The order form shows an **Add my details** invitation instead of a **Place order** button until
  the buyer has saved their name and phone.
- [ ] On an order, the seller sees the buyer's **name only** (no phone number) and the buyer sees the
  seller's **business name only** — check both sides of the same order.
- [ ] Entering a quantity shows the price each and the order total. **Whole lot** fills in the full stock and,
  if there is a bulk price, shows it and "You save …".
- [ ] `0`, `2.5`, empty and a number above the stock show a clear message, not a price.
- [ ] **Place order** without a quantity, payment method or (when delivery is chosen) address shows the
  error by the field and puts the cursor there; nothing is ordered.

### Placing an order
- [ ] **Place order** with everything filled in opens a **Place this order?** confirmation listing the
  quantity, total, payment method, delivery address and note. **No, go back** (and Escape) close it and
  change nothing; focus starts on the safe answer.
- [ ] **Yes, place order** closes the form, announces the order, and the listing now shows **Your order**
  with its status and a **View my orders** button instead of a second form.
- [ ] The **My orders (n)** tab lists the order newest first with a **Placed** badge, a reference, the
  total, and "Waiting for the seller to accept or decline."
- [ ] **Cancel order** asks first; **No, keep it** keeps it, **Yes, cancel order** marks it **Cancelled**.
- [ ] Orders survive a refresh, and the tab counts update.

### Saved listings
- [ ] **Save** turns into **Remove saved**; the **Saved (n)** count updates; the same button is in the details.
- [ ] The **Saved** tab lists them newest first as full cards; with none saved it says so and offers
  **Browse listings**.
- [ ] A saved listing that the seller marks sold, pauses, or deletes stays on the Saved tab marked
  **No longer available** (or **Paused**) with only a **Remove** button. If the seller puts it back on sale it
  becomes a normal card again.
- [ ] Saved listings are still there after a refresh.

## E. Both sides together

- [ ] A listing marked sold or paused by the seller disappears from the buyer's Browse page.
- [ ] A seller's own list never shows buyer tools (Save, the order form, the contact box, New tags).
- [ ] The buyer's name and phone appear only on the buyer page; the seller's profile is not changed by
  anything a buyer does.

## E1. The store: verification, boosts, Pro

- [ ] The seller's **Grow your sales** panel lists the three extras with their demo prices; buyers never
  see a price anywhere.
- [ ] **Get verified** asks first, records a demo sale, and shows **Pending review**. Until the seller
  profile is finished it refuses with a clear message.
- [ ] The admin **Approve verification** → the **Verified** badge appears on the seller's cards on the
  buyer page (browse and saved); **Reject** returns to **Not verified** and the seller can ask again.
- [ ] **Boost** on a listing card asks first, records a demo sale, then shows **Boosted until <date>**
  and the **Boosted** badge. In the buyer's browse list that listing now leads the results; an expired
  boost drops back on its own with no cleanup needed.
- [ ] **Go Pro** asks first, records a demo sale, shows **Active until <date>**, the **Pro** badge on
  listings, and an order summary (orders received, completed value) in the panel. **End plan** asks
  first and removes it.
- [ ] All three refuse to run for a suspended or terminated seller, with the reason on screen.

## E2. Admin (#/admin)

- [ ] The admin page has its **own look**, clearly not the trader pages: a dark masthead behind the
  header and title, a cool grey-lavender background, a dark KPI panel with white figures, purple
  accent edges on the cards and uppercase section headings. The seller and buyer pages are unchanged.
- [ ] Opening `#/admin` shows **Admin sign-in**, not the dashboard, and the cursor is in the email
  field. The demo credentials are printed on the screen.
- [ ] A wrong email or password shows an error under the fields and clears when you retype; the
  correct credentials sign in. The email field ignores capitals and surrounding spaces.
- [ ] The dashboard shows **Signed in as … · demo session, this tab only** with a **Sign out**
  button; signing out returns to the sign-in screen, and a refresh keeps you signed in (closing
  the tab signs you out).
- [ ] The stats row shows the order count (open and completed), the value of completed orders, the
  **2% platform fee**, and what is **held in escrow** — all per currency, never mixed.
- [ ] Each transaction card shows its **Platform fee** (M-Pesa/card orders) or **None (cash)**.
- [ ] **Hold payment** (on a paid order) asks first; after holding, the card says **Held by the
  platform**, the escrow stat rises, and the seller's **Mark completed** fails with a clear message.
- [ ] **Release payment** asks first; the seller can then complete the order as normal.
- [ ] **Suspend** asks first: the seller/buyer page shows a banner, the **+ Add a listing** button
  disappears, order actions do nothing, and the buyer's **Place order** / **Pay now** buttons are
  replaced by the reason. **Reinstate** restores everything.
- [ ] **Terminate** warns it cannot be undone; afterwards **Reinstate** is not offered and every
  status change on that account is refused.
- [ ] The **Store revenue** stat totals the extras sold (per currency) with per-kind counts; the
  **Store sales** list shows each sale with its fee and date.
- [ ] A seller's verification request makes **Approve verification** / **Reject** appear on their account
  card; approving shows the **Verified** badge on their listings to buyers, rejecting lets them ask again.
- [ ] An active Pro plan shows its end date with an **End Pro plan** button that removes the badge.
- [ ] **Boosted listings** lists every live boost with its expiry and a **Remove boost** button (asks
  first); removing it drops the listing back to its normal place in buyer results.
- [ ] Every admin action is confirmed first (**No, go back** and Escape change nothing), and the
  changes survive a refresh.

## F. When things go wrong

- [ ] If the browser cannot save (storage blocked), the seller page shows a warning instead of crashing.
- [ ] If the saved data is damaged (for example edited by hand), the pages still open and start empty
  rather than showing a blank screen.
- [ ] At phone width (about 375 px) there is no sideways scrolling, buttons wrap, and the long forms stay usable.
- [ ] Every control can be reached and used with the keyboard, focus is always visible, and the delete
  confirmation traps focus until it is answered.
- [ ] A screen reader announces added, saved, removed, sold, paused and ordered changes.

## Expected behaviour that is not a failure

- Buyers on another device see nothing: the data lives in one browser until accounts are connected.
- Phone numbers never appear on screen on either side, but they are still in the browser's storage;
  real protection comes with accounts.
- Converted prices are approximate and change day to day.
- There is no sign-in yet. Payments in the app are a demonstration and there is no messaging by design:
  buying happens by placing an order, questions go in the order's note, and buyers cannot propose a
  price.
- The admin sign-in is a demonstration: the credentials are on the screen and the check runs in the
  browser, so it stops casual visitors only. Real admin accounts come with the backend work.
