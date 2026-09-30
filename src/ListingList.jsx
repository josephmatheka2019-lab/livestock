export default function ListingList({ records, onEdit, onToggleStatus, onDelete }) {
  return (
    <section className="records" aria-labelledby="records-heading">
      <div className="section-heading">
        <div><p className="eyebrow">YOUR LOCAL DATA</p><h2 id="records-heading">Listings <span className="count">{records.length}</span></h2></div>
      </div>
      {records.length === 0 ? (
        <div className="empty"><h3>No listings yet</h3><p>Add a listing above. Saved listings stay in this browser.</p></div>
      ) : (
        <ul className="record-list">
          {records.map((record) => {
            const isSold = record.status === 'sold'
            return (
            <li className="record" key={record.id}>
              <div className="record-copy">
                <h3>
                  {record.animalType}
                  <span className={`badge ${isSold ? 'badge-sold' : 'badge-available'}`}>{isSold ? 'Sold' : 'Available'}</span>
                </h3>
                <p className="listing-meta">
                  {[
                    record.quantity && `Quantity: ${record.quantity}`,
                    record.price && `Price: ${record.price} each`,
                    record.location && `Location: ${record.location}`,
                  ].filter(Boolean).join(' · ')}
                </p>
                {record.description && <p>{record.description}</p>}
              </div>
              <div className="record-actions">
                <button type="button" className="secondary" onClick={() => onToggleStatus(record.id)}>{isSold ? 'Mark available' : 'Mark as sold'}</button>
                <button type="button" className="secondary" onClick={() => onEdit(record)}>Edit</button>
                <button type="button" className="danger" onClick={() => onDelete(record.id)}>Delete</button>
              </div>
            </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
