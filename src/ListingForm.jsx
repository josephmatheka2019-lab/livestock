import { useEffect, useRef } from 'react'
import AnimalTypeOptions from './AnimalTypeOptions.jsx'
import ListingPreview from './ListingPreview.jsx'
import { COMMON_CURRENCIES, OTHER_CURRENCIES } from './currency.js'
import { MAX_AGE, MAX_BREED, MAX_DESCRIPTION, MAX_OTHER_ANIMAL, PAYMENT_METHODS, STATUSES } from './listing.js'

function FieldError({ name, errors }) {
  if (!errors[name]) return null
  return <p className="error" id={`${name}-error`} role="alert">{errors[name]}</p>
}

export default function ListingForm({ form, profile, errors, isEditing, onChange, onTogglePayment, onPhotoChange, onPhotoRemove, onSubmit, onCancel }) {
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
    <section className="panel form-panel" aria-labelledby="form-heading">
      <h2 id="form-heading">{isEditing ? 'Edit listing' : 'Add a listing'}</h2>
      <form onSubmit={onSubmit} noValidate>
        <label htmlFor="listing-animal-type">Animal type <span aria-hidden="true">*</span></label>
        <select id="listing-animal-type" name="animalType" value={form.animalType} onChange={onChange}
          {...fieldA11y('animalType')}>
          <option value="">Select an animal type</option>
          <AnimalTypeOptions />
        </select>
        <FieldError name="animalType" errors={errors} />

        {form.animalType === 'Other' && (
          <>
            <label htmlFor="listing-other-animal">Which animal? <span aria-hidden="true">*</span></label>
            <input id="listing-other-animal" name="otherAnimal" value={form.otherAnimal} onChange={onChange}
              maxLength={MAX_OTHER_ANIMAL} {...fieldA11y('otherAnimal')} />
            <FieldError name="otherAnimal" errors={errors} />
          </>
        )}

        <div className="field-row">
          <div>
            <label htmlFor="listing-quantity">Quantity <span aria-hidden="true">*</span></label>
            <input id="listing-quantity" name="quantity" type="number" inputMode="numeric" min="1" step="1"
              value={form.quantity} onChange={onChange} {...fieldA11y('quantity')} />
            <FieldError name="quantity" errors={errors} />
          </div>
          <div>
            <label htmlFor="listing-currency">Currency <span aria-hidden="true">*</span></label>
            <select id="listing-currency" name="currency" value={form.currency} onChange={onChange} {...fieldA11y('currency')}>
              <optgroup label="Common currencies">
                {COMMON_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} – {c.name}</option>)}
              </optgroup>
              <optgroup label="All other currencies">
                {OTHER_CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} – {c.name}</option>)}
              </optgroup>
            </select>
            <FieldError name="currency" errors={errors} />
          </div>
        </div>

        <div className="field-row">
          <div>
            <label htmlFor="listing-price">Price per animal <span aria-hidden="true">*</span></label>
            <input id="listing-price" name="price" type="number" inputMode="decimal" min="0" step="any"
              value={form.price} onChange={onChange} {...fieldA11y('price')} />
            <FieldError name="price" errors={errors} />
          </div>
          <div>
            <label htmlFor="listing-bulk-price">Bulk price for the whole lot</label>
            <input id="listing-bulk-price" name="bulkPrice" type="number" inputMode="decimal" min="0" step="any"
              value={form.bulkPrice} onChange={onChange} {...fieldA11y('bulkPrice')}
              aria-describedby={errors.bulkPrice ? 'bulkPrice-error bulk-hint' : 'bulk-hint'} />
            <FieldError name="bulkPrice" errors={errors} />
          </div>
        </div>
        <p className="hint" id="bulk-hint">Optional. One total price for all {form.quantity || 'the'} animals, if you offer a deal to bulk buyers.</p>

        <label htmlFor="listing-location">Location <span aria-hidden="true">*</span></label>
        <input id="listing-location" name="location" value={form.location} onChange={onChange} maxLength={80}
          {...fieldA11y('location')} />
        <FieldError name="location" errors={errors} />

        <label htmlFor="listing-status">Availability <span aria-hidden="true">*</span></label>
        <select id="listing-status" name="status" value={form.status} onChange={onChange} {...fieldA11y('status')}>
          {STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
        </select>
        <FieldError name="status" errors={errors} />

        <div className="field-row">
          <div>
            <label htmlFor="listing-breed">Breed</label>
            <input id="listing-breed" name="breed" value={form.breed} onChange={onChange} maxLength={MAX_BREED}
              {...fieldA11y('breed')} />
            <FieldError name="breed" errors={errors} />
          </div>
          <div>
            <label htmlFor="listing-age">Age</label>
            <input id="listing-age" name="age" value={form.age} onChange={onChange} maxLength={MAX_AGE}
              placeholder="e.g. 8 months" {...fieldA11y('age')} />
            <FieldError name="age" errors={errors} />
          </div>
        </div>

        <label htmlFor="listing-weight">Average weight per animal (kg)</label>
        <input id="listing-weight" name="weight" type="number" inputMode="decimal" min="0" step="any"
          value={form.weight} onChange={onChange} {...fieldA11y('weight')} />
        <FieldError name="weight" errors={errors} />

        <fieldset className="checkbox-group">
          <legend>Health and terms</legend>
          {[
            ['vaccinated', 'Animals are vaccinated'],
            ['healthCertificate', 'Health certificate available'],
            ['negotiable', 'Price is negotiable'],
            ['delivery', 'Delivery offered'],
          ].map(([name, label]) => (
            <label className="check" key={name} htmlFor={`listing-${name}`}>
              <input id={`listing-${name}`} name={name} type="checkbox" checked={form[name]} onChange={onChange} />
              {label}
            </label>
          ))}
        </fieldset>

        <fieldset className="checkbox-group" aria-describedby={errors.paymentMethods ? 'paymentMethods-error' : undefined}>
          <legend>Accepted payment methods <span aria-hidden="true">*</span></legend>
          {PAYMENT_METHODS.map((method) => (
            <label className="check" key={method.value} htmlFor={`listing-payment-${method.value}`}>
              <input id={`listing-payment-${method.value}`} type="checkbox" checked={form.paymentMethods.includes(method.value)}
                onChange={() => onTogglePayment(method.value)} />
              {method.label}
            </label>
          ))}
          <FieldError name="paymentMethods" errors={errors} />
        </fieldset>

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

        <ListingPreview form={form} profile={profile} />

        <div className="actions">
          <button type="submit">{isEditing ? 'Save changes' : 'Add listing'}</button>
          <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  )
}
