import { useEffect, useState } from 'react'
import ListingDetails from './ListingDetails.jsx'
import ListingList from './ListingList.jsx'
import { matchesFilters, sortRecords } from './listing.js'
import { readRecords } from './storage.js'

const emptyFilters = { animalType: '', location: '', status: '' }

// Buyers can only look: no form, and no way to change or remove a listing.
// For now the listings are the ones sellers saved in this same browser.
export default function BuyerPage() {
  const [records, setRecords] = useState(readRecords)
  const [filters, setFilters] = useState(emptyFilters)
  const [sort, setSort] = useState('newest')
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    document.title = 'Find livestock – Local Livestock Marketplace'
    // Pick up listings a seller saves in another tab of this browser.
    const refresh = () => setRecords(readRecords())
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [])

  // Sold listings are not for sale, so buyers never see them.
  const available = records.filter((record) => (record.status ?? 'available') !== 'sold')
  const isFiltering = Object.values(filters).some((value) => value.trim() !== '')
  const visible = sortRecords(available.filter((record) => matchesFilters(record, filters)), sort)
  const selected = available.find((record) => record.id === selectedId)

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  return (
    <main className="shell role-buyer">
      <a className="back-link" href="#/">← Switch role</a>
      <header className="hero">
        <p className="eyebrow">FOR BUYERS</p>
        <h1>Find livestock</h1>
        <p className="intro">Browse animals that sellers have listed for bulk sale. Filter by animal and location, and open a listing to see the full details.</p>
      </header>

      {selected && (
        <ListingDetails record={selected} readOnly onClose={() => setSelectedId(null)} />
      )}

      <ListingList
        readOnly
        records={visible}
        totalCount={available.length}
        filters={filters}
        sort={sort}
        isFiltering={isFiltering}
        onFilterChange={handleFilterChange}
        onClearFilters={() => setFilters(emptyFilters)}
        onSortChange={(event) => setSort(event.target.value)}
        onView={setSelectedId}
      />

      <footer>
        <p>For now you see the listings saved in this browser. Listings from sellers on other devices will appear once accounts are connected.</p>
      </footer>
    </main>
  )
}
