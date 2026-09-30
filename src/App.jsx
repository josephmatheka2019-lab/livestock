import { useEffect, useState } from 'react'
import { readRecords, writeRecords } from './storage.js'

import { ANIMAL_TYPES, FIELD_IDS, MAX_DESCRIPTION, validateListing } from './listing.js'

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

  function fieldA11y(name) {
    return errors[name]
      ? { 'aria-invalid': true, 'aria-describedby': `${name}-error` }
      : {}
  }

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

      <section className="panel" aria-labelledby="form-heading">
        <h2 id="form-heading">{editingId ? 'Edit listing' : 'Add a listing'}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="listing-animal-type">Animal type <span aria-hidden="true">*</span></label>
          <select id="listing-animal-type" name="animalType" value={form.animalType} onChange={handleChange}
            {...fieldA11y('animalType')}>
            <option value="">Select an animal type</option>
            {ANIMAL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <FieldError name="animalType" errors={errors} />

          <div className="field-row">
            <div>
              <label htmlFor="listing-quantity">Quantity <span aria-hidden="true">*</span></label>
              <input id="listing-quantity" name="quantity" type="number" inputMode="numeric" min="1" step="1"
                value={form.quantity} onChange={handleChange} {...fieldA11y('quantity')} />
              <FieldError name="quantity" errors={errors} />
            </div>
            <div>
              <label htmlFor="listing-price">Price per animal <span aria-hidden="true">*</span></label>
              <input id="listing-price" name="price" type="number" inputMode="decimal" min="0" step="0.01"
                value={form.price} onChange={handleChange} {...fieldA11y('price')} />
              <FieldError name="price" errors={errors} />
            </div>
          </div>

          <label htmlFor="listing-location">Location <span aria-hidden="true">*</span></label>
          <input id="listing-location" name="location" value={form.location} onChange={handleChange} maxLength={80}
            {...fieldA11y('location')} />
          <FieldError name="location" errors={errors} />

          <label htmlFor="listing-description">Description</label>
          <textarea id="listing-description" name="description" value={form.description} onChange={handleChange}
            rows="3" maxLength={MAX_DESCRIPTION} {...fieldA11y('description')} />
          <FieldError name="description" errors={errors} />
          <p className="hint">Optional. Do not enter sensitive personal information.</p>

          <div className="actions">
            <button type="submit">{editingId ? 'Save changes' : 'Add listing'}</button>
            {editingId && <button type="button" className="secondary" onClick={cancelEdit}>Cancel</button>}
          </div>
        </form>
      </section>

      {storageWarning && <p className="notice" role="status">This browser could not save changes. Your list may not survive a refresh.</p>}

      <section className="records" aria-labelledby="records-heading">
        <div className="section-heading">
          <div><p className="eyebrow">YOUR LOCAL DATA</p><h2 id="records-heading">Listings <span className="count">{records.length}</span></h2></div>
        </div>
        {records.length === 0 ? (
          <div className="empty"><h3>No listings yet</h3><p>Add a listing above. Saved listings stay in this browser.</p></div>
        ) : (
          <ul className="record-list">
            {records.map((record) => (
              <li className="record" key={record.id}>
                <div className="record-copy">
                  <h3>{record.animalType}</h3>
                  <p className="listing-meta">
                    {[
                      record.quantity && `Quantity: ${record.quantity}`,
                      record.price && `Price: ${record.price} each`,
                      record.location && `Location: ${record.location}`,
                    ].filter(Boolean).join(' · ')}
                  </p>
                  {record.description && <p>{record.description}</p>}
                </div>
                <div className="record-actions">
                  <button type="button" className="secondary" onClick={() => startEdit(record)}>Edit</button>
                  <button type="button" className="danger" onClick={() => deleteRecord(record.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <footer><p>Listings are saved in this browser only. Browser storage is local to this origin and is not a secure or shared database.</p></footer>
    </main>
  )
}

function FieldError({ name, errors }) {
  if (!errors[name]) return null
  return <p className="error" id={`${name}-error`} role="alert">{errors[name]}</p>
}
