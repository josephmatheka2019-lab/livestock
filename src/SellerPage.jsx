import { useEffect, useRef, useState } from 'react'
import { readOrders, readProfile, readRecords, writeOrders, writeProfile, writeRecords } from './storage.js'
import { acceptOrder, cancelOrder, cleanOrders, completeOrder, declineOrder } from './orders.js'
import {
  animalLabel, FIELD_IDS, matchesFilters, SELLER_SORT_OPTIONS, sortRecords, validateListing, withPaused, withStatus,
} from './listing.js'
import { DEFAULT_CURRENCY } from './currency.js'
import { processPhoto } from './photo.js'
import ConfirmDelete from './ConfirmDelete.jsx'
import ListingForm from './ListingForm.jsx'
import ListingDetails from './ListingDetails.jsx'
import ListingList from './ListingList.jsx'
import OrdersPanel from './OrdersPanel.jsx'
import SellerProfile from './SellerProfile.jsx'
import SellerSummary from './SellerSummary.jsx'
import SiteHeader from './SiteHeader.jsx'
import { emptyProfile, isProfileComplete } from './sellerProfile.js'

const emptyFilters = { animalType: '', location: '', status: '' }
const emptyForm = {
  animalType: '', otherAnimal: '', quantity: '', currency: DEFAULT_CURRENCY, price: '', bulkPrice: '',
  location: '', status: 'available', breed: '', age: '', weight: '',
  vaccinated: false, healthCertificate: false, negotiable: false, delivery: false,
  paymentMethods: [], description: '', photo: '',
}

// A new listing starts blank except for the location, which comes from the seller's profile.
function blankForm(profile) {
  return { ...emptyForm, location: profile.location || '' }
}

function cleanForm(form) {
  return {
    animalType: form.animalType,
    otherAnimal: form.animalType === 'Other' ? form.otherAnimal.trim() : '',
    quantity: form.quantity.trim(),
    currency: form.currency,
    price: form.price.trim(),
    bulkPrice: form.bulkPrice.trim(),
    location: form.location.trim(),
    status: form.status,
    breed: form.breed.trim(),
    age: form.age.trim(),
    weight: form.weight.trim(),
    vaccinated: form.vaccinated,
    healthCertificate: form.healthCertificate,
    negotiable: form.negotiable,
    delivery: form.delivery,
    paymentMethods: form.paymentMethods,
    description: form.description.trim(),
    photo: form.photo,
  }
}

export default function SellerPage() {
  const [records, setRecords] = useState(readRecords)
  const [profile, setProfile] = useState(() => ({ ...emptyProfile, ...readProfile() }))
  const [form, setForm] = useState(() => blankForm(profile))
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [filters, setFilters] = useState(emptyFilters)
  const [sort, setSort] = useState('newest')
  const [announcement, setAnnouncement] = useState({ text: '', count: 0 })
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const deleteTrigger = useRef(null)
  const [storageWarning, setStorageWarning] = useState(false)
  const profileComplete = isProfileComplete(profile)
  // The listing form is opened on request, so the page opens on the seller's listings.
  const [formOpen, setFormOpen] = useState(false)
  const [focusRequest, setFocusRequest] = useState(0)
  const [orders, setOrders] = useState(() => cleanOrders(readOrders()))
  const [orderError, setOrderError] = useState('')
  const [view, setView] = useState('listings')

  useEffect(() => {
    setStorageWarning(!writeRecords(records))
  }, [records])

  useEffect(() => {
    writeOrders(orders)
  }, [orders])

  useEffect(() => {
    document.title = 'Your listings – Local Livestock Marketplace'
    // Orders (and the stock a buyer's cancellation returns) can change in another tab of this browser.
    const refresh = () => { setOrders(cleanOrders(readOrders())); setRecords(readRecords()) }
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [])

  // Accepting or cancelling an order moves animals on or off the listing, so both lists change together.
  function applyOrderChange(result, message) {
    if (result.error) {
      setOrderError(result.error)
      return
    }
    setOrderError('')
    setOrders(result.orders)
    setRecords(result.listings)
    announce(message)
  }

  const acceptMyOrder = (id) => applyOrderChange(acceptOrder(orders, records, id), 'Order accepted. The animals are held for the buyer.')
  const declineMyOrder = (id) => applyOrderChange(declineOrder(orders, records, id), 'Order declined.')
  const cancelMyOrder = (id) => applyOrderChange(cancelOrder(orders, records, id), 'Order cancelled. The animals are back on sale.')
  const completeMyOrder = (id) => applyOrderChange(completeOrder(orders, records, id), 'Order marked completed.')

  // The form only exists once open, so move into it after it has appeared.
  useEffect(() => {
    if (focusRequest > 0 && formOpen) document.getElementById('listing-animal-type')?.focus()
  }, [focusRequest, formOpen])

  function openForm() {
    setFormOpen(true)
    setFocusRequest((count) => count + 1)
  }

  // After saving, the form closes and focus goes to the list, where the change shows.
  function closeFormToList() {
    setFormOpen(false)
    setTimeout(() => document.getElementById('records-heading')?.focus(), 0)
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setErrors((current) => {
      if (!current[name]) return current
      const { [name]: _cleared, ...rest } = current
      return rest
    })
  }

  function togglePayment(method) {
    setForm((current) => ({
      ...current,
      paymentMethods: current.paymentMethods.includes(method)
        ? current.paymentMethods.filter((item) => item !== method)
        : [...current.paymentMethods, method],
    }))
    setErrors((current) => {
      const { paymentMethods: _cleared, ...rest } = current
      return rest
    })
  }

  async function handlePhotoChange(event) {
    const input = event.target
    const file = input.files[0]
    if (!file) return
    try {
      const photo = await processPhoto(file)
      setForm((current) => ({ ...current, photo }))
      setErrors((current) => {
        const { photo: _cleared, ...rest } = current
        return rest
      })
    } catch (error) {
      input.value = ''
      setErrors((current) => ({ ...current, photo: error.message }))
    }
  }

  function removePhoto() {
    setForm((current) => ({ ...current, photo: '' }))
    setErrors((current) => {
      const { photo: _cleared, ...rest } = current
      return rest
    })
    document.getElementById('listing-photo')?.focus()
  }

  function announce(text) {
    setAnnouncement((current) => ({ text, count: current.count + 1 }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const found = validateListing(form)
    const firstInvalid = Object.keys(FIELD_IDS).find((name) => found[name])
    if (firstInvalid) {
      setErrors(found)
      document.getElementById(FIELD_IDS[firstInvalid])?.focus()
      return
    }
    const fields = cleanForm(form)
    if (editingId) {
      setRecords((current) => current.map((record) =>
        // Keep the old status while merging, so withStatus can tell a listing is newly sold.
        record.id === editingId ? withStatus({ ...record, ...fields, status: record.status }, fields.status) : record,
      ))
      setEditingId(null)
    } else {
      setRecords((current) => [
        withStatus({ id: crypto.randomUUID(), ...fields, status: undefined, createdAt: new Date().toISOString() }, fields.status),
        ...current,
      ])
    }
    announce(editingId ? 'Listing updated.' : 'Listing added.')
    setForm(blankForm(profile))
    setErrors({})
    closeFormToList()
  }

  function saveProfile(next) {
    if (!writeProfile(next)) return false
    // A blank form still showing the old default location follows the profile; a location the seller typed is kept.
    if (!editingId) {
      setForm((current) => (current.location === profile.location ? { ...current, location: next.location } : current))
    }
    setProfile(next)
    announce('Profile saved.')
    return true
  }

  function focusProfile() {
    document.getElementById('profile-name')?.focus()
  }

  function startEdit(record) {
    // Editing needs the listing form, which stays locked until the profile is done.
    if (!profileComplete) {
      focusProfile()
      return
    }
    setEditingId(record.id)
    setForm({
      animalType: record.animalType,
      otherAnimal: record.otherAnimal ?? '',
      quantity: record.quantity,
      currency: record.currency ?? DEFAULT_CURRENCY,
      price: record.price,
      bulkPrice: record.bulkPrice ?? '',
      location: record.location,
      status: record.status ?? 'available',
      breed: record.breed ?? '',
      age: record.age ?? '',
      weight: record.weight ?? '',
      vaccinated: Boolean(record.vaccinated),
      healthCertificate: Boolean(record.healthCertificate),
      negotiable: Boolean(record.negotiable),
      delivery: Boolean(record.delivery),
      paymentMethods: record.paymentMethods ?? [],
      description: record.description,
      photo: record.photo ?? '',
    })
    setErrors({})
    openForm()
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(blankForm(profile))
    setErrors({})
    setFormOpen(false)
  }

  function toggleStatus(id) {
    const target = records.find((record) => record.id === id)
    if (target) {
      const nowSold = (target.status ?? 'available') !== 'sold'
      announce(`${animalLabel(target)} listing marked as ${nowSold ? 'sold' : 'available'}.`)
    }
    setRecords((current) => current.map((record) =>
      record.id === id
        ? withStatus(record, (record.status ?? 'available') === 'sold' ? 'available' : 'sold')
        : record,
    ))
  }

  // Pausing hides a listing from buyers without selling or deleting it; resuming puts it back.
  function togglePaused(id) {
    const target = records.find((record) => record.id === id)
    if (!target || target.status === 'sold') return
    const pausing = !target.paused
    announce(pausing
      ? `${animalLabel(target)} listing paused. Buyers cannot see it.`
      : `${animalLabel(target)} listing resumed. Buyers can see it again.`)
    setRecords((current) => current.map((record) => (record.id === id ? withPaused(record, pausing) : record)))
  }

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function focusForm() {
    if (!profileComplete) {
      focusProfile()
      return
    }
    openForm()
  }

  function requestDelete(id) {
    deleteTrigger.current = document.activeElement
    setPendingDeleteId(id)
  }

  function cancelDelete() {
    setPendingDeleteId(null)
    // Some browsers (Safari) don't focus a button when it is clicked; fall back to the list heading.
    const trigger = deleteTrigger.current
    const target = trigger && trigger !== document.body && trigger.isConnected
      ? trigger
      : document.getElementById('records-heading')
    target?.focus()
  }

  function confirmDelete() {
    const id = pendingDeleteId
    setPendingDeleteId(null)
    setRecords((current) => current.filter((record) => record.id !== id))
    if (editingId === id) cancelEdit()
    if (selectedId === id) setSelectedId(null)
    announce('Listing deleted.')
    document.getElementById('records-heading')?.focus()
  }

  const isFiltering = Object.values(filters).some((value) => value.trim() !== '')
  const visibleRecords = sortRecords(records.filter((record) => matchesFilters(record, filters)), sort)
  const selectedRecord = records.find((record) => record.id === selectedId)
  const pendingDeleteRecord = records.find((record) => record.id === pendingDeleteId)
  const newOrders = orders.filter((order) => order.status === 'placed').length

  return (
    <main className="shell role-seller">
      <SiteHeader role="seller" />
      <div className="hero">
        <p className="eyebrow">FOR SELLERS</p>
        <h1>Your livestock listings</h1>
        <p className="intro">Add animals for sale, keep them up to date, and mark them sold.</p>
      </div>

      <SellerProfile profile={profile} onSave={saveProfile} />

      <div className="view-tabs" role="group" aria-label="What to show">
        <button type="button" className={`chip${view === 'listings' ? ' chip-on' : ''}`} aria-pressed={view === 'listings'}
          onClick={() => setView('listings')}>Listings ({records.length})</button>
        <button type="button" className={`chip${view === 'orders' ? ' chip-on' : ''}`} aria-pressed={view === 'orders'}
          onClick={() => setView('orders')}>
          Orders ({orders.length}{newOrders > 0 ? `, ${newOrders} new` : ''})
        </button>
      </div>

      {view === 'listings' && <SellerSummary records={records} />}

      {view === 'listings' && profileComplete && formOpen && (
        <ListingForm
          form={form}
          profile={profile}
          errors={errors}
          isEditing={Boolean(editingId)}
          onChange={handleChange}
          onTogglePayment={togglePayment}
          onPhotoChange={handlePhotoChange}
          onPhotoRemove={removePhoto}
          onSubmit={handleSubmit}
          onCancel={cancelEdit}
        />
      )}
      {view === 'listings' && !profileComplete && (
        <section className="panel locked" aria-labelledby="locked-heading">
          <h2 id="locked-heading">Add a listing</h2>
          <p>Finish your seller profile above to start posting. Buyers need your business name and phone number to reach you.</p>
        </section>
      )}

      <div className="visually-hidden" role="status" aria-live="polite">
        <span key={announcement.count}>{announcement.text}</span>
      </div>

      {pendingDeleteRecord && (
        <ConfirmDelete
          record={pendingDeleteRecord}
          onYes={confirmDelete}
          onNo={cancelDelete}
        />
      )}

      {storageWarning && <p className="notice" role="status">This browser could not save changes. Your list may not survive a refresh.</p>}

      {view === 'listings' && selectedRecord && (
        <ListingDetails record={selectedRecord} onEdit={startEdit} onDelete={requestDelete} onClose={() => setSelectedId(null)} />
      )}

      {view === 'orders' && (
        <OrdersPanel
          orders={orders}
          listings={records}
          error={orderError}
          onAccept={acceptMyOrder}
          onDecline={declineMyOrder}
          onCancel={cancelMyOrder}
          onComplete={completeMyOrder}
        />
      )}

      {view === 'listings' && (
      <ListingList
        records={visibleRecords}
        totalCount={records.length}
        filters={filters}
        sort={sort}
        sortOptions={SELLER_SORT_OPTIONS}
        onSortChange={(event) => setSort(event.target.value)}
        isFiltering={isFiltering}
        onFilterChange={handleFilterChange}
        onClearFilters={() => setFilters(emptyFilters)}
        onAddFirst={focusForm}
        headerAction={profileComplete && !formOpen ? <button type="button" className="add-listing" onClick={openForm}>+ Add a listing</button> : null}
        onView={setSelectedId}
        onEdit={startEdit}
        onToggleStatus={toggleStatus}
        onTogglePaused={togglePaused}
        onDelete={requestDelete}
      />
      )}
      <footer><p>Listings are saved in this browser only. Browser storage is local to this origin and is not a secure or shared database.</p></footer>
    </main>
  )
}
