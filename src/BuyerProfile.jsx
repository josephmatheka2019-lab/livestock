import { useEffect, useRef, useState } from 'react'
import {
  BUYER_FIELD_IDS, cleanBuyerProfile, emptyBuyerProfile, isBuyerProfileComplete, MAX_BUYER_LOCATION,
  MAX_BUYER_NAME, validateBuyerProfile,
} from './buyerProfile.js'

function FieldError({ name, errors }) {
  if (!errors[name]) return null
  return <p className="error" id={`buyer-${name}-error`} role="alert">{errors[name]}</p>
}

// A buyer can browse without a profile, so an unfinished one is a short invitation rather
// than a form in the way. The details are needed later, to contact sellers.
export default function BuyerProfile({ profile, onSave }) {
  const complete = isBuyerProfileComplete(profile)
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState({ ...emptyBuyerProfile, ...profile })
  const [errors, setErrors] = useState({})
  const [saveError, setSaveError] = useState('')
  const [message, setMessage] = useState('')
  const opener = useRef(null)
  const nameInput = useRef(null)

  // Move into the form when it opens from the prompt or the Edit button.
  useEffect(() => {
    if (editing) nameInput.current?.focus()
  }, [editing])

  function field(name) {
    return errors[name]
      ? { 'aria-invalid': true, 'aria-describedby': `buyer-${name}-error` }
      : {}
  }

  function open() {
    setValues({ ...emptyBuyerProfile, ...profile })
    setErrors({})
    setSaveError('')
    setMessage('')
    setEditing(true)
  }

  function close() {
    setEditing(false)
    setErrors({})
    setSaveError('')
    // The form is about to disappear, so hand focus back to the button that opened it.
    setTimeout(() => opener.current?.focus(), 0)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      if (!current[name]) return current
      const { [name]: _cleared, ...rest } = current
      return rest
    })
    setSaveError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    const found = validateBuyerProfile(values)
    const firstInvalid = Object.keys(BUYER_FIELD_IDS).find((name) => found[name])
    if (firstInvalid) {
      setErrors(found)
      document.getElementById(BUYER_FIELD_IDS[firstInvalid])?.focus()
      return
    }
    if (!onSave(cleanBuyerProfile(values))) {
      setSaveError('This browser could not save your details. Check that storage is not blocked, then try again.')
      return
    }
    setMessage('Your details were saved.')
    close()
  }

  const status = <p className="visually-hidden" role="status">{message}</p>

  if (editing) {
    return (
      <section className="panel profile" aria-labelledby="buyer-profile-heading">
        <p className="eyebrow">YOUR DETAILS</p>
        <h2 id="buyer-profile-heading">{complete ? 'Edit your details' : 'Add your details'}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="buyer-name">Your name <span aria-hidden="true">*</span></label>
          <input id="buyer-name" name="name" ref={nameInput} value={values.name} onChange={handleChange}
            maxLength={MAX_BUYER_NAME} autoComplete="name" {...field('name')} />
          <FieldError name="name" errors={errors} />

          <label htmlFor="buyer-phone">Phone number <span aria-hidden="true">*</span></label>
          <input id="buyer-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel"
            value={values.phone} onChange={handleChange} {...field('phone')}
            aria-describedby={errors.phone ? 'buyer-phone-error' : 'buyer-phone-hint'} />
          <FieldError name="phone" errors={errors} />
          <p className="hint" id="buyer-phone-hint">Include the country code if you can, for example +254 712 345 678.</p>

          <label htmlFor="buyer-location">Location</label>
          <input id="buyer-location" name="location" value={values.location} onChange={handleChange}
            maxLength={MAX_BUYER_LOCATION} autoComplete="address-level2" {...field('location')} />
          <FieldError name="location" errors={errors} />
          <p className="hint">Saved in this browser only.</p>

          {saveError && <p className="error" role="alert">{saveError}</p>}

          <div className="actions">
            <button type="submit">{complete ? 'Save changes' : 'Save my details'}</button>
            <button type="button" className="secondary" onClick={close}>Cancel</button>
          </div>
        </form>
      </section>
    )
  }

  if (!complete) {
    return (
      <section className="panel profile" aria-labelledby="buyer-profile-heading">
        <p className="eyebrow">YOUR DETAILS</p>
        <h2 id="buyer-profile-heading">Add your details to contact sellers</h2>
        <p className="profile-note">
          You can browse without them. A name and phone number are needed when you want to reach a seller.
        </p>
        <div className="actions">
          <button type="button" ref={opener} onClick={open}>Add my details</button>
        </div>
        {status}
      </section>
    )
  }

  return (
    <section className="panel profile" aria-labelledby="buyer-profile-heading">
      <div className="profile-head">
        <div>
          <p className="eyebrow">YOUR DETAILS</p>
          <h2 id="buyer-profile-heading">{profile.name}</h2>
        </div>
        <span className="badge badge-available">Ready to contact sellers</span>
      </div>
      <dl className="detail-grid">
        <div><dt>Phone</dt><dd>{profile.phone}</dd></div>
        <div><dt>Location</dt><dd>{profile.location || 'Not given'}</dd></div>
      </dl>
      <div className="actions">
        <button type="button" className="secondary" ref={opener} onClick={open}>Edit my details</button>
      </div>
      {status}
    </section>
  )
}
