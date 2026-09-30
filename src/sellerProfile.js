import { phoneError } from './profileRules.js'

export const MAX_BUSINESS_NAME = 80
export const MAX_PROFILE_LOCATION = 80
export const MAX_ABOUT = 300

export const emptyProfile = { businessName: '', phone: '', location: '', about: '' }

// Field ids in form order, so the first error is the first field to fix.
export const PROFILE_FIELD_IDS = {
  businessName: 'profile-name',
  phone: 'profile-phone',
  location: 'profile-location',
  about: 'profile-about',
}

export function validateProfile(values) {
  const errors = {}
  const name = values.businessName.trim()

  if (!name) errors.businessName = 'Enter your business or farm name.'
  else if (name.length > MAX_BUSINESS_NAME) errors.businessName = `Keep the name to ${MAX_BUSINESS_NAME} characters or fewer.`

  const phone = phoneError(values.phone)
  if (phone) errors.phone = phone

  if (values.location.trim().length > MAX_PROFILE_LOCATION) errors.location = `Keep the location to ${MAX_PROFILE_LOCATION} characters or fewer.`
  if (values.about.trim().length > MAX_ABOUT) errors.about = `Keep this to ${MAX_ABOUT} characters or fewer.`

  return errors
}

// A seller can post once the two details buyers need to reach them are set.
export function isProfileComplete(profile) {
  return Boolean(profile.businessName?.trim() && profile.phone?.trim())
}

export function cleanProfile(values) {
  return {
    businessName: values.businessName.trim(),
    phone: values.phone.trim(),
    location: values.location.trim(),
    about: values.about.trim(),
  }
}
