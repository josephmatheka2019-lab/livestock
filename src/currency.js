import { convert } from './rates.js'

export const DEFAULT_CURRENCY = 'KES'

// Shown first in the dropdown; everything else follows alphabetically by name.
const COMMON = ['KES', 'USD', 'EUR', 'GBP', 'KWD', 'UGX', 'TZS', 'RWF', 'ETB', 'ZAR', 'NGN', 'GHS', 'AED', 'SAR', 'INR', 'CNY', 'JPY', 'CAD', 'AUD']

function allCodes() {
  try {
    const codes = Intl.supportedValuesOf('currency')
    if (codes?.length) return codes
  } catch {
    // Older browsers lack supportedValuesOf; fall back to the common list.
  }
  return COMMON
}

function currencyName(code) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'currency' }).of(code) ?? code
  } catch {
    return code
  }
}

const named = allCodes().map((code) => ({ code, name: currencyName(code) }))
const byCode = new Map(named.map((currency) => [currency.code, currency]))

export const COMMON_CURRENCIES = COMMON.filter((code) => byCode.has(code)).map((code) => byCode.get(code))
export const OTHER_CURRENCIES = named
  .filter((currency) => !COMMON.includes(currency.code))
  .sort((a, b) => a.name.localeCompare(b.name))

export function isKnownCurrency(code) {
  return byCode.has(code)
}

export function describeCurrency(code) {
  const currency = byCode.get(code)
  return currency ? `${currency.code} – ${currency.name}` : code
}

export function formatMoney(value, code = DEFAULT_CURRENCY) {
  const number = Number(value)
  if (value === '' || value == null || Number.isNaN(number)) return ''
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency: code }).format(number)
  } catch {
    return `${code} ${number.toLocaleString('en')}`
  }
}

// The buyer's chosen display currency, as { currency, rates }, or null to show the seller's own prices.
// Returns the text to show and, when it was converted, the seller's original price for reference.
export function moneyParts(value, code = DEFAULT_CURRENCY, display = null) {
  const original = formatMoney(value, code)
  if (!original || !display?.rates || !display.currency || display.currency === code) {
    return { text: original, original: null }
  }
  const converted = convert(Number(value), code, display.currency, display.rates)
  if (converted == null || Number.isNaN(converted)) return { text: original, original: null }
  return { text: '≈ ' + formatMoney(converted, display.currency), original }
}

// One string, for places that show a single figure: "≈ $61.94 (KES 8,000.00)".
export function moneyLabel(value, code, display) {
  const { text, original } = moneyParts(value, code, display)
  return original ? text + ' (' + original + ')' : text
}
