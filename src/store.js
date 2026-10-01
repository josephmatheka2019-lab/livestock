// The optional paid extras: verification, listing boosts and Seller Pro. Every price is a demo
// placeholder for the owner to change (docx/Monetisation Plan.md), and payment is a demonstration
// — no money moves. State lives with the admin data (verification and Pro on the account, sales
// in the ledger); a boost lives on its listing record, because only the listing needs it.
// Nothing here is ever shown as a price to buyers: they only see the badges.

export const BOOST_DAYS = 7
export const PRO_DAYS = 30

export const STORE_PRICES = {
  verification: { amount: 500, currency: 'KES', label: 'Verified seller badge' },
  boost: { amount: 300, currency: 'KES', label: `Listing boost (${BOOST_DAYS} days)` },
  pro: { amount: 1000, currency: 'KES', label: `Seller Pro (${PRO_DAYS} days)` },
}

export const SALE_KINDS = ['verification', 'boost', 'pro']
export const SALE_KIND_LABELS = { verification: 'Verification', boost: 'Boost', pro: 'Subscription' }
const round3 = (value) => Math.round(value * 1000) / 1000
const entryFor = (admin, accountId) => admin.accounts[accountId] ?? { status: 'active', updatedAt: '' }
const withEntry = (admin, accountId, entry) => ({ ...admin, accounts: { ...admin.accounts, [accountId]: entry } })

// --- Verification: none -> pending (seller asks, paying the fee) -> verified | none (admin decides).
export const VERIFICATION_STATUSES = ['none', 'pending', 'verified']
export const VERIFICATION_LABELS = { none: 'Not verified', pending: 'Pending review', verified: 'Verified seller' }

export function verificationStatus(admin, accountId) {
  const value = admin.accounts[accountId]?.verification
  return VERIFICATION_STATUSES.includes(value) ? value : 'none'
}

export function requestVerification(admin, accountId) {
  if (verificationStatus(admin, accountId) !== 'none') {
    return { admin, error: 'This account has already asked for verification.' }
  }
  return { admin: withEntry(admin, accountId, { ...entryFor(admin, accountId), verification: 'pending' }), error: '' }
}

export function decideVerification(admin, accountId, approve) {
  if (verificationStatus(admin, accountId) !== 'pending') {
    return { admin, error: 'There is no pending verification for this account.' }
  }
  return { admin: withEntry(admin, accountId, { ...entryFor(admin, accountId), verification: approve ? 'verified' : 'none' }), error: '' }
}

// --- Seller Pro: a monthly plan. The badge and the extras follow the expiry date.
export function proUntil(admin, accountId) {
  const until = admin.accounts[accountId]?.pro?.until
  return typeof until === 'string' ? until : ''
}

export function isPro(admin, accountId, now = new Date()) {
  const until = proUntil(admin, accountId)
  return Boolean(until) && new Date(until).getTime() > now.getTime()
}

export function startPro(admin, accountId, now = new Date(), days = PRO_DAYS) {
  const until = new Date(now.getTime() + days * 86400000).toISOString()
  return { admin: withEntry(admin, accountId, { ...entryFor(admin, accountId), pro: { until } }), error: '' }
}

export function endPro(admin, accountId) {
  if (!proUntil(admin, accountId)) return { admin, error: 'This account does not have an active plan.' }
  const entry = { ...entryFor(admin, accountId) }
  delete entry.pro
  return { admin: withEntry(admin, accountId, entry), error: '' }
}

// --- Sales ledger: what the extras have earned, newest first (capped so storage cannot grow forever).
export function recordSale(admin, kind, price, now = new Date()) {
  const sale = {
    id: crypto.randomUUID(),
    kind,
    label: price.label,
    amount: price.amount,
    currency: price.currency,
    at: now.toISOString(),
  }
  return { ...admin, sales: [sale, ...(admin.sales ?? [])].slice(0, 200) }
}

export function summarizeStore(admin) {
  const summary = { count: 0, totals: {}, counts: { verification: 0, boost: 0, pro: 0 } }
  for (const sale of admin.sales ?? []) {
    summary.count += 1
    summary.totals[sale.currency] = round3((summary.totals[sale.currency] ?? 0) + sale.amount)
    if (SALE_KINDS.includes(sale.kind)) summary.counts[sale.kind] += 1
  }
  return summary
}

// What a Pro seller gets: a summary of the orders their listings have received.
export function summarizeOrdersForSeller(orders) {
  const summary = { count: orders.length, completed: {} }
  for (const order of orders) {
    if (order.status !== 'completed') continue
    const currency = order.currency ?? 'KES'
    summary.completed[currency] = round3((summary.completed[currency] ?? 0) + order.total)
  }
  return summary
}

// --- Boosts: a flag on the listing record with an expiry. Time decides, so nothing needs cleaning up.
export function boostExpiry(record) {
  const until = record.boosted?.until
  return typeof until === 'string' ? until : ''
}

export function isBoosted(record, now = new Date()) {
  const until = boostExpiry(record)
  if (!until) return false
  const end = new Date(until)
  return !Number.isNaN(end.getTime()) && end.getTime() > now.getTime()
}

export function withBoost(record, now = new Date(), days = BOOST_DAYS) {
  const until = new Date(now.getTime() + days * 86400000).toISOString()
  return { ...record, boosted: { until } }
}

export function withoutBoost(record) {
  const next = { ...record }
  delete next.boosted
  return next
}

// Boosted listings lead the list, soonest to expire first; everything else keeps its own order.
export function boostedFirst(records, now = new Date()) {
  const active = []
  const rest = []
  for (const record of records) (isBoosted(record, now) ? active : rest).push(record)
  active.sort((a, b) => String(boostExpiry(a)).localeCompare(String(boostExpiry(b))))
  return [...active, ...rest]
}
