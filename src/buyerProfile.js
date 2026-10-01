import { phoneError } from './profileRules.js'

export const MAX_BUYER_NAME = 80
export const MAX_BUYER_LOCATION = 80

export const emptyBuyerProfile = { name: '', phone: '', location: '' }

// Field ids in form order, so the first error is the first field to fix.
export const BUYER_FIELD_IDS = {
  name: 'buyer-name',
  phone: 'buyer-phone',
  location: 'buyer-location',
}

export function validateBuyerProfile(values) {
  const errors = {}
  const name = values.name.trim()

  if (!name) errors.name = 'Enter your name.'
  else if (name.length > MAX_BUYER_NAME) errors.name = `Keep your name to ${MAX_BUYER_NAME} characters or fewer.`

  const phone = phoneError(values.phone)
  if (phone) errors.phone = phone

  if (values.location.trim().length > MAX_BUYER_LOCATION) errors.location = `Keep the location to ${MAX_BUYER_LOCATION} characters or fewer.`

  return errors
}

// A buyer needs a name and phone number before they can order or contact sellers.
export function isBuyerProfileComplete(profile) {
  return Boolean(profile.name?.trim() && profile.phone?.trim())
}

export function cleanBuyerProfile(values) {
  return {
    name: values.name.trim(),
    phone: values.phone.trim(),
    location: values.location.trim(),
  }
}
