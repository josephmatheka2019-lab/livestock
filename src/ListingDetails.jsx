import { useEffect, useRef } from 'react'

function formatDate(iso) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? 'Unknown'
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatAmount(value) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ListingDetails({ record, onEdit, onDelete, onClose }) {
  const headingRef = useRef(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [record.id])

  const quantity = Number(record.quantity)
  const price = Number(record.price)
  const hasTotal = record.quantity !== '' && record.price !== '' && !Number.isNaN(quantity) && !Number.isNaN(price)
  const isSold = record.status === 'sold'

  return (
    <section className="panel details" aria-labelledby="details-heading">
      <p className="eyebrow">LISTING DETAILS</p>
      <h2 id="details-heading" ref={headingRef} tabIndex={-1}>
        {record.animalType}
        <span className={`badge ${isSold ? 'badge-sold' : 'badge-available'}`}>{isSold ? 'Sold' : 'Available'}</span>
      </h2>
      <dl className="detail-grid">
        <div><dt>Animal type</dt><dd>{record.animalType}</dd></div>
        <div><dt>Quantity</dt><dd>{record.quantity || 'Not given'}</dd></div>
        <div><dt>Price per animal</dt><dd>{record.price ? formatAmount(price) : 'Not given'}</dd></div>
        <div><dt>Total value</dt><dd>{hasTotal ? formatAmount(quantity * price) : 'Not available'}</dd></div>
        <div><dt>Location</dt><dd>{record.location || 'Not given'}</dd></div>
        <div><dt>Availability</dt><dd>{isSold ? 'Sold' : 'Available'}</dd></div>
        <div><dt>Date listed</dt><dd>{formatDate(record.createdAt)}</dd></div>
      </dl>
      <h3>Description</h3>
      <p className="detail-description">{record.description || 'No description added.'}</p>
      <div className="actions">
        <button type="button" className="secondary" onClick={() => onEdit(record)}>Edit</button>
        <button type="button" className="danger" onClick={() => onDelete(record.id)}>Delete</button>
        <button type="button" className="secondary" onClick={onClose}>Close</button>
      </div>
    </section>
  )
}
