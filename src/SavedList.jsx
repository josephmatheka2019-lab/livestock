import ListingSummary from './ListingSummary.jsx'

const GONE_TEXT = {
  sold: 'This listing has been sold, so it cannot be bought now. It will come back here if the seller puts it on sale again.',
  paused: 'The seller has paused this listing for now. It will come back here when they put it back on sale.',
  removed: 'The seller has taken this listing down.',
}

// The buyer's saved listings. One that has been sold or taken down stays on the list, named and
// marked "No longer available", so the buyer is told rather than left wondering where it went.
export default function SavedList({ items, display, seller, onView, onRemove, onBrowse, verified = false, pro = false }) {
  return (
    <section className="records" aria-labelledby="saved-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">KEPT FOR LATER</p>
          <h2 id="saved-heading" tabIndex={-1}>
            Saved listings <span className="count" aria-live="polite">{items.length}</span>
          </h2>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <h3>You have not saved any listings yet.</h3>
          <p>Choose <strong>Save</strong> on a listing you like and it will be kept here.</p>
          <button type="button" onClick={onBrowse}>Browse listings</button>
        </div>
      ) : (
        <ul className="record-list">
          {items.map(({ entry, record, state, available, label }) => (
            <li className={`record${available ? '' : ' record-gone'}`} key={entry.id}>
              {available ? (
                <ListingSummary record={record} buyerView seller={seller} display={display} verified={verified} pro={pro} />
              ) : (
                <div className="record-main">
                  <div className="record-copy">
                    <h3>
                      {label}
                      <span className="badge badge-sold">{state === 'paused' ? 'Paused' : 'No longer available'}</span>
                    </h3>
                    <p>{GONE_TEXT[state]}</p>
                  </div>
                </div>
              )}
              <div className="record-actions">
                {available && (
                  <button type="button" className="secondary" onClick={() => onView(entry.id)}>
                    View<span className="visually-hidden"> {label} listing</span>
                  </button>
                )}
                <button type="button" className="secondary" onClick={() => onRemove(entry.id)}>
                  Remove<span className="visually-hidden"> {label} listing from saved</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
