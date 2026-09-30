# Implementation plan: Local Bulk Livestock Marketplace

The starter already handles create, edit, delete, the empty state, the storage warning and localStorage in `src/App.jsx` and `src/storage.js`. Most slices therefore reshape existing code rather than build from scratch. Each slice leaves the app working and is one commit, so each change can be tested and pushed before starting the next.

## Settle this first: sellers vs buyers

The project document contradicts itself on this. The "Scope risk" line says to keep it a **single-user listing manager with no buyers**. The later sections add seller profiles, buyer profiles and favourites.

localStorage only exists in one browser on one device. A buyer on another phone could never see a seller's listings, so a real two-sided marketplace isn't possible without a backend, and a backend is on the "will not" list.

**Recommendation:** build the single-user listing manager for the MVP, which covers acceptance criteria 1-5 and the Must/Should rows in the task table. Treat the seller/buyer split as future work and say so in the project document. The plan below follows that.

## Slice 0: Write the acceptance checks first
- Replace the starter checks in `WORKSHOP-CHECKS.md` with acceptance criteria 1-5 and the validation rules. Word them as steps to click through in the browser.
- **Done when:** every later slice can be marked pass or fail against this file.

## Slice 1: Rename the app and switch to the listing fields
- Change the header, intro and footer text to "Local Livestock Marketplace".
- Replace `title`/`details` with the listing fields:
  - `animalType`: a dropdown of cattle, goats, sheep, poultry, pigs and other
  - `quantity`
  - `price`
  - `location`
  - `description`
  - `createdAt`: already recorded by the starter
- Change the storage key in `src/storage.js` to `livestock-listings`, so old test records with the previous shape don't break the list.
- Keep the create/edit/delete logic and only change the fields it handles. For now, keep the starter's required-title check but apply it to animal type. Full validation comes in slice 2.
- **Done when:** a listing can be created, shown in the list with its type, quantity, price and location, edited and deleted, and it's still there after a refresh. This covers criteria 1, 3, 4 and the first half of 5.

## Slice 2: Validate the form
- Move the rules into a `validateListing(form)` function in a new `src/listing.js`:
  - animal type is selected
  - quantity is a whole number greater than 0
  - price is a valid number of 0 or more
  - location isn't empty
  - description is at most 500 characters
- Show an error under each invalid field and focus the first one. Nothing is saved while any field is invalid.
- **Done when:** each invalid case shows its own message and adds nothing to the list. This is the "Should: Form validation" row.

## Slice 3: Split App.jsx into components (no behaviour change)
- Create `ListingForm.jsx` and `ListingList.jsx`. `App.jsx` keeps the state and the handlers.
- Do this before the detail view and filters are added, while the file is still small.
- **Done when:** every check from slices 1-2 still passes and the page looks the same.

## Slice 4: Add availability and "Mark as sold"
- Add a `status` field with the values `available` and `sold`, defaulting to available. Add it to the form and to validation.
- Show a status badge on each list item, and add a button that switches between "Mark as sold" and "Mark available".
- The task table rates this as a Could. Criterion 2 and the validation list both mention availability, though, so treat it as a **Must**.
- **Done when:** a listing can be switched to Sold and back, and the change survives a refresh.

## Slice 5: Add a listing detail view (criterion 2)
- Clicking a listing opens a `ListingDetails` panel. It shows every field, the date created in a readable format, and the total value (quantity x price). It has Edit, Delete and Close buttons.
- Use a panel or expanding card rather than separate pages. That avoids adding a router.
- **Done when:** every field of the selected listing is visible, and deleting from the panel closes it.

## Slice 6: Rewrite the empty state
- Change the message to "No livestock listings available yet." and add an **Add Your First Listing** button that moves focus to the form's first field.
- **Done when:** the message and button appear with no listings, and the empty state comes back after deleting the last listing.

## Slice 7: Filter by animal type, location and status (second half of criterion 5)
- Add a filter bar with:
  - an animal type dropdown
  - a location text box that matches part of the name and ignores case
  - a status dropdown
  - a Clear filters button
- Show a **"No listings match these filters"** message that's separate from the "no listings yet" state. The count should read "3 of 8 listings".
- **Done when:** filtering narrows the list correctly, clearing restores it, and a deleted listing disappears from filtered results too (criterion 4).

## Slice 8: Responsive and accessibility pass
- Check the layout at phone width with the filter bar, the detail panel and the longer form. Every input needs a visible label and every error needs `aria-describedby`.
- Check what happens when storage is unavailable, using a private window or blocked site data.
- **Done when:** the starter's narrow-width and storage-warning checks still pass with the new UI.

## Stretch, after the MVP works
- **Sort** by price, quantity or newest. This is a single dropdown and easy to add.
- **Images:** be careful here. localStorage holds only about 5 MB in total, so a few phone photos would fill it. If images are added, shrink them to small thumbnails and show a clear error when storage is full.
- **Seller/buyer roles:** this needs a backend, so it's a separate phase.

## Decisions still to make
1. **Price per animal or total price?** Recommended: store the price per animal and work out the total. It keeps filtering and sorting simple.
2. **Currency:** which currency and symbol should the app show?
3. **Animal types:** confirm the dropdown list and whether to include "Other".
4. **Seller/buyer scope:** confirm it's future work, as recommended above.
