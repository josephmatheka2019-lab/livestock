import { useState } from 'react'
import AnimalTypeOptions from './AnimalTypeOptions.jsx'
import { FILTER_STATUSES } from './listing.js'

// The seller's filter bar. A seller with a handful of listings rarely needs it, so it stays
// folded away until asked for, and opens by itself if a filter is already on.
export default function ListingFilters({ filters, onChange, onClear, isFiltering, showStatus = true }) {
  const [open, setOpen] = useState(isFiltering)

  return (
    <div className="filter-wrap">
      <button type="button" className="secondary filter-toggle" aria-expanded={open} aria-controls="seller-filters"
        onClick={() => setOpen((current) => !current)}>
        {open ? 'Hide filters' : 'Filter listings'}{isFiltering ? ' (on)' : ''}
      </button>
      {open && (
        <form id="seller-filters" className={`filters${showStatus ? '' : ' filters-compact'}`} role="search" aria-label="Filter listings" onSubmit={(event) => event.preventDefault()}>
          <div>
            <label htmlFor="filter-animal-type">Animal type</label>
            <select id="filter-animal-type" name="animalType" value={filters.animalType} onChange={onChange}>
              <option value="">All types</option>
              <AnimalTypeOptions />
            </select>
          </div>
          <div>
            <label htmlFor="filter-location">Location</label>
            <input id="filter-location" name="location" type="search" value={filters.location} onChange={onChange}
              placeholder="Any location" />
          </div>
          {showStatus && <div>
            <label htmlFor="filter-status">Availability</label>
            <select id="filter-status" name="status" value={filters.status} onChange={onChange}>
              <option value="">All</option>
              {FILTER_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </div>}
          <button type="button" className="secondary" onClick={onClear} disabled={!isFiltering}>Clear filters</button>
        </form>
      )}
    </div>
  )
}
