import { moneyLabel, moneyParts } from './currency.js'
import { animalLabel, bulkSaving, formatDay, isNewListing, paymentLabels, termTags } from './listing.js'

// The photo and text of one listing, shared by the seller's list, the buyer's list
// and the seller's "how buyers will see this" preview so they cannot drift apart.
// `buyerView` adds what a buyer browsing the list sees: who is selling, a New tag and the bulk saving.
export default function ListingSummary({ record, showStatus = false, display = null, buyerView = false, seller = null }) {
  const isSold = record.status === 'sold'
  const facts = [
    record.breed && `Breed: ${record.breed}`,
    record.age && `Age: ${record.age}`,
    record.weight && `Avg weight: ${record.weight} kg`,
  ].filter(Boolean)
  const tags = termTags(record)
  const payments = paymentLabels(record.paymentMethods)
  const price = moneyParts(record.price, record.currency, display)
  const bulk = moneyParts(record.bulkPrice, record.currency, display)
  const isNew = buyerView && isNewListing(record)
  const saving = buyerView ? bulkSaving(record) : 0
  const sellerName = buyerView ? seller?.businessName?.trim() : ''
  const original = (parts) => (parts.original ? ` (${parts.original})` : '')

  return (
    <div className="record-main">
      {record.photo && <img className="thumb" src={record.photo} alt={`Photo of ${animalLabel(record)} listing`} />}
      <div className="record-copy">
        <h3>
          {animalLabel(record)}
          {showStatus && <span className={`badge ${isSold ? 'badge-sold' : record.paused ? 'badge-paused' : 'badge-available'}`}>{isSold ? 'Sold' : record.paused ? 'Paused' : 'Available'}</span>}
          {isNew && <span className="badge badge-new">New</span>}
        </h3>
        {sellerName && (
          <p className="listing-seller">
            Sold by <strong>{sellerName}</strong>{seller.location ? ` · ${seller.location}` : ''}
          </p>
        )}
        {showStatus && isSold && record.soldAt && <p className="sold-date">Sold on {formatDay(record.soldAt)}</p>}
        {record.price && (
          <p className="listing-price">
            {price.text} <small>each{original(price)}</small>
          </p>
        )}
        {record.bulkPrice && <p className="listing-bulk">Bulk deal: {bulk.text} for all{original(bulk)}</p>}
        {saving > 0 && <p className="saving-line">Save {moneyLabel(saving, record.currency, display)} on the whole lot</p>}
        <p className="listing-meta">
          {[
            record.quantity && `Quantity: ${record.quantity}`,
            record.location && `Location: ${record.location}`,
          ].filter(Boolean).join(' · ')}
        </p>
        {facts.length > 0 && <p className="listing-facts">{facts.join(' · ')}</p>}
        {tags.length > 0 && (
          <ul className="tags" aria-label="Terms">
            {tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        )}
        {payments.length > 0 && <p className="listing-payments">Accepts: {payments.join(', ')}</p>}
        {record.description && <p>{record.description}</p>}
      </div>
    </div>
  )
}
