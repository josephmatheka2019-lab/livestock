import { isKnownCurrency } from './currency.js'
import { convert } from './rates.js'

export const ANIMAL_GROUPS = [
  { label: 'Cattle, buffalo and yaks', types: ['Cattle', 'Dairy cattle', 'Beef cattle', 'Bulls', 'Cows', 'Heifers', 'Calves', 'Oxen', 'Buffalo', 'Bison', 'Yaks'] },
  { label: 'Sheep and goats', types: ['Sheep', 'Lambs', 'Goats', 'Dairy goats'] },
  { label: 'Pigs', types: ['Pigs', 'Piglets'] },
  { label: 'Poultry and birds', types: ['Poultry', 'Broiler chickens', 'Layer chickens', 'Indigenous chickens', 'Ducks', 'Geese', 'Turkeys', 'Guinea fowl', 'Quails', 'Pigeons', 'Ostriches', 'Emus'] },
  { label: 'Horses and donkeys', types: ['Horses', 'Ponies', 'Donkeys', 'Mules'] },
  { label: 'Camels and llamas', types: ['Camels', 'Llamas', 'Alpacas'] },
  { label: 'Other farm animals', types: ['Rabbits', 'Guinea pigs', 'Deer', 'Reindeer', 'Tilapia', 'Catfish', 'Bee colonies', 'Snails'] },
]
// "Other" stays last, in case an animal is missing from the groups above.
export const ANIMAL_TYPES = [...ANIMAL_GROUPS.flatMap((group) => group.types), 'Other']

export const MAX_DESCRIPTION = 500
export const MAX_OTHER_ANIMAL = 60
export const MAX_BREED = 60
export const MAX_AGE = 40

// The name shown for a listing: the typed-in animal when "Other" was chosen.
export function animalLabel(record) {
  return record.animalType === 'Other' && record.otherAnimal ? record.otherAnimal : record.animalType
}
export const STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'Sold' },
]
export const PAYMENT_METHODS = [
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'card', label: 'Credit card' },
  { value: 'cash', label: 'Cash' },
]

// Field order matches the form, so the first error is the first field to fix.
export const FIELD_IDS = {
  animalType: 'listing-animal-type',
  otherAnimal: 'listing-other-animal',
  quantity: 'listing-quantity',
  currency: 'listing-currency',
  price: 'listing-price',
  bulkPrice: 'listing-bulk-price',
  location: 'listing-location',
  status: 'listing-status',
  breed: 'listing-breed',
  age: 'listing-age',
  weight: 'listing-weight',
  paymentMethods: 'listing-payment-mpesa',
  description: 'listing-description',
  photo: 'listing-photo',
}

// Up to three decimals, because some currencies (such as the Kuwaiti dinar) use them.
const AMOUNT = /^\d+(\.\d{1,3})?$/

export function validateListing(form) {
  const errors = {}
  const quantity = form.quantity.trim()
  const price = form.price.trim()
  const bulkPrice = form.bulkPrice.trim()

  if (!form.animalType) errors.animalType = 'Select an animal type.'

  if (form.animalType === 'Other') {
    const other = form.otherAnimal.trim()
    if (!other) errors.otherAnimal = 'Type the name of the animal.'
    else if (other.length > MAX_OTHER_ANIMAL) errors.otherAnimal = `Keep the animal name to ${MAX_OTHER_ANIMAL} characters or fewer.`
  }

  if (!quantity) errors.quantity = 'Enter the quantity.'
  else if (!/^\d+$/.test(quantity) || Number(quantity) < 1) errors.quantity = 'Quantity must be a whole number greater than 0.'

  if (!isKnownCurrency(form.currency)) errors.currency = 'Select a currency.'

  if (!price) errors.price = 'Enter the price per animal.'
  else if (!AMOUNT.test(price)) errors.price = 'Price must be a valid amount, such as 250 or 250.50.'

  if (bulkPrice && !AMOUNT.test(bulkPrice)) errors.bulkPrice = 'Bulk price must be a valid amount, such as 2400 or 2400.50.'

  if (!form.location.trim()) errors.location = 'Enter the location.'

  if (!STATUSES.some((status) => status.value === form.status)) errors.status = 'Select whether the listing is available or sold.'

  if (form.breed.trim().length > MAX_BREED) errors.breed = `Keep the breed to ${MAX_BREED} characters or fewer.`
  if (form.age.trim().length > MAX_AGE) errors.age = `Keep the age to ${MAX_AGE} characters or fewer.`

  const weight = form.weight.trim()
  if (weight && (!/^\d+(\.\d{1,2})?$/.test(weight) || Number(weight) <= 0)) {
    errors.weight = 'Weight must be a number greater than 0, such as 35 or 2.5.'
  }

  const validMethods = PAYMENT_METHODS.map((method) => method.value)
  if (!form.paymentMethods.length || !form.paymentMethods.every((method) => validMethods.includes(method))) {
    errors.paymentMethods = 'Choose at least one accepted payment method.'
  }

  if (form.description.trim().length > MAX_DESCRIPTION) {
    errors.description = `Description must be ${MAX_DESCRIPTION} characters or fewer.`
  }

  return errors
}

// Listings saved before availability existed have no status, so they count as available.
export function matchesFilters(record, filters) {
  const location = filters.location.trim().toLowerCase()
  if (filters.animalType && record.animalType !== filters.animalType) return false
  if (filters.status && listingState(record) !== filters.status) return false
  if (location && !(record.location ?? '').toLowerCase().includes(location)) return false
  return true
}

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name-asc', label: 'Animal type A–Z' },
  { value: 'name-desc', label: 'Animal type Z–A' },
]
// Sellers can also look back at what sold most recently; buyers never see sold listings.
export const SELLER_SORT_OPTIONS = [...SORT_OPTIONS, { value: 'sold-recent', label: 'Recently sold' }]

// Listings have no separate name, so "name" is the animal type. Ties fall back
// to newest first so the order stays predictable.
export function sortRecords(records, sort, display = null) {
  const newestFirst = (a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
  const byName = (a, b) => animalLabel(a).localeCompare(animalLabel(b), undefined, { sensitivity: 'base' })
  const byPrice = (a, b, direction) => {
    const priceA = priceIn(a, display)
    const priceB = priceIn(b, display)
    if (priceA == null && priceB == null) return 0
    if (priceA == null) return 1
    if (priceB == null) return -1
    return (priceA - priceB) * direction
  }
  const compare = {
    newest: newestFirst,
    'name-asc': (a, b) => byName(a, b) || newestFirst(a, b),
    'name-desc': (a, b) => byName(b, a) || newestFirst(a, b),
    // Latest sale first; listings with no sale date (still available, or sold before dates were kept) go last.
    // Price sorts compare in the buyer's display currency; listings with no usable price go last either way.
    'price-asc': (a, b) => byPrice(a, b, 1) || newestFirst(a, b),
    'price-desc': (a, b) => byPrice(a, b, -1) || newestFirst(a, b),
    'sold-recent': (a, b) => String(b.soldAt ?? '').localeCompare(String(a.soldAt ?? '')) || newestFirst(a, b),
  }[sort] ?? newestFirst
  return [...records].sort(compare)
}

export function paymentLabels(methods = []) {
  return methods.map((value) => PAYMENT_METHODS.find((method) => method.value === value)?.label).filter(Boolean)
}

// How much a bulk buyer saves against paying the per-animal price for every animal (0 if none).
export function bulkSaving(record) {
  const full = Number(record.quantity) * Number(record.price)
  const bulk = Number(record.bulkPrice)
  if (!record.bulkPrice || Number.isNaN(full) || Number.isNaN(bulk)) return 0
  return bulk < full ? full - bulk : 0
}

// Short labels for the yes/no details a seller ticked.
export function termTags(record) {
  return [
    record.vaccinated && 'Vaccinated',
    record.healthCertificate && 'Health certificate',
    record.negotiable && 'Price negotiable',
    record.delivery && 'Delivery offered',
  ].filter(Boolean)
}

// Numbers for the seller's dashboard. Value is quantity x price per animal, added up
// separately for each currency because prices are never mixed across currencies.
export function summarizeListings(records) {
  const summary = { total: records.length, available: 0, paused: 0, sold: 0, availableValue: {}, soldValue: {} }
  for (const record of records) {
    const state = listingState(record)
    summary[state] += 1
    // A paused listing is not for sale right now, so its stock is left out of both values.
    if (state === 'paused') continue
    const value = Number(record.quantity) * Number(record.price)
    if (!Number.isFinite(value)) continue
    const bucket = state === 'sold' ? summary.soldValue : summary.availableValue
    const code = record.currency ?? 'KES'
    bucket[code] = Math.round(((bucket[code] ?? 0) + value) * 1000) / 1000
  }
  return summary
}

// Sets a listing's status and keeps its sale date in step: the date is stamped the moment it
// goes from available to sold, and cleared if it goes back on sale. A listing that was already
// sold keeps whatever date it had, including none for ones saved before dates were recorded.
export function withStatus(record, status, now = new Date()) {
  const next = { ...record, status }
  const wasSold = (record.status ?? 'available') === 'sold'
  if (status === 'sold' && !wasSold) next.soldAt = now.toISOString()
  if (status !== 'sold') delete next.soldAt
  // A sold listing is not "paused": selling it ends the pause, so it does not reappear paused later.
  if (status === 'sold') delete next.paused
  return next
}

// Where a listing stands: on sale, paused by the seller (hidden from buyers but kept), or sold.
// Listings saved before pausing existed have no flag, so they count as on sale.
export function listingState(record) {
  if (record.status === 'sold') return 'sold'
  return record.paused ? 'paused' : 'available'
}

// Buyers only see listings that are on sale.
export function isListedForBuyers(record) {
  return listingState(record) === 'available'
}

export function withPaused(record, paused) {
  const next = { ...record }
  if (paused) next.paused = true
  else delete next.paused
  return next
}

// The choices in the seller's availability filter: the two statuses plus Paused.
export const FILTER_STATUSES = [...STATUSES, { value: 'paused', label: 'Paused' }]

export function formatDay(iso, style = 'short') {
  const date = new Date(iso)
  if (!iso || Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { year: 'numeric', month: style, day: 'numeric' })
}

// What a buyer would pay for a number of animals, at the per-animal price, and - when they
// take the whole lot - the seller's bulk price. `error` is set when the number is not usable.
export function quoteFor(record, wanted) {
  const available = Number(record.quantity)
  const price = Number(record.price)
  const text = String(wanted ?? '').trim()

  if (!text) return { state: 'empty' }
  if (!/^\d+$/.test(text) || Number(text) < 1 || Number(text) > available) {
    return { state: 'error', message: `Enter a whole number from 1 to ${available}.` }
  }
  if (!record.price || Number.isNaN(price)) return { state: 'no-price', quantity: Number(text) }

  const quantity = Number(text)
  const fullPrice = Math.round(quantity * price * 1000) / 1000
  const hasBulk = Boolean(record.bulkPrice) && !Number.isNaN(Number(record.bulkPrice))
  const bulk = hasBulk ? Number(record.bulkPrice) : null
  const isWholeLot = quantity === available
  return {
    state: 'ok',
    quantity,
    available,
    fullPrice,
    isWholeLot,
    bulk,
    // Only the whole lot gets the bulk price; the saving is what it undercuts the per-animal total by.
    saving: isWholeLot && hasBulk && bulk < fullPrice ? Math.round((fullPrice - bulk) * 1000) / 1000 : 0,
  }
}

// Price per animal in the buyer's display currency, or null when it cannot be worked out
// (no price, no display currency chosen yet, or no exchange rate for that currency).
export function priceIn(record, display) {
  if (!display?.rates || !display.currency || !record.price) return null
  const converted = convert(Number(record.price), record.currency ?? 'KES', display.currency, display.rates)
  return converted == null || Number.isNaN(converted) ? null : converted
}

export const PRICE_SORT_OPTIONS = [
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
]

export const emptyBuyerFilters = {
  search: '', animalType: '', location: '', payment: '', minQuantity: '', minPrice: '', maxPrice: '',
  delivery: false, vaccinated: false, healthCertificate: false, negotiable: false,
}

// Reads a filter box that should hold a non-negative number; blank or unusable means "no limit".
function bound(text) {
  const value = String(text ?? '').trim()
  if (!/^\d+(\.\d+)?$/.test(value)) return null
  return Number(value)
}

export function isBuyerFiltering(filters) {
  return Object.entries(filters).some(([, value]) => (typeof value === 'boolean' ? value : String(value).trim() !== ''))
}

// Every filter that is set must match. Price limits are in the buyer's display currency, so they
// only apply once one is chosen (the filter boxes are switched off until then).
export function matchesBuyerFilters(record, filters, display = null) {
  if (!matchesFilters(record, { animalType: filters.animalType, location: filters.location, status: '' })) return false

  const words = filters.search.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length > 0) {
    const text = [animalLabel(record), record.animalType, record.breed, record.age, record.description, record.location]
      .filter(Boolean).join(' ').toLowerCase()
    if (!words.every((word) => text.includes(word))) return false
  }

  if (filters.payment && !(record.paymentMethods ?? []).includes(filters.payment)) return false

  const minQuantity = bound(filters.minQuantity)
  if (minQuantity != null && !(Number(record.quantity) >= minQuantity)) return false

  for (const flag of ['delivery', 'vaccinated', 'healthCertificate', 'negotiable']) {
    if (filters[flag] && !record[flag]) return false
  }

  const minPrice = bound(filters.minPrice)
  const maxPrice = bound(filters.maxPrice)
  if ((minPrice != null || maxPrice != null) && display) {
    const price = priceIn(record, display)
    if (price == null) return false
    if (minPrice != null && price < minPrice) return false
    if (maxPrice != null && price > maxPrice) return false
  }

  return true
}

// A listing counts as new for its first week. A date slightly in the future (a clock a minute
// fast) still counts; a date further ahead, or a missing or damaged one, does not.
export const NEW_LISTING_DAYS = 7

export function isNewListing(record, now = Date.now()) {
  const posted = Date.parse(record.createdAt)
  if (Number.isNaN(posted)) return false
  const age = now - posted
  return age >= -60 * 1000 && age <= NEW_LISTING_DAYS * 24 * 60 * 60 * 1000
}
