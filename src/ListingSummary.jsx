import { formatMoney } from './currency.js'
import { animalLabel, paymentLabels, termTags } from './listing.js'

// The photo and text of one listing, shared by the seller's list, the buyer's list
// and the seller's "how buyers will see this" preview so they cannot drift apart.
export default function ListingSummary({ record, showStatus = false }) {
  const isSold = record.status === 'sold'
  const facts = [
    record.breed && `Breed: ${record.breed}`,
    record.age && `Age: ${record.age}`,
    record.weight && `Avg weight: ${record.weight} kg`,
  ].filter(Boolean)
  const tags = termTags(record)
  const payments = paymentLabels(record.paymentMethods)

  return (
    <div className="record-main">
      {record.photo && <img className="thumb" src={record.photo} alt={`Photo of ${animalLabel(record)} listing`} />}
      <div className="record-copy">
        <h3>
          {animalLabel(record)}
          {showStatus && <span className={`badge ${isSold ? 'badge-sold' : 'badge-available'}`}>{isSold ? 'Sold' : 'Available'}</span>}
        </h3>
        <p className="listing-meta">
          {[
            record.quantity && `Quantity: ${record.quantity}`,
            record.price && `${formatMoney(record.price, record.currency)} each`,
            record.bulkPrice && `Bulk deal: ${formatMoney(record.bulkPrice, record.currency)} for all`,
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
