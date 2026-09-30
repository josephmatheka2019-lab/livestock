import ListingFilters from './ListingFilters.jsx'
import { SORT_OPTIONS } from './listing.js'

export default function ListingList({
  records, totalCount, filters, isFiltering, onFilterChange, onClearFilters, sort, onSortChange,
  onAddFirst, onView, onEdit, onToggleStatus, onDelete,
}) {
  return (
    <section className="records" aria-labelledby="records-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR LOCAL DATA</p>
          <h2 id="records-heading" tabIndex={-1}>
            Listings{' '}
            <span className="count" aria-live="polite">
              {isFiltering ? `${records.length} of ${totalCount}` : totalCount}
            </span>
          </h2>
        </div>
        {totalCount > 1 && (
          <div className="sort">
            <label htmlFor="sort-order">Sort by</label>
            <select id="sort-order" value={sort} onChange={onSortChange}>
              {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        )}
      </div>
      {totalCount > 0 && (
        <ListingFilters filters={filters} onChange={onFilterChange} onClear={onClearFilters} isFiltering={isFiltering} />
      )}
      {totalCount === 0 ? (
        <div className="empty">
          <h3>No livestock listings available yet.</h3>
          <p>Add your first listing to start keeping track of the animals you have for sale. Saved listings stay in this browser.</p>
          <button type="button" onClick={onAddFirst}>Add Your First Listing</button>
        </div>
      ) : records.length === 0 ? (
        <div className="empty">
          <h3>No listings match these filters</h3>
          <p>Try a different animal type, location or availability.</p>
          <button type="button" className="secondary" onClick={onClearFilters}>Clear filters</button>
        </div>
      ) : (
        <ul className="record-list">
          {records.map((record) => {
            const isSold = record.status === 'sold'
            return (
            <li className="record" key={record.id}>
              <div className="record-main">
              {record.photo && <img className="thumb" src={record.photo} alt={`Photo of ${record.animalType} listing`} />}
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
              </div>
              <div className="record-actions">
                <button type="button" className="secondary" onClick={() => onView(record.id)}>View<span className="visually-hidden"> {record.animalType} listing</span></button>
                <button type="button" className="secondary" onClick={() => onToggleStatus(record.id)}>{isSold ? 'Mark available' : 'Mark as sold'}<span className="visually-hidden"> {record.animalType} listing</span></button>
                <button type="button" className="secondary" onClick={() => onEdit(record)}>Edit<span className="visually-hidden"> {record.animalType} listing</span></button>
                <button type="button" className="danger" onClick={() => onDelete(record.id)}>Delete<span className="visually-hidden"> {record.animalType} listing</span></button>
              </div>
            </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
