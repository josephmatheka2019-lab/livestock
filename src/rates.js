// Exchange rates for showing prices in a buyer's own currency.
//
// Free, keyless daily rates from the fawazahmed0 currency-api (served by jsDelivr, with a
// second address as a backup). Every rate is "units of that currency per 1 US dollar".
// Rates are cached for 12 hours, so buyers make at most a couple of requests a day.
const SOURCES = [
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
  'https://latest.currency-api.pages.dev/v1/currencies/usd.json',
]
const CACHE_KEY = 'livestock-exchange-rates'
const MAX_AGE_MS = 12 * 60 * 60 * 1000
const TIMEOUT_MS = 8000

export function readCachedRates() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(CACHE_KEY))
    if (saved && typeof saved.rates === 'object' && saved.rates && Number.isFinite(saved.fetchedAt)) return saved
  } catch {
    // Storage blocked or the saved value is damaged: behave as if nothing is cached.
  }
  return null
}

function saveRates(entry) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // Rates still work for this visit; they just will not be remembered.
  }
}

async function fetchFrom(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error(`Rates request failed (${response.status})`)
    const data = await response.json()
    const rates = data?.usd
    if (!rates || typeof rates !== 'object' || !(rates.usd > 0)) throw new Error('Rates response was not in the expected form')
    return { date: String(data.date ?? ''), rates, fetchedAt: Date.now() }
  } finally {
    clearTimeout(timer)
  }
}

// Returns { rates, date, stale }. "stale" means the network failed and older saved rates were used.
// Throws only when there is no network and nothing saved.
export async function loadRates() {
  const cached = readCachedRates()
  if (cached && Date.now() - cached.fetchedAt < MAX_AGE_MS) return { ...cached, stale: false }

  let lastError
  for (const url of SOURCES) {
    try {
      const fresh = await fetchFrom(url)
      saveRates(fresh)
      return { ...fresh, stale: false }
    } catch (error) {
      lastError = error
    }
  }
  if (cached) return { ...cached, stale: true }
  throw lastError ?? new Error('Could not load exchange rates')
}

// Converts an amount between two currency codes, or returns null if either has no rate.
export function convert(amount, from, to, rates) {
  if (from === to) return amount
  const fromRate = rates?.[from.toLowerCase()]
  const toRate = rates?.[to.toLowerCase()]
  if (!(fromRate > 0) || !(toRate > 0)) return null
  return (amount / fromRate) * toRate
}
