import { useEffect, useRef } from 'react'
import { describeCurrency, moneyLabel } from './currency.js'
import { animalLabel, bulkSaving, formatDay, paymentLabels } from './listing.js'

export default function ListingDetails({ record, onEdit, onDelete, onClose, readOnly = false, display = null }) {
  const headingRef = useRef(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [record.id])

  const quantity = Number(record.quantity)
  const price = Number(record.price)
  const hasTotal = record.quantity !== '' && record.price !== '' && !Number.isNaN(quantity) && !Number.isNaN(price)
  const isSold = record.status === 'sold'
  const saving = bulkSaving(record)
  const payments = paymentLabels(record.paymentMethods)

  return (
    <section className="panel details" aria-labelledby="details-heading">
      <p className="eyebrow">LISTING DETAILS</p>
      <h2 id="details-heading" ref={headingRef} tabIndex={-1}>
        {animalLabel(record)}
        <span className={`badge ${isSold ? 'badge-sold' : 'badge-available'}`}>{isSold ? 'Sold' : 'Available'}</span>
      </h2>
      {record.photo && <img className="detail-photo" src={record.photo} alt={`Photo of ${animalLabel(record)} listing`} />}
      <dl className="detail-grid">
        <div><dt>Animal type</dt><dd>{record.animalType === 'Other' ? `Other – ${animalLabel(record)}` : record.animalType}</dd></div>
        <div><dt>Breed</dt><dd>{record.breed || 'Not given'}</dd></div>
        <div><dt>Age</dt><dd>{record.age || 'Not given'}</dd></div>
        <div><dt>Average weight</dt><dd>{record.weight ? `${record.weight} kg per animal` : 'Not given'}</dd></div>
        <div><dt>Vaccinated</dt><dd>{record.vaccinated ? 'Yes' : 'Not stated'}</dd></div>
        <div><dt>Health certificate</dt><dd>{record.healthCertificate ? 'Available' : 'Not stated'}</dd></div>
        <div><dt>Price negotiable</dt><dd>{record.negotiable ? 'Yes' : 'No'}</dd></div>
        <div><dt>Delivery</dt><dd>{record.delivery ? 'Offered' : 'Not offered'}</dd></div>
        <div><dt>Quantity</dt><dd>{record.quantity || 'Not given'}</dd></div>
        <div><dt>Price per animal</dt><dd>{record.price ? moneyLabel(record.price, record.currency, display) : 'Not given'}</dd></div>
        <div><dt>Total at full price</dt><dd>{hasTotal ? moneyLabel(quantity * price, record.currency, display) : 'Not available'}</dd></div>
        {record.bulkPrice && (
          <div>
            <dt>Bulk price (whole lot)</dt>
            <dd>
              {moneyLabel(record.bulkPrice, record.currency, display)}
              {saving > 0 && <span className="saving"> Saves {moneyLabel(saving, record.currency, display)}</span>}
            </dd>
          </div>
        )}
        <div><dt>Priced in</dt><dd>{describeCurrency(record.currency ?? 'KES')}</dd></div>
        <div><dt>Accepted payment</dt><dd>{payments.length ? payments.join(', ') : 'Not given'}</dd></div>
        <div><dt>Location</dt><dd>{record.location || 'Not given'}</dd></div>
        <div><dt>Availability</dt><dd>{isSold ? 'Sold' : 'Available'}</dd></div>
        <div><dt>Date listed</dt><dd>{formatDay(record.createdAt, 'long') || 'Unknown'}</dd></div>
        {isSold && <div><dt>Date sold</dt><dd>{formatDay(record.soldAt, 'long') || 'Not recorded'}</dd></div>}
      </dl>
      <h3>Description</h3>
      <p className="detail-description">{record.description || 'No description added.'}</p>
      <div className="actions">
        {!readOnly && <button type="button" className="secondary" onClick={() => onEdit(record)}>Edit</button>}
        {!readOnly && <button type="button" className="danger" onClick={() => onDelete(record.id)}>Delete</button>}
        <button type="button" className="secondary" onClick={onClose}>Close</button>
      </div>
    </section>
  )
}
