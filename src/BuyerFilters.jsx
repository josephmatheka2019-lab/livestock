import { useState } from 'react'
import AnimalTypeOptions from './AnimalTypeOptions.jsx'
import { PAYMENT_METHODS } from './listing.js'

const FLAGS = [
  ['delivery', 'Delivery offered'],
  ['vaccinated', 'Vaccinated'],
  ['healthCertificate', 'Health certificate available'],
  ['negotiable', 'Price is negotiable'],
]

// How many of the "more filters" are set, so a buyer can see they are active while the panel is closed.
function countAdvanced(filters) {
  const boxes = ['payment', 'minQuantity', 'minPrice', 'maxPrice'].filter((name) => String(filters[name]).trim() !== '')
  return boxes.length + FLAGS.filter(([name]) => filters[name]).length
}

function priceNote({ priceState, currency }) {
  if (priceState === 'choose') return 'Choose a currency under “Show prices in” to filter by price.'
  if (priceState === 'loading') return 'Loading today’s exchange rates…'
  if (priceState === 'error') return 'Price filters need exchange rates, which could not be loaded. Check your connection and try again.'
  return `Prices are converted to ${currency} using today’s rates, so the limits are approximate.`
}

// Search and filters for the buyer page. Price limits are in the buyer's chosen display currency,
// because prices in different currencies cannot be compared until they are converted.
export default function BuyerFilters({ filters, onChange, onClear, isFiltering, priceState, currency }) {
  const advancedCount = countAdvanced(filters)
  const [showMore, setShowMore] = useState(advancedCount > 0)
  const priceReady = priceState === 'ready'
  const min = Number(filters.minPrice)
  const max = Number(filters.maxPrice)
  const backwards = priceReady && filters.minPrice.trim() !== '' && filters.maxPrice.trim() !== '' && min > max

  return (
    <form className="filters buyer-filters" role="search" aria-label="Search and filter listings" onSubmit={(event) => event.preventDefault()}>
      <div className="filter-search">
        <label htmlFor="filter-search">Search</label>
        <input id="filter-search" name="search" type="search" value={filters.search} onChange={onChange}
          placeholder="Breed, animal, place or any word" autoComplete="off" />
      </div>
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
      <button type="button" className="secondary" onClick={onClear} disabled={!isFiltering}>Clear filters</button>

      <div className="filter-more-toggle">
        <button type="button" className="secondary" aria-expanded={showMore} aria-controls="more-filters"
          onClick={() => setShowMore((open) => !open)}>
          {showMore ? 'Fewer filters' : 'More filters'}{advancedCount > 0 ? ` (${advancedCount} on)` : ''}
        </button>
      </div>

      {showMore && (
        <div className="more-filters" id="more-filters">
          <div>
            <label htmlFor="filter-payment">Payment method</label>
            <select id="filter-payment" name="payment" value={filters.payment} onChange={onChange}>
              <option value="">Any</option>
              {PAYMENT_METHODS.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="filter-min-quantity">Minimum animals</label>
            <input id="filter-min-quantity" name="minQuantity" type="number" inputMode="numeric" min="1" step="1"
              value={filters.minQuantity} onChange={onChange} />
          </div>

          <fieldset className="price-range">
            <legend>Price per animal{priceReady ? ` (${currency})` : ''}</legend>
            <div className="price-inputs">
              <div>
                <label htmlFor="filter-min-price">From</label>
                <input id="filter-min-price" name="minPrice" type="number" inputMode="decimal" min="0" step="any"
                  value={filters.minPrice} onChange={onChange} disabled={!priceReady} aria-describedby="price-note" />
              </div>
              <div>
                <label htmlFor="filter-max-price">To</label>
                <input id="filter-max-price" name="maxPrice" type="number" inputMode="decimal" min="0" step="any"
                  value={filters.maxPrice} onChange={onChange} disabled={!priceReady} aria-describedby="price-note" />
              </div>
            </div>
            <p className="hint" id="price-note">{priceNote({ priceState, currency })}</p>
            {backwards && <p className="error" role="alert">The lowest price is higher than the highest, so nothing can match.</p>}
          </fieldset>

          <fieldset className="check-filters">
            <legend>Only show listings that offer</legend>
            {FLAGS.map(([name, label]) => (
              <label className="check" key={name} htmlFor={`filter-${name}`}>
                <input id={`filter-${name}`} name={name} type="checkbox" checked={filters[name]} onChange={onChange} />
                {label}
              </label>
            ))}
          </fieldset>
        </div>
      )}
    </form>
  )
}
