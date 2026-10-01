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

### Details, contact and calculator
- [ ] **View** opens the full details above the list.
- [ ] Before the buyer adds their details, the contact box shows the seller's name and place but **not** the
  phone number, with an **Add my details** button that opens the buyer form.
- [ ] After saving name and phone, the seller's number, a **Call** button and (where possible) a
  **WhatsApp** button appear. WhatsApp opens in a new tab with a ready message about that listing.
- [ ] A seller number without a country code on a listing not priced in KES shows only **Call**, with a
  short explanation.
- [ ] **How many do you want?** shows the price each and the total. **Whole lot** fills in the full stock and,
  if there is a bulk price, shows it and "You save …".
- [ ] `0`, `2.5`, empty and a number above the stock show a clear message, not a price.

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
- [ ] A seller's own list never shows buyer tools (Save, the calculator, the contact box, New tags).
- [ ] The buyer's name and phone appear only on the buyer page; the seller's profile is not changed by
  anything a buyer does.

## F. When things go wrong

- [ ] If the browser cannot save (storage blocked), the seller page shows a warning instead of crashing.
- [ ] If the saved data is damaged (for example edited by hand), the pages still open and start empty
  rather than showing a blank screen.
- [ ] At phone width (about 375 px) there is no sideways scrolling, buttons wrap, and the long forms stay usable.
- [ ] Every control can be reached and used with the keyboard, focus is always visible, and the delete
  confirmation traps focus until it is answered.
- [ ] A screen reader announces added, saved, removed, sold and paused changes.

## Expected behaviour that is not a failure

- Buyers on another device see nothing: the data lives in one browser until accounts are connected.
- The seller's phone number is hidden on screen until the buyer adds their details, but it is still in the
  browser's storage; real protection comes with accounts.
- Converted prices are approximate and change day to day.
- There is no sign-in yet. There are no payments and no messaging by design: buyers call or use WhatsApp,
  and cannot propose a price.
