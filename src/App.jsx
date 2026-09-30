import { useEffect, useState } from 'react'
import { readRecords, writeRecords } from './storage.js'
import { FIELD_IDS, validateListing } from './listing.js'
import ListingForm from './ListingForm.jsx'
import ListingList from './ListingList.jsx'

const emptyForm = { animalType: '', quantity: '', price: '', location: '', description: '' }

function cleanForm(form) {
  return {
    animalType: form.animalType,
    quantity: form.quantity.trim(),
    price: form.price.trim(),
    location: form.location.trim(),
    description: form.description.trim(),
  }
}

export default function App() {
  const [records, setRecords] = useState(readRecords)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
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
    setForm(emptyForm)
    setErrors({})
  }

  function startEdit(record) {
    setEditingId(record.id)
    setForm({
      animalType: record.animalType,
      quantity: record.quantity,
      price: record.price,
      location: record.location,
      description: record.description,
    })
    setErrors({})
    document.getElementById('listing-animal-type')?.focus()
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setErrors({})
  }

  function deleteRecord(id) {
    setRecords((current) => current.filter((record) => record.id !== id))
    if (editingId === id) cancelEdit()
  }

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
        onSubmit={handleSubmit}
        onCancel={cancelEdit}
      />

      {storageWarning && <p className="notice" role="status">This browser could not save changes. Your list may not survive a refresh.</p>}

      <ListingList records={records} onEdit={startEdit} onDelete={deleteRecord} />
      <footer><p>Listings are saved in this browser only. Browser storage is local to this origin and is not a secure or shared database.</p></footer>
    </main>
  )
}
