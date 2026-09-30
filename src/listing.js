export const ANIMAL_TYPES = ['Cattle', 'Goats', 'Sheep', 'Poultry', 'Pigs', 'Other']
export const MAX_DESCRIPTION = 500

// Field order matches the form, so the first error is the first field to fix.
export const FIELD_IDS = {
  animalType: 'listing-animal-type',
  quantity: 'listing-quantity',
  price: 'listing-price',
  location: 'listing-location',
  description: 'listing-description',
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

  if (form.description.trim().length > MAX_DESCRIPTION) {
    errors.description = `Description must be ${MAX_DESCRIPTION} characters or fewer.`
  }

  return errors
}
