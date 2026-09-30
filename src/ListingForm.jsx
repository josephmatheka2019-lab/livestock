import { useEffect, useRef } from 'react'
import { ANIMAL_TYPES, MAX_DESCRIPTION, STATUSES } from './listing.js'

function FieldError({ name, errors }) {
  if (!errors[name]) return null
  return <p className="error" id={`${name}-error`} role="alert">{errors[name]}</p>
}

export default function ListingForm({ form, errors, isEditing, onChange, onPhotoChange, onPhotoRemove, onSubmit, onCancel }) {
  const photoInput = useRef(null)

  // Clear the file input's leftover file name when the form is reset or the photo removed.
  useEffect(() => {
    if (!form.photo && photoInput.current) photoInput.current.value = ''
  }, [form.photo])

  function fieldA11y(name) {
    return errors[name]
      ? { 'aria-invalid': true, 'aria-describedby': `${name}-error` }
      : {}
  }

  return (
    <section className="panel" aria-labelledby="form-heading">
      <h2 id="form-heading">{isEditing ? 'Edit listing' : 'Add a listing'}</h2>
      <form onSubmit={onSubmit} noValidate>
        <label htmlFor="listing-animal-type">Animal type <span aria-hidden="true">*</span></label>
        <select id="listing-animal-type" name="animalType" value={form.animalType} onChange={onChange}
          {...fieldA11y('animalType')}>
          <option value="">Select an animal type</option>
          {ANIMAL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <FieldError name="animalType" errors={errors} />

        <div className="field-row">
          <div>
            <label htmlFor="listing-quantity">Quantity <span aria-hidden="true">*</span></label>
            <input id="listing-quantity" name="quantity" type="number" inputMode="numeric" min="1" step="1"
              value={form.quantity} onChange={onChange} {...fieldA11y('quantity')} />
            <FieldError name="quantity" errors={errors} />
          </div>
          <div>
            <label htmlFor="listing-price">Price per animal <span aria-hidden="true">*</span></label>
            <input id="listing-price" name="price" type="number" inputMode="decimal" min="0" step="0.01"
              value={form.price} onChange={onChange} {...fieldA11y('price')} />
            <FieldError name="price" errors={errors} />
          </div>
        </div>

        <label htmlFor="listing-location">Location <span aria-hidden="true">*</span></label>
        <input id="listing-location" name="location" value={form.location} onChange={onChange} maxLength={80}
          {...fieldA11y('location')} />
        <FieldError name="location" errors={errors} />

        <label htmlFor="listing-status">Availability <span aria-hidden="true">*</span></label>
        <select id="listing-status" name="status" value={form.status} onChange={onChange} {...fieldA11y('status')}>
          {STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
        </select>
        <FieldError name="status" errors={errors} />

        <label htmlFor="listing-description">Description</label>
        <textarea id="listing-description" name="description" value={form.description} onChange={onChange}
          rows="3" maxLength={MAX_DESCRIPTION} {...fieldA11y('description')}
          aria-describedby={errors.description ? 'description-error description-hint' : 'description-hint'} />
        <FieldError name="description" errors={errors} />
        <p className="hint" id="description-hint">Optional. Do not enter sensitive personal information.</p>

        <label htmlFor="listing-photo">Photo</label>
        <input id="listing-photo" ref={photoInput} type="file" accept="image/*" onChange={onPhotoChange}
          {...fieldA11y('photo')} aria-describedby={errors.photo ? 'photo-error photo-hint' : 'photo-hint'} />
        <FieldError name="photo" errors={errors} />
        <p className="hint" id="photo-hint">Optional. JPG or PNG. It is shrunk to a small thumbnail so it fits in this browser's storage.</p>
        {form.photo && (
          <div className="photo-preview">
            <img src={form.photo} alt="Preview of the selected photo" />
            <button type="button" className="secondary" onClick={onPhotoRemove}>Remove photo</button>
          </div>
        )}

        <div className="actions">
          <button type="submit">{isEditing ? 'Save changes' : 'Add listing'}</button>
          {isEditing && <button type="button" className="secondary" onClick={onCancel}>Cancel</button>}
        </div>
      </form>
    </section>
  )
}
