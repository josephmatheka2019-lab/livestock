import { useEffect, useState } from 'react'
import { readRecords, writeRecords } from './storage.js'
import { FIELD_IDS, matchesFilters, sortRecords, validateListing } from './listing.js'
import { DEFAULT_CURRENCY } from './currency.js'
import { processPhoto } from './photo.js'
import ListingForm from './ListingForm.jsx'
import ListingDetails from './ListingDetails.jsx'
import ListingList from './ListingList.jsx'

const emptyFilters = { animalType: '', location: '', status: '' }
const emptyForm = {
  animalType: '', quantity: '', currency: DEFAULT_CURRENCY, price: '', bulkPrice: '',
  location: '', status: 'available', paymentMethods: [], description: '', photo: '',
}

function cleanForm(form) {
  return {
    animalType: form.animalType,
    quantity: form.quantity.trim(),
    currency: form.currency,
    price: form.price.trim(),
    bulkPrice: form.bulkPrice.trim(),
    location: form.location.trim(),
    status: form.status,
    paymentMethods: form.paymentMethods,
    description: form.description.trim(),
    photo: form.photo,
  }
}

export default function App() {
  const [records, setRecords] = useState(readRecords)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [filters, setFilters] = useState(emptyFilters)
  const [sort, setSort] = useState('newest')
  const [announcement, setAnnouncement] = useState({ text: '', count: 0 })
  const [storageWarning, setStorageWarning] = useState(false)

  useEffect(() => {
    setStorageWarning(!writeRecords(records))
  }, [records])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
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
        record.id === editingId ? { ...record, ...fields } : record,
      ))
      setEditingId(null)
    } else {
      setRecords((current) => [
        { id: crypto.randomUUID(), ...fields, createdAt: new Date().toISOString() },
        ...current,
      ])
    }
    announce(editingId ? 'Listing updated.' : 'Listing added.')
    setForm(emptyForm)
    setErrors({})
  }

  function startEdit(record) {
    setEditingId(record.id)
    setForm({
      animalType: record.animalType,
      quantity: record.quantity,
      currency: record.currency ?? DEFAULT_CURRENCY,
      price: record.price,
      bulkPrice: record.bulkPrice ?? '',
      location: record.location,
      status: record.status ?? 'available',
      paymentMethods: record.paymentMethods ?? [],
      description: record.description,
      photo: record.photo ?? '',
    })
    setErrors({})
    document.getElementById('listing-animal-type')?.focus()
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setErrors({})
  }

  function toggleStatus(id) {
    const target = records.find((record) => record.id === id)
    if (target) {
      const nowSold = (target.status ?? 'available') !== 'sold'
      announce(`${target.animalType} listing marked as ${nowSold ? 'sold' : 'available'}.`)
    }
    setRecords((current) => current.map((record) =>
      record.id === id
        ? { ...record, status: (record.status ?? 'available') === 'sold' ? 'available' : 'sold' }
        : record,
    ))
  }

  function handleFilterChange(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function focusForm() {
    document.getElementById('listing-animal-type')?.focus()
  }

  function deleteRecord(id) {
    setRecords((current) => current.filter((record) => record.id !== id))
    if (editingId === id) cancelEdit()
    if (selectedId === id) setSelectedId(null)
    announce('Listing deleted.')
    document.getElementById('records-heading')?.focus()
  }

  const isFiltering = Object.values(filters).some((value) => value.trim() !== '')
  const visibleRecords = sortRecords(records.filter((record) => matchesFilters(record, filters)), sort)
  const selectedRecord = records.find((record) => record.id === selectedId)

  return (
    <main className="shell">
      <header className="hero">
        <p className="eyebrow">FOR SMALL-SCALE FARMERS</p>
        <h1>Local Livestock Marketplace</h1>
        <p className="intro">Keep track of the animals you have available for bulk sale: add listings, update them and remove them once they are gone.</p>
      </header>

      <ListingForm
        form={form}
        errors={errors}
        isEditing={Boolean(editingId)}
        onChange={handleChange}
        onTogglePayment={togglePayment}
        onPhotoChange={handlePhotoChange}
        onPhotoRemove={removePhoto}
        onSubmit={handleSubmit}
        onCancel={cancelEdit}
      />

      <div className="visually-hidden" role="status" aria-live="polite">
        <span key={announcement.count}>{announcement.text}</span>
      </div>

      {storageWarning && <p className="notice" role="status">This browser could not save changes. Your list may not survive a refresh.</p>}

      {selectedRecord && (
        <ListingDetails record={selectedRecord} onEdit={startEdit} onDelete={deleteRecord} onClose={() => setSelectedId(null)} />
      )}

      <ListingList
        records={visibleRecords}
        totalCount={records.length}
        filters={filters}
        sort={sort}
        onSortChange={(event) => setSort(event.target.value)}
        isFiltering={isFiltering}
        onFilterChange={handleFilterChange}
        onClearFilters={() => setFilters(emptyFilters)}
        onAddFirst={focusForm}
        onView={setSelectedId}
        onEdit={startEdit}
        onToggleStatus={toggleStatus}
        onDelete={deleteRecord}
      />
      <footer><p>Listings are saved in this browser only. Browser storage is local to this origin and is not a secure or shared database.</p></footer>
    </main>
  )
}
