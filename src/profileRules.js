// Rules shared by the seller and buyer profiles.

// Returns an error message, or '' when the phone number is fine. Spaces, dashes, dots and
// brackets are allowed while typing; what is left must be 7-15 digits, with an optional leading +.
export function phoneError(phone) {
  const value = phone.trim()
  if (!value) return 'Enter your phone number.'
  if (!/^\+?\d{7,15}$/.test(value.replace(/[\s\-().]/g, ''))) {
    return 'Enter a valid phone number, for example 0712 345 678 or +254 712 345 678.'
  }
  return ''
}
