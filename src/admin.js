import { ONLINE_METHODS } from './orders.js'

// Admin rules: account status, escrow holds on payments, and the platform fee.
// An account's status is fixed by the admin and cannot be changed by the account itself.
//
//   active -> suspended -> (reinstated) active
//   active -> terminated  (the end; nothing reactivates it)
//
// A suspended seller cannot post listings or act on orders; a suspended buyer cannot place
// orders. A terminated account is signed out and kept out. Holds sit on paid orders: while an
// order is held the money is treated as being with the platform (escrow) and neither side can
// complete it — only the admin can release it.

export const ACCOUNT_STATUSES = ['active', 'suspended', 'terminated']
export const ACCOUNT_STATUS_LABELS = { active: 'Active', suspended: 'Suspended', terminated: 'Terminated' }

export const emptyAdminState = () => ({ accounts: {}, holds: {} })

// The platform's cut of an in-app payment (M-Pesa or card), as agreed in the monetisation plan.
// Cash orders carry no fee: the platform never sees the money. The rate is the owner's to change.
export const PLATFORM_FEE_RATE = 0.02

export function accountStatus(admin, accountId) {
  return admin.accounts[accountId]?.status ?? 'active'
}

export function isAdminBlocked(admin, accountId) {
  return accountStatus(admin, accountId) !== 'active'
}

// A new status for an account, or an error string when the change is not allowed.
export function setAccountStatus(admin, accountId, status, now = new Date()) {
  if (!ACCOUNT_STATUSES.includes(status)) return { admin, error: 'That is not a known account status.' }
  const current = admin.accounts[accountId] ?? { status: 'active', updatedAt: '' }
  if (current.status === status) return { admin, error: `This account is already ${ACCOUNT_STATUS_LABELS[status].toLowerCase()}.` }
  if (current.status === 'terminated' && status !== 'terminated') {
    return { admin, error: 'A terminated account cannot be brought back. Create a new account instead.' }
  }
  const next = { ...admin, accounts: { ...admin.accounts, [accountId]: { ...current, status, updatedAt: now.toISOString() } } }
  return { admin: next, error: '' }
}

export function isHeld(admin, orderId) {
  return Boolean(admin.holds[orderId])
}

// Escrow: the admin holds a paid order's money. Held orders cannot be completed or cancelled
// by either side until the admin releases them.
export function holdPayment(admin, orderId, now = new Date(), reason = '') {
  if (admin.holds[orderId]) return { admin, error: 'This payment is already on hold.' }
  const next = { ...admin, holds: { ...admin.holds, [orderId]: { heldAt: now.toISOString(), reason } } }
  return { admin: next, error: '' }
}

export function releasePayment(admin, orderId) {
  if (!admin.holds[orderId]) return { admin, error: 'This payment is not on hold.' }
  const holds = { ...admin.holds }
  delete holds[orderId]
  return { admin: { ...admin, holds }, error: '' }
}

const round3 = (value) => Math.round(value * 1000) / 1000

// The platform fee for one order: a percentage of the total for in-app payments, nothing for cash.
export function feeFor(order) {
  if (!ONLINE_METHODS.includes(order.paymentMethod)) return 0
  return round3(order.total * PLATFORM_FEE_RATE)
}

// Everything the admin sees at a glance, summed per currency because currencies are never mixed:
// how many orders, what they are worth, the fees earned, and what is being held in escrow.
export function summarizeForAdmin(orders, admin) {
  const summary = {
    count: orders.length,
    open: 0,
    completed: 0,
    totals: {},
    fees: {},
    heldTotals: {},
    heldCount: 0,
  }
  for (const order of orders) {
    const currency = order.currency ?? 'KES'
    if (['placed', 'accepted', 'paid'].includes(order.status)) summary.open += 1
    if (order.status === 'completed') {
      summary.completed += 1
      summary.totals[currency] = round3((summary.totals[currency] ?? 0) + order.total)
      summary.fees[currency] = round3((summary.fees[currency] ?? 0) + feeFor(order))
    }
    if (isHeld(admin, order.id)) {
      summary.heldCount += 1
      summary.heldTotals[currency] = round3((summary.heldTotals[currency] ?? 0) + order.total)
    }
  }
  return summary
}

// Anything read back from storage is checked so damaged data cannot break the page.
export function cleanAdminState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyAdminState()
  const accounts = {}
  if (value.accounts && typeof value.accounts === 'object') {
    for (const [id, entry] of Object.entries(value.accounts)) {
      if (entry && typeof entry === 'object' && ACCOUNT_STATUSES.includes(entry.status)) {
        accounts[id] = { status: entry.status, updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : '' }
      }
    }
  }
  const holds = {}
  if (value.holds && typeof value.holds === 'object') {
    for (const [id, entry] of Object.entries(value.holds)) {
      if (entry && typeof entry === 'object' && typeof entry.heldAt === 'string') {
        holds[id] = { heldAt: entry.heldAt, reason: typeof entry.reason === 'string' ? entry.reason : '' }
      }
    }
  }
  return { accounts, holds }
}
