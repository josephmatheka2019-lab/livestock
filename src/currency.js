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
