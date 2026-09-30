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
  quantity: 'listing-quantity',
  currency: 'listing-currency',
  price: 'listing-price',
  bulkPrice: 'listing-bulk-price',
  location: 'listing-location',
  status: 'listing-status',
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

  if (!quantity) errors.quantity = 'Enter the quantity.'
  else if (!/^\d+$/.test(quantity) || Number(quantity) < 1) errors.quantity = 'Quantity must be a whole number greater than 0.'

  if (!isKnownCurrency(form.currency)) errors.currency = 'Select a currency.'

  if (!price) errors.price = 'Enter the price per animal.'
  else if (!AMOUNT.test(price)) errors.price = 'Price must be a valid amount, such as 250 or 250.50.'

  if (bulkPrice && !AMOUNT.test(bulkPrice)) errors.bulkPrice = 'Bulk price must be a valid amount, such as 2400 or 2400.50.'

  if (!form.location.trim()) errors.location = 'Enter the location.'

  if (!STATUSES.some((status) => status.value === form.status)) errors.status = 'Select whether the listing is available or sold.'

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

// Listings have no separate name, so "name" is the animal type. Ties fall back
// to newest first so the order stays predictable.
export function sortRecords(records, sort) {
  const newestFirst = (a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
  const byName = (a, b) => a.animalType.localeCompare(b.animalType, undefined, { sensitivity: 'base' })
  const compare = {
    newest: newestFirst,
    'name-asc': (a, b) => byName(a, b) || newestFirst(a, b),
    'name-desc': (a, b) => byName(b, a) || newestFirst(a, b),
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
