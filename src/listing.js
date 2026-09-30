import { isKnownCurrency } from './currency.js'

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
  if (filters.status && (record.status ?? 'available') !== filters.status) return false
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
export function sortRecords(records, sort) {
  const newestFirst = (a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
  const byName = (a, b) => animalLabel(a).localeCompare(animalLabel(b), undefined, { sensitivity: 'base' })
  const compare = {
    newest: newestFirst,
    'name-asc': (a, b) => byName(a, b) || newestFirst(a, b),
    'name-desc': (a, b) => byName(b, a) || newestFirst(a, b),
    // Latest sale first; listings with no sale date (still available, or sold before dates were kept) go last.
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
  const summary = { total: records.length, available: 0, sold: 0, availableValue: {}, soldValue: {} }
  for (const record of records) {
    const isSold = record.status === 'sold'
    summary[isSold ? 'sold' : 'available'] += 1
    const value = Number(record.quantity) * Number(record.price)
    if (!Number.isFinite(value)) continue
    const bucket = isSold ? summary.soldValue : summary.availableValue
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
  return next
}

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
