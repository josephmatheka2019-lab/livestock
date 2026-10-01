import { useRef, useState } from 'react'
import {
  cleanProfile, emptyProfile, isProfileComplete, MAX_ABOUT, MAX_BUSINESS_NAME, MAX_PROFILE_LOCATION,
  PROFILE_FIELD_IDS, validateProfile,
} from './sellerProfile.js'

function FieldError({ name, errors }) {
  if (!errors[name]) return null
  return <p className="error" id={`profile-${name}-error`} role="alert">{errors[name]}</p>
}

// Shows the seller's details, or the form to fill them in. A seller who has not
// finished the profile sees the form straight away.
export default function SellerProfile({ profile, onSave }) {
  const complete = isProfileComplete(profile)
  const [editing, setEditing] = useState(false)
  const [values, setValues] = useState({ ...emptyProfile, ...profile })
  const [errors, setErrors] = useState({})
  const [saveError, setSaveError] = useState('')
  const editButton = useRef(null)
  const showForm = editing || !complete

  function field(name) {
    return errors[name]
      ? { 'aria-invalid': true, 'aria-describedby': `profile-${name}-error` }
      : {}
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

  function startEditing() {
    setValues({ ...emptyProfile, ...profile })
    setErrors({})
    setSaveError('')
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setErrors({})
    setSaveError('')
    // The form is about to disappear, so hand focus back to the button that opened it.
    setTimeout(() => editButton.current?.focus(), 0)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const found = validateProfile(values)
    const firstInvalid = Object.keys(PROFILE_FIELD_IDS).find((name) => found[name])
    if (firstInvalid) {
      setErrors(found)
      document.getElementById(PROFILE_FIELD_IDS[firstInvalid])?.focus()
      return
    }
    if (!onSave(cleanProfile(values))) {
      setSaveError('This browser could not save your profile. Check that storage is not blocked, then try again.')
      return
    }
    setEditing(false)
    setErrors({})
    setSaveError('')
    setTimeout(() => editButton.current?.focus(), 0)
  }

  if (!showForm) {
    return (
      <section className="bar profile-bar" aria-labelledby="profile-heading">
        <h2 id="profile-heading" className="bar-title" tabIndex={-1}>{profile.businessName}</h2>
        <p className="bar-text">{profile.phone}{profile.location ? ` · ${profile.location}` : ''}</p>
        <div className="bar-end">
          <button type="button" className="secondary" ref={editButton} onClick={startEditing}>Edit profile</button>
        </div>
        {profile.about && <p className="bar-text bar-about">{profile.about}</p>}
      </section>
    )
  }

  return (
    <section className="panel profile" aria-labelledby="profile-heading">
      <p className="eyebrow">YOUR SELLER PROFILE</p>
      <h2 id="profile-heading">{complete ? 'Edit your profile' : 'Set up your seller profile'}</h2>
      {!complete && (
        <p className="hint profile-lead">
          Add your business name and phone number before you post. Buyers use these to reach you.
        </p>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="profile-name">Business or farm name <span aria-hidden="true">*</span></label>
        <input id="profile-name" name="businessName" value={values.businessName} onChange={handleChange}
          maxLength={MAX_BUSINESS_NAME} autoComplete="organization" {...field('businessName')} />
        <FieldError name="businessName" errors={errors} />

        <label htmlFor="profile-phone">Phone number <span aria-hidden="true">*</span></label>
        <input id="profile-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel"
          value={values.phone} onChange={handleChange} {...field('phone')}
          aria-describedby={errors.phone ? 'profile-phone-error' : 'profile-phone-hint'} />
        <FieldError name="phone" errors={errors} />
        <p className="hint" id="profile-phone-hint">Include the country code if you can, for example +254 712 345 678.</p>

        <label htmlFor="profile-location">Location</label>
        <input id="profile-location" name="location" value={values.location} onChange={handleChange}
          maxLength={MAX_PROFILE_LOCATION} autoComplete="address-level2" {...field('location')} />
        <FieldError name="location" errors={errors} />

        <label htmlFor="profile-about">About you</label>
        <textarea id="profile-about" name="about" rows="3" value={values.about} onChange={handleChange}
          maxLength={MAX_ABOUT} {...field('about')}
          aria-describedby={errors.about ? 'profile-about-error' : 'profile-about-hint'} />
        <FieldError name="about" errors={errors} />
        <p className="hint" id="profile-about-hint">Optional. A line or two about your farm or what you sell.</p>

        {saveError && <p className="error" role="alert">{saveError}</p>}

        <div className="actions">
          <button type="submit">{complete ? 'Save changes' : 'Save profile'}</button>
          {complete && <button type="button" className="secondary" onClick={cancel}>Cancel</button>}
        </div>
      </form>
    </section>
  )
}
