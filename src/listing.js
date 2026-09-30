export const ANIMAL_TYPES = ['Cattle', 'Goats', 'Sheep', 'Poultry', 'Pigs', 'Other']
export const MAX_DESCRIPTION = 500
export const STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'sold', label: 'Sold' },
]

// Field order matches the form, so the first error is the first field to fix.
export const FIELD_IDS = {
  animalType: 'listing-animal-type',
  quantity: 'listing-quantity',
  price: 'listing-price',
  location: 'listing-location',
  status: 'listing-status',
  description: 'listing-description',
  photo: 'listing-photo',
}

export function validateListing(form) {
  const errors = {}
  const quantity = form.quantity.trim()
  const price = form.price.trim()

  if (!form.animalType) errors.animalType = 'Select an animal type.'

  if (!quantity) errors.quantity = 'Enter the quantity.'
  else if (!/^\d+$/.test(quantity) || Number(quantity) < 1) errors.quantity = 'Quantity must be a whole number greater than 0.'

  if (!price) errors.price = 'Enter a price.'
  else if (!/^\d+(\.\d{1,2})?$/.test(price)) errors.price = 'Price must be a valid amount, such as 250 or 250.50.'

  if (!form.location.trim()) errors.location = 'Enter the location.'

  if (!STATUSES.some((status) => status.value === form.status)) errors.status = 'Select whether the listing is available or sold.'

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
