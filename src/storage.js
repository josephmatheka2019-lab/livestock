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

const BUYER_PROFILE_KEY = 'livestock-buyer-profile'

export function readBuyerProfile() {
  try {
    const saved = window.localStorage.getItem(BUYER_PROFILE_KEY)
    if (!saved) return null
    const parsed = JSON.parse(saved)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function writeBuyerProfile(profile) {
  try {
    window.localStorage.setItem(BUYER_PROFILE_KEY, JSON.stringify(profile))
    return true
  } catch {
    return false
  }
}

const SAVED_KEY = 'livestock-saved-listings'

// Raw saved entries; saved.js checks and cleans them.
export function readSaved() {
  try {
    return JSON.parse(window.localStorage.getItem(SAVED_KEY))
  } catch {
    return null
  }
}

export function writeSaved(list) {
  try {
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(list))
    return true
  } catch {
    return false
  }
}

const ORDERS_KEY = 'livestock-orders'

// Raw orders; orders.js checks and cleans them. Buyers and sellers read the same list.
export function readOrders() {
  try {
    return JSON.parse(window.localStorage.getItem(ORDERS_KEY))
  } catch {
    return null
  }
}

export function writeOrders(orders) {
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
    return true
  } catch {
    return false
  }
}

const ADMIN_KEY = 'livestock-admin'

// Raw admin state (account statuses and payment holds); admin.js checks and cleans it.
export function readAdmin() {
  try {
    return JSON.parse(window.localStorage.getItem(ADMIN_KEY))
  } catch {
    return null
  }
}

export function writeAdmin(state) {
  try {
    window.localStorage.setItem(ADMIN_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

const ADMIN_SESSION_KEY = 'livestock-admin-session'

// The demo admin sign-in. sessionStorage is used on purpose: the session lasts for this tab,
// dies with it, and never touches other tabs. Checked in the browser — a demonstration only.
export function readAdminSession() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(ADMIN_SESSION_KEY))
    return saved && typeof saved === 'object' && typeof saved.email === 'string' ? saved : null
  } catch {
    return null
  }
}

export function writeAdminSession(session) {
  try {
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
    return true
  } catch {
    // Storage blocked: the session still works until the page is refreshed.
    return false
  }
}

export function clearAdminSession() {
  try {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY)
  } catch {
    // Nothing to clean up if storage is blocked.
  }
}

// Display preferences, remembered across visits: theme ('light' | 'dark') and text size
// ('small' | 'normal' | 'large'). Validated on read so damaged data cannot break a page.
const THEME_KEY = 'livestock-theme'
const TEXT_SIZE_KEY = 'livestock-text-size'
export const THEMES = ['light', 'dark']
export const TEXT_SIZES = ['small', 'normal', 'large']

export function readTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_KEY)
    if (THEMES.includes(saved)) return saved
  } catch {
    // Storage blocked: fall through to the system preference.
  }
  // No saved choice yet: follow the operating system's light/dark setting.
  try {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function writeTheme(theme) {
  if (!THEMES.includes(theme)) return false
  try {
    window.localStorage.setItem(THEME_KEY, theme)
    return true
  } catch {
    return false
  }
}

export function readTextSize() {
  try {
    const saved = window.localStorage.getItem(TEXT_SIZE_KEY)
    if (TEXT_SIZES.includes(saved)) return saved
  } catch {
    // Storage blocked: use the default size.
  }
  return 'normal'
}

export function writeTextSize(size) {
  if (!TEXT_SIZES.includes(size)) return false
  try {
    window.localStorage.setItem(TEXT_SIZE_KEY, size)
    return true
  } catch {
    return false
  }
}

// Put both preferences on <html> as data attributes, which is what the CSS keys off.
// Called before the first render so the page never flashes the wrong theme.
export function applyDisplayPreferences() {
  const root = document.documentElement
  root.dataset.theme = readTheme()
  root.dataset.textsize = readTextSize()
  return root
}

