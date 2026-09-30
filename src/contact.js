import { formatMoney } from './currency.js'
import { animalLabel } from './listing.js'

// The phone number with the punctuation people type (spaces, dashes, brackets) removed.
function compact(phone) {
  return phone.trim().replace(/[\s\-().]/g, '')
}

export function telHref(phone) {
  return `tel:${compact(phone)}`
}

// WhatsApp links need the number in full international form, digits only.
// "+254 712 345 678" and "00254712345678" are unambiguous. A local number starting with 0 is
// only understood when the listing is priced in Kenyan shillings, so it is taken as a Kenyan
// number. Anything else returns null and the page shows just the Call button.
export function whatsappNumber(phone, currency) {
  const number = compact(phone)
  if (number.startsWith('+')) return number.slice(1)
  if (number.startsWith('00')) return number.slice(2)
  if (number.startsWith('0')) return currency === 'KES' ? `254${number.slice(1)}` : null
  return /^\d{11,15}$/.test(number) ? number : null
}

// The opening message, written so the seller knows which listing it is about.
export function enquiryMessage(record, buyerName) {
  const price = record.price ? formatMoney(record.price, record.currency) : ''
  const detail = [record.quantity && `${record.quantity} available`, price && `${price} each`].filter(Boolean).join(', ')
  const listing = `${animalLabel(record)} listing${detail ? ` (${detail})` : ''}`
  return `Hello, I saw your ${listing} on Local Livestock Marketplace and I am interested. Thank you, ${buyerName}.`
}

export function whatsappHref(phone, currency, message) {
  const number = whatsappNumber(phone, currency)
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null
}
