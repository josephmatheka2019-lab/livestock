import { useEffect, useState } from 'react'
import BuyerProfile from './BuyerProfile.jsx'
import BuyerFilters from './BuyerFilters.jsx'
import CurrencyPicker from './CurrencyPicker.jsx'
import ListingDetails from './ListingDetails.jsx'
import ListingList from './ListingList.jsx'
import PriceCalculator from './PriceCalculator.jsx'
import SellerContact from './SellerContact.jsx'
import {
  emptyBuyerFilters, isBuyerFiltering, matchesBuyerFilters, PRICE_SORT_OPTIONS, SORT_OPTIONS, sortRecords,
} from './listing.js'
import { loadRates } from './rates.js'
import { emptyBuyerProfile, isBuyerProfileComplete } from './buyerProfile.js'
import {
  readBuyerProfile, readDisplayCurrency, readProfile, readRecords, writeBuyerProfile, writeDisplayCurrency,
} from './storage.js'

// Buyers can only look: no form, and no way to change or remove a listing.
// For now the listings are the ones sellers saved in this same browser.
export default function BuyerPage() {
  const [records, setRecords] = useState(readRecords)
  const [filters, setFilters] = useState(emptyBuyerFilters)
  const [sort, setSort] = useState('newest')
  const [selectedId, setSelectedId] = useState(null)
  const [currency, setCurrency] = useState(readDisplayCurrency)
  const [profile, setProfile] = useState(() => ({ ...emptyBuyerProfile, ...readBuyerProfile() }))
  const [fx, setFx] = useState({ status: 'idle', rates: null, date: '', stale: false })
  // Until accounts exist, the only seller profile is the one saved in this browser, so it is
  // the contact for every listing. With accounts, each listing will carry its own seller.
  const [seller, setSeller] = useState(readProfile)
  const [profileRequests, setProfileRequests] = useState(0)

  useEffect(() => {
    document.title = 'Find livestock – Local Livestock Marketplace'
    // Pick up listings and seller details saved in another tab of this browser.
    const refresh = () => { setRecords(readRecords()); setSeller(readProfile()) }
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [])

  // Rates are fetched only once a buyer asks for a converted currency, and reused for the rest of the visit.
  useEffect(() => {
    if (!currency || fx.status === 'ready') return undefined
    let cancelled = false
    setFx((current) => ({ ...current, status: 'loading' }))
    loadRates()
      .then(({ rates, date, stale }) => { if (!cancelled) setFx({ status: 'ready', rates, date, stale }) })
      .catch(() => { if (!cancelled) setFx({ status: 'error', rates: null, date: '', stale: false }) })
    return () => { cancelled = true }
  }, [currency]) // eslint-disable-line react-hooks/exhaustive-deps

  function saveProfile(next) {
    if (!writeBuyerProfile(next)) return false
    setProfile(next)
    return true
  }

  function chooseCurrency(code) {
    setCurrency(code)
    writeDisplayCurrency(code)
    // Price limits are typed in the chosen currency, so they would mean something else after a change.
    setFilters((current) => ({ ...current, minPrice: '', maxPrice: '' }))
  }

  // Only convert once the rates are in; until then (or if they fail) buyers see the sellers' own prices.
  const display = currency && fx.status === 'ready' ? { currency, rates: fx.rates } : null

  // Sold listings are not for sale, so buyers never see them.
  const available = records.filter((record) => (record.status ?? 'available') !== 'sold')
  const isFiltering = isBuyerFiltering(filters)
  // Price sorting and price limits need a converted currency; without one they are not offered.
  const sortOptions = display ? [...SORT_OPTIONS, ...PRICE_SORT_OPTIONS] : SORT_OPTIONS
  const activeSort = sortOptions.some((option) => option.value === sort) ? sort : 'newest'
  const priceState = !currency ? 'choose' : fx.status === 'ready' ? 'ready' : fx.status === 'error' ? 'error' : 'loading'
  const visible = sortRecords(available.filter((record) => matchesBuyerFilters(record, filters, display)), activeSort, display)
  const selected = available.find((record) => record.id === selectedId)

  function handleFilterChange(event) {
    const { name, value, type, checked } = event.target
    setFilters((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  return (
    <main className="shell role-buyer">
      <a className="back-link" href="#/">← Switch role</a>
      <header className="hero">
        <p className="eyebrow">FOR BUYERS</p>
        <h1>Find livestock</h1>
        <p className="intro">Browse animals that sellers have listed for bulk sale. Search by breed, animal or place, filter by price and what is offered, and open a listing to see the full details.</p>
      </header>

      <BuyerProfile profile={profile} onSave={saveProfile} openRequest={profileRequests} />

      <CurrencyPicker value={currency} onChange={chooseCurrency} status={fx.status} date={fx.date} stale={fx.stale} />

      {selected && (
        <ListingDetails record={selected} readOnly display={display} onClose={() => setSelectedId(null)}>
          <PriceCalculator key={selected.id} record={selected} display={display} />
          <SellerContact
            record={selected}
            seller={seller}
            buyer={profile}
            buyerReady={isBuyerProfileComplete(profile)}
            onNeedProfile={() => setProfileRequests((count) => count + 1)}
          />
        </ListingDetails>
      )}

      <ListingList
        readOnly
        display={display}
        seller={seller}
        records={visible}
        totalCount={available.length}
        filters={filters}
        sort={activeSort}
        sortOptions={sortOptions}
        isFiltering={isFiltering}
        onFilterChange={handleFilterChange}
        onClearFilters={() => setFilters(emptyBuyerFilters)}
        filtersNode={(
          <BuyerFilters
            filters={filters}
            onChange={handleFilterChange}
            onClear={() => setFilters(emptyBuyerFilters)}
            isFiltering={isFiltering}
            priceState={priceState}
            currency={currency}
          />
        )}
        onSortChange={(event) => setSort(event.target.value)}
        onView={setSelectedId}
      />

      <footer>
        <p>For now you see the listings saved in this browser. Listings from sellers on other devices will appear once accounts are connected.</p>
      </footer>
    </main>
  )
}
