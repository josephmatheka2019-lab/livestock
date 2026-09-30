import ListingFilters from './ListingFilters.jsx'
import { formatMoney } from './currency.js'
import { animalLabel, paymentLabels, SORT_OPTIONS, termTags } from './listing.js'

export default function ListingList({
  records, totalCount, filters, isFiltering, onFilterChange, onClearFilters, sort, onSortChange,
  onAddFirst, onView, onEdit, onToggleStatus, onDelete, readOnly = false,
}) {
  return (
    <section className="records" aria-labelledby="records-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{readOnly ? 'AVAILABLE NOW' : 'YOUR LOCAL DATA'}</p>
          <h2 id="records-heading" tabIndex={-1}>
            {readOnly ? 'Livestock for sale' : 'Listings'}{' '}
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
        <ListingFilters filters={filters} onChange={onFilterChange} onClear={onClearFilters} isFiltering={isFiltering} showStatus={!readOnly} />
      )}
      {totalCount === 0 && readOnly ? (
        <div className="empty">
          <h3>No livestock is listed for sale yet.</h3>
          <p>Nothing has been listed in this browser yet. Check back soon.</p>
        </div>
      ) : totalCount === 0 ? (
        <div className="empty">
          <h3>No livestock listings available yet.</h3>
          <p>Add your first listing to start keeping track of the animals you have for sale. Saved listings stay in this browser.</p>
          <button type="button" onClick={onAddFirst}>Add Your First Listing</button>
        </div>
      ) : records.length === 0 ? (
        <div className="empty">
          <h3>No listings match these filters</h3>
          <p>Try a different animal type or location.</p>
          <button type="button" className="secondary" onClick={onClearFilters}>Clear filters</button>
        </div>
      ) : (
        <ul className="record-list">
          {records.map((record) => {
            const isSold = record.status === 'sold'
            const facts = [
              record.breed && `Breed: ${record.breed}`,
              record.age && `Age: ${record.age}`,
              record.weight && `Avg weight: ${record.weight} kg`,
            ].filter(Boolean)
            return (
            <li className="record" key={record.id}>
              <div className="record-main">
              {record.photo && <img className="thumb" src={record.photo} alt={`Photo of ${animalLabel(record)} listing`} />}
              <div className="record-copy">
                <h3>
                  {animalLabel(record)}
                  {!readOnly && <span className={`badge ${isSold ? 'badge-sold' : 'badge-available'}`}>{isSold ? 'Sold' : 'Available'}</span>}
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
                {termTags(record).length > 0 && (
                  <ul className="tags" aria-label="Terms">
                    {termTags(record).map((tag) => <li key={tag}>{tag}</li>)}
                  </ul>
                )}
                {paymentLabels(record.paymentMethods).length > 0 && (
                  <p className="listing-payments">Accepts: {paymentLabels(record.paymentMethods).join(', ')}</p>
                )}
                {record.description && <p>{record.description}</p>}
              </div>
              </div>
              <div className="record-actions">
                <button type="button" className="secondary" onClick={() => onView(record.id)}>View<span className="visually-hidden"> {animalLabel(record)} listing</span></button>
                {!readOnly && <>
                <button type="button" className="secondary" onClick={() => onToggleStatus(record.id)}>{isSold ? 'Mark available' : 'Mark as sold'}<span className="visually-hidden"> {animalLabel(record)} listing</span></button>
                <button type="button" className="secondary" onClick={() => onEdit(record)}>Edit<span className="visually-hidden"> {animalLabel(record)} listing</span></button>
                <button type="button" className="danger" onClick={() => onDelete(record.id)}>Delete<span className="visually-hidden"> {animalLabel(record)} listing</span></button>
                </>}
              </div>
            </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
