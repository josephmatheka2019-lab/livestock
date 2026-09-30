const STORAGE_KEY = 'livestock-listings'

export function readRecords() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeRecords(records) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    return true
  } catch {
    return false
  }
}

const PROFILE_KEY = 'livestock-seller-profile'

export function readProfile() {
  try {
    const saved = window.localStorage.getItem(PROFILE_KEY)
    if (!saved) return null
    const parsed = JSON.parse(saved)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeProfile(profile) {
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    return true
  } catch {
    return false
  }
}

const DISPLAY_CURRENCY_KEY = 'livestock-display-currency'

// The currency a buyer last chose to see prices in ('' means each seller's own currency).
export function readDisplayCurrency() {
  try {
    const saved = window.localStorage.getItem(DISPLAY_CURRENCY_KEY)
    return /^[A-Z]{3}$/.test(saved ?? '') ? saved : ''
  } catch {
    return ''
  }
}

export function writeDisplayCurrency(code) {
  try {
    window.localStorage.setItem(DISPLAY_CURRENCY_KEY, code)
  } catch {
    // The choice still applies for this visit; it just is not remembered.
  }
}
