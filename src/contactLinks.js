// Contact shortcuts for the admin page: turn a saved phone number into a link the browser
// can dial and a link WhatsApp can open. The trader pages deliberately never show a phone
// number, so these helpers are used by the admin only (support and moderation).

// The marketplace is Kenyan today (prices in KES, M-Pesa payments), so a local number
// written as 0712 345 678 is dialled abroad as 254712345678 for WhatsApp. A number saved
// with a leading + keeps its own country code and is never touched.
const DEFAULT_COUNTRY_CODE = '254'

// Keeps digits and a leading +; strips the spaces, dashes, dots and brackets that the
// profile forms allow while typing.
function cleanPhone(phone) {
  return String(phone ?? '').trim().replace(/[^\d+]/g, '')
}

// True when the number is one the profile rules accept: 7 to 15 digits, optional leading +.
function isDialable(value) {
  return /^\+?\d{7,15}$/.test(value)
}

// `tel:` link as the user typed it, minus the decoration: tel:0712345678 or tel:+254712345678.
// Returns '' when there is nothing worth dialling, so callers can hide the button.
export function callHref(phone) {
  const value = cleanPhone(phone)
  if (!isDialable(value)) return ''
  return `tel:${value}`
}

// `https://wa.me/<digits>` in international form with no + and no leading zero, which is
// what WhatsApp expects. Returns '' when the number cannot be turned into one.
export function whatsappHref(phone) {
  const value = cleanPhone(phone).replace(/^\+/, '')
  if (!/^\d{7,15}$/.test(value)) return ''
  const international = value.startsWith('0') ? DEFAULT_COUNTRY_CODE + value.slice(1) : value
  return `https://wa.me/${international}`
}
