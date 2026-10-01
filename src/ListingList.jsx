import ListingFilters from './ListingFilters.jsx'
import ListingSummary from './ListingSummary.jsx'
import SaveButton from './SaveButton.jsx'
import { animalLabel, SORT_OPTIONS } from './listing.js'

export default function ListingList({
  records, totalCount, filters, isFiltering, onFilterChange, onClearFilters, sort, onSortChange, sortOptions = SORT_OPTIONS,
  onAddFirst, onView, onEdit, onToggleStatus, onTogglePaused, onDelete, readOnly = false, display = null, filtersNode = null, seller = null, savedIds = null, onToggleSaved = null, headerAction = null,
}) {
  return (
    <section className="records" aria-labelledby="records-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{readOnly ? 'AVAILABLE NOW' : 'MANAGE'}</p>
          <h2 id="records-heading" tabIndex={-1}>
            {readOnly ? 'Livestock for sale' : 'Listings'}{' '}
            <span className="count" aria-live="polite">
              {isFiltering ? `${records.length} of ${totalCount}` : totalCount}
            </span>
          </h2>
        </div>
        <div className="section-tools">
          {totalCount > 1 && (
            <div className="sort">
              <label htmlFor="sort-order">Sort by</label>
              <select id="sort-order" value={sort} onChange={onSortChange}>
                {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          )}
          {headerAction}
        </div>
      </div>
      {totalCount > 0 && (filtersNode ?? (
        <ListingFilters filters={filters} onChange={onFilterChange} onClear={onClearFilters} isFiltering={isFiltering} showStatus={!readOnly} />
      ))}
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
          <p>{readOnly ? 'Try a different search, or clear some of the filters.' : 'Try a different animal type or location.'}</p>
          <button type="button" className="secondary" onClick={onClearFilters}>Clear filters</button>
        </div>
      ) : (
        <ul className="record-list">
          {records.map((record) => {
            const isSold = record.status === 'sold'
            return (
            <li className="record" key={record.id}>
              <ListingSummary record={record} showStatus={!readOnly} display={display} buyerView={readOnly} seller={seller} />
              <div className="record-actions">
                <button type="button" className="secondary" onClick={() => onView(record.id)}>View<span className="visually-hidden"> {animalLabel(record)} listing</span></button>
                {onToggleSaved && <SaveButton record={record} saved={savedIds.has(record.id)} onToggle={onToggleSaved} />}
                {!readOnly && <>
                <button type="button" className="secondary" onClick={() => onToggleStatus(record.id)}>{isSold ? 'Mark available' : 'Mark as sold'}<span className="visually-hidden"> {animalLabel(record)} listing</span></button>
                {!isSold && (
                  <button type="button" className="secondary" onClick={() => onTogglePaused(record.id)}>
                    {record.paused ? 'Resume' : 'Pause'}<span className="visually-hidden"> {animalLabel(record)} listing</span>
                  </button>
                )}
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
