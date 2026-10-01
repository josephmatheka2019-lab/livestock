import { useEffect, useState } from 'react'
import BuyerProfile from './BuyerProfile.jsx'
import BuyerFilters from './BuyerFilters.jsx'
import CurrencyPicker from './CurrencyPicker.jsx'
import ListingDetails from './ListingDetails.jsx'
import ListingList from './ListingList.jsx'
import MyOrders from './MyOrders.jsx'
import OrderForm from './OrderForm.jsx'
import SaveButton from './SaveButton.jsx'
import SavedList from './SavedList.jsx'
import SellerContact from './SellerContact.jsx'
import SiteHeader from './SiteHeader.jsx'
import {
  emptyBuyerFilters, isBuyerFiltering, isListedForBuyers, matchesBuyerFilters, PRICE_SORT_OPTIONS, SORT_OPTIONS,
  sortRecords,
} from './listing.js'
import { loadRates } from './rates.js'
import { emptyBuyerProfile, isBuyerProfileComplete } from './buyerProfile.js'
import { addSaved, cleanSaved, isSaved, removeSaved, savedView } from './saved.js'
import { animalLabel } from './listing.js'
import { cancelOrder, cleanOrders, isOpen, payOrder } from './orders.js'
import { accountStatus, cleanAdminState } from './admin.js'
import { boostedFirst, isPro, verificationStatus } from './store.js'
import {
  readAdmin, readBuyerProfile, readDisplayCurrency, readOrders, readProfile, readRecords, readSaved, writeBuyerProfile,
  writeDisplayCurrency, writeOrders, writeRecords, writeSaved,
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
  const [saved, setSaved] = useState(() => cleanSaved(readSaved()))
  const [view, setView] = useState('browse')
  const [announcement, setAnnouncement] = useState({ text: '', count: 0 })
  const [orders, setOrders] = useState(() => cleanOrders(readOrders()))
  const [orderError, setOrderError] = useState('')
  const [admin, setAdmin] = useState(() => cleanAdminState(readAdmin()))

  // The admin can suspend or terminate this account; a blocked buyer can browse but
  // cannot place orders or pay.
  const buyerStatus = accountStatus(admin, 'buyer')
  const blocked = buyerStatus !== 'active'
  const blockMessage = buyerStatus === 'terminated'
    ? 'Your account has been terminated. You cannot place orders on this platform any more.'
    : 'Your account is suspended. You cannot place orders until the admin reinstates it.'

  useEffect(() => {
    document.title = 'Find livestock – Local Livestock Marketplace'
    // Pick up listings, seller details, saved listings and orders changed in another tab of this browser.
    const refresh = () => {
      setRecords(readRecords()); setSeller(readProfile()); setSaved(cleanSaved(readSaved()))
      setOrders(cleanOrders(readOrders())); setAdmin(cleanAdminState(readAdmin()))
    }
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

  useEffect(() => {
    writeSaved(saved)
  }, [saved])

  useEffect(() => {
    writeOrders(orders)
  }, [orders])

  function announce(text) {
    setAnnouncement((current) => ({ text, count: current.count + 1 }))
  }

  // The order was already confirmed with "Yes, place order" in the form.
  // Nothing goes through while the account is suspended or terminated.
  function placeOrder(order) {
    if (blocked) {
      setOrderError(blockMessage)
      return
    }
    setOrderError('')
    setOrders((current) => [order, ...current])
    announce(`Order placed for ${order.quantity} ${order.listingLabel}. The seller will accept or decline it.`)
  }

  // A change to an order can also change a listing's stock (cancelling an accepted order returns the animals).
  function applyOrderChange(result, message) {
    if (blocked) {
      setOrderError(blockMessage)
      return
    }
    if (result.error) {
      setOrderError(result.error)
      return
    }
    setOrderError('')
    setOrders(result.orders)
    if (result.listings !== records) {
      setRecords(result.listings)
      writeRecords(result.listings)
    }
    announce(message)
  }

  const cancelMyOrder = (id) => applyOrderChange(cancelOrder(orders, records, id), 'Order cancelled.')
  const payMyOrder = (id) => applyOrderChange(payOrder(orders, records, id), 'Payment recorded (demonstration).')

  function toggleSaved(record) {
    if (isSaved(saved, record.id)) {
      setSaved((current) => removeSaved(current, record.id))
      announce(`Removed ${animalLabel(record)} listing from your saved list.`)
    } else {
      setSaved((current) => addSaved(current, record))
      announce(`Saved ${animalLabel(record)} listing.`)
    }
  }

  // Removing from the Saved page: the row disappears, so send focus to the list heading.
  function removeFromSaved(id, label) {
    setSaved((current) => removeSaved(current, id))
    announce(`Removed ${label} listing from your saved list.`)
    document.getElementById('saved-heading')?.focus()
  }

  function chooseCurrency(code) {
    setCurrency(code)
    writeDisplayCurrency(code)
    // Price limits are typed in the chosen currency, so they would mean something else after a change.
    setFilters((current) => ({ ...current, minPrice: '', maxPrice: '' }))
  }

  // Only convert once the rates are in; until then (or if they fail) buyers see the sellers' own prices.
  const display = currency && fx.status === 'ready' ? { currency, rates: fx.rates } : null

  // Sold and paused listings are not for sale, so buyers never see them.
  const available = records.filter(isListedForBuyers)
  const isFiltering = isBuyerFiltering(filters)
  // Price sorting and price limits need a converted currency; without one they are not offered.
  const sortOptions = display ? [...SORT_OPTIONS, ...PRICE_SORT_OPTIONS] : SORT_OPTIONS
  const activeSort = sortOptions.some((option) => option.value === sort) ? sort : 'newest'
  const priceState = !currency ? 'choose' : fx.status === 'ready' ? 'ready' : fx.status === 'error' ? 'error' : 'loading'
  // Boosted listings lead the results (they pay for position); the rest keep the chosen order.
  const visible = boostedFirst(sortRecords(available.filter((record) => matchesBuyerFilters(record, filters, display)), activeSort, display))
  const selected = available.find((record) => record.id === selectedId)
  const savedIds = new Set(saved.map((entry) => entry.id))
  const savedItems = savedView(saved, records)
  // The seller's badges (they come from admin state, never from the seller's own profile).
  const sellerVerified = verificationStatus(admin, 'seller') === 'verified'
  const sellerPro = isPro(admin, 'seller')

  function handleFilterChange(event) {
    const { name, value, type, checked } = event.target
    setFilters((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  return (
    <main className="shell role-buyer">
      <SiteHeader role="buyer" />
      <div className="hero">
        <p className="eyebrow">FOR BUYERS</p>
        <h1>Find livestock</h1>
        <p className="intro">Search animals for sale by breed, place or price, then place your order &ndash; the seller accepts or declines it.</p>
      </div>

      <BuyerProfile profile={profile} onSave={saveProfile} openRequest={profileRequests} />

      {blocked && <p className="notice" role="alert">{blockMessage}</p>}

      <CurrencyPicker value={currency} onChange={chooseCurrency} status={fx.status} date={fx.date} stale={fx.stale} />

      {selected && (
        <ListingDetails
          record={selected}
          readOnly
          display={display}
          onClose={() => setSelectedId(null)}
          extraActions={<SaveButton record={selected} saved={savedIds.has(selected.id)} onToggle={toggleSaved} />}
        >
          <OrderForm
            key={selected.id}
            record={selected}
            display={display}
            buyer={profile}
            buyerReady={isBuyerProfileComplete(profile)}
            blocked={blocked ? blockMessage : ''}
            orders={orders}
            seller={seller}
            onPlace={placeOrder}
            onNeedProfile={() => setProfileRequests((count) => count + 1)}
            onViewOrders={() => setView('orders')}
          />
          <SellerContact seller={seller} />
        </ListingDetails>
      )}

      <div className="view-tabs" role="group" aria-label="What to show">
        <button type="button" className={`chip${view === 'browse' ? ' chip-on' : ''}`} aria-pressed={view === 'browse'}
          onClick={() => setView('browse')}>Browse</button>
        <button type="button" className={`chip${view === 'saved' ? ' chip-on' : ''}`} aria-pressed={view === 'saved'}
          onClick={() => setView('saved')}>Saved ({saved.length})</button>
        <button type="button" className={`chip${view === 'orders' ? ' chip-on' : ''}`} aria-pressed={view === 'orders'}
          onClick={() => setView('orders')}>My orders ({orders.length}{orders.some(isOpen) ? `, ${orders.filter(isOpen).length} open` : ''})</button>
      </div>

      <div className="visually-hidden" role="status" aria-live="polite">
        <span key={announcement.count}>{announcement.text}</span>
      </div>

      {view === 'orders' ? (
        <MyOrders
          orders={orders}
          display={display}
          seller={seller}
          error={orderError}
          blocked={blocked ? blockMessage : ''}
          onCancel={cancelMyOrder}
          onPay={payMyOrder}
          onBrowse={() => setView('browse')}
        />
      ) : view === 'saved' ? (
        <SavedList
          items={savedItems}
          display={display}
          seller={seller}
          verified={sellerVerified}
          pro={sellerPro}
          onView={setSelectedId}
          onRemove={(id) => removeFromSaved(id, savedItems.find((item) => item.entry.id === id)?.label ?? 'saved')}
          onBrowse={() => setView('browse')}
        />
      ) : (
      <ListingList
        readOnly
        display={display}
        seller={seller}
        savedIds={savedIds}
        onToggleSaved={toggleSaved}
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
        verified={sellerVerified}
        pro={sellerPro}
      />
      )}

      <footer>
        <p>For now you see the listings saved in this browser. Listings from sellers on other devices will appear once accounts are connected.</p>
      </footer>
    </main>
  )
}
