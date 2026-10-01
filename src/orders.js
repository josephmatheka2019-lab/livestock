import { animalLabel, isListedForBuyers, PAYMENT_METHODS, withStatus } from './listing.js'
import { isBuyerProfileComplete } from './buyerProfile.js'

// Orders. A buyer places an order on a listing; the seller accepts or declines it. Accepting holds the
// animals (the listing's quantity goes down). The buyer then pays (M-Pesa or card: a demonstration for now,
// no money moves) or, for cash, pays on delivery; the seller marks it completed.
//
//   placed -> accepted | declined | cancelled
//   accepted -> paid (in-app payment) | completed (cash on delivery) | cancelled
//   paid -> completed
//
// Every change below is a pure function: it takes the current orders and listings and returns new ones,
// plus an `error` message when the change is not allowed. Nothing is changed in place.

export const MAX_NOTE = 300
export const MAX_ADDRESS = 120

export const STATUS_LABELS = {
  placed: 'Placed',
  accepted: 'Accepted',
  paid: 'Paid',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
}

// An order is "open" until it reaches an end: completed, declined or cancelled.
export const OPEN_STATUSES = ['placed', 'accepted', 'paid']
export const isOpen = (order) => OPEN_STATUSES.includes(order.status)

// Methods that are paid inside the app. Cash is paid to the seller on delivery.
export const ONLINE_METHODS = ['mpesa', 'card']
export const methodLabel = (value) => PAYMENT_METHODS.find((method) => method.value === value)?.label ?? value

const round3 = (value) => Math.round(value * 1000) / 1000

export const emptyOrderForm = { quantity: '', paymentMethod: '', wantsDelivery: false, address: '', note: '' }

// What an order for this many animals costs. Taking the whole lot uses the seller's bulk price when
// that is cheaper than paying per animal. Null when the listing has no usable price.
export function orderQuote(record, quantity) {
  const count = Number(quantity)
  const price = Number(record.price)
  if (!record.price || Number.isNaN(price) || !(count >= 1)) return null
  const fullPrice = round3(count * price)
  const bulk = record.bulkPrice ? Number(record.bulkPrice) : NaN
  const usedBulk = !Number.isNaN(bulk) && count === Number(record.quantity) && bulk < fullPrice
  return {
    unitPrice: price,
    fullPrice,
    total: usedBulk ? bulk : fullPrice,
    usedBulk,
    saving: usedBulk ? round3(fullPrice - bulk) : 0,
    currency: record.currency ?? 'KES',
  }
}

export function validateOrder(record, form, buyer, orders) {
  const errors = {}
  const available = Number(record.quantity)

  if (!isListedForBuyers(record)) errors.listing = 'This listing is no longer on sale.'
  else if (!orderQuote(record, 1)) errors.listing = 'The seller has not given a price yet, so this cannot be ordered. Contact them to ask.'

  if (!isBuyerProfileComplete(buyer)) errors.buyer = 'Add your name and phone number before you order.'

  if (orders.some((order) => order.listingId === record.id && isOpen(order))) {
    errors.duplicate = 'You already have an open order for this listing.'
  }

  const quantity = form.quantity.trim()
  if (!quantity) errors.quantity = 'Enter how many animals you want.'
  else if (!/^\d+$/.test(quantity) || Number(quantity) < 1 || Number(quantity) > available) {
    errors.quantity = `Enter a whole number from 1 to ${available}.`
  }

  if (!form.paymentMethod) errors.paymentMethod = 'Choose how you will pay.'
  else if (!(record.paymentMethods ?? []).includes(form.paymentMethod)) errors.paymentMethod = 'The seller does not accept that payment method.'

  if (form.wantsDelivery) {
    if (!record.delivery) errors.address = 'This seller does not offer delivery.'
    else if (!form.address.trim()) errors.address = 'Enter where the animals should be delivered.'
    else if (form.address.trim().length > MAX_ADDRESS) errors.address = `Keep the address to ${MAX_ADDRESS} characters or fewer.`
  }

  if (form.note.trim().length > MAX_NOTE) errors.note = `Keep the note to ${MAX_NOTE} characters or fewer.`

  return errors
}

export function createOrder(record, form, buyer, now = new Date()) {
  const quote = orderQuote(record, form.quantity)
  const at = now.toISOString()
  return {
    id: crypto.randomUUID(),
    listingId: record.id,
    listingLabel: animalLabel(record),
    listingLocation: record.location ?? '',
    quantity: Number(form.quantity),
    unitPrice: quote.unitPrice,
    total: quote.total,
    usedBulk: quote.usedBulk,
    currency: quote.currency,
    paymentMethod: form.paymentMethod,
    delivery: form.wantsDelivery ? form.address.trim() : '',
    note: form.note.trim(),
    buyer: { name: buyer.name, phone: buyer.phone, location: buyer.location ?? '' },
    status: 'placed',
    createdAt: at,
    history: [{ status: 'placed', at }],
  }
}

function step(order, status, now, extra = {}) {
  return { ...order, ...extra, status, history: [...(order.history ?? []), { status, at: now.toISOString() }] }
}

const replace = (orders, next) => orders.map((order) => (order.id === next.id ? next : order))
const fail = (orders, listings, error) => ({ orders, listings, error })

// Seller accepts: holds the animals by taking them off the listing's quantity. If that empties the
// listing it is marked sold, and remembers which order did it so a cancellation can reverse that.
export function acceptOrder(orders, listings, orderId, now = new Date()) {
  const order = orders.find((item) => item.id === orderId)
  if (!order) return fail(orders, listings, 'That order no longer exists.')
  if (order.status !== 'placed') return fail(orders, listings, 'Only a new order can be accepted.')
  const listing = listings.find((item) => item.id === order.listingId)
  if (!listing) return fail(orders, listings, 'The listing for this order has been deleted, so it cannot be accepted.')
  if (listing.status === 'sold') return fail(orders, listings, 'This listing is marked sold. Put it back on sale first, or decline the order.')
  const left = Number(listing.quantity)
  if (!(left >= order.quantity)) return fail(orders, listings, `Only ${Number.isNaN(left) ? 0 : left} left, which is not enough for this order.`)

  const remaining = left - order.quantity
  let updated = { ...listing, quantity: String(remaining) }
  if (remaining === 0) updated = { ...withStatus(updated, 'sold', now), soldOutBy: order.id }
  return {
    orders: replace(orders, step(order, 'accepted', now, { stockHeld: true })),
    listings: listings.map((item) => (item.id === listing.id ? updated : item)),
    error: '',
  }
}

export function declineOrder(orders, listings, orderId, now = new Date()) {
  const order = orders.find((item) => item.id === orderId)
  if (!order) return fail(orders, listings, 'That order no longer exists.')
  if (order.status !== 'placed') return fail(orders, listings, 'Only a new order can be declined.')
  return { orders: replace(orders, step(order, 'declined', now)), listings, error: '' }
}

// Either side can cancel before payment. If the animals were being held they go back on the listing.
export function cancelOrder(orders, listings, orderId, now = new Date()) {
  const order = orders.find((item) => item.id === orderId)
  if (!order) return fail(orders, listings, 'That order no longer exists.')
  if (order.status === 'paid') return fail(orders, listings, 'A paid order cannot be cancelled here. Contact the other side to sort out a refund.')
  if (order.status !== 'placed' && order.status !== 'accepted') return fail(orders, listings, 'This order has already ended.')

  let nextListings = listings
  if (order.stockHeld) {
    nextListings = listings.map((listing) => {
      if (listing.id !== order.listingId) return listing
      let restored = { ...listing, quantity: String((Number(listing.quantity) || 0) + order.quantity) }
      if (listing.soldOutBy === order.id) {
        restored = withStatus(restored, 'available', now)
        delete restored.soldOutBy
      }
      return restored
    })
  }
  return { orders: replace(orders, step(order, 'cancelled', now, { stockHeld: false })), listings: nextListings, error: '' }
}

// The buyer pays an accepted order in the app. Cash orders are paid on delivery instead.
export function payOrder(orders, listings, orderId, now = new Date()) {
  const order = orders.find((item) => item.id === orderId)
  if (!order) return fail(orders, listings, 'That order no longer exists.')
  if (order.status !== 'accepted') return fail(orders, listings, 'Only an accepted order can be paid.')
  if (!ONLINE_METHODS.includes(order.paymentMethod)) return fail(orders, listings, 'This order is paid in cash on delivery, not in the app.')
  return { orders: replace(orders, step(order, 'paid', now)), listings, error: '' }
}

// The seller marks it done once the animals are delivered: after payment, or for cash once accepted.
export function completeOrder(orders, listings, orderId, now = new Date()) {
  const order = orders.find((item) => item.id === orderId)
  if (!order) return fail(orders, listings, 'That order no longer exists.')
  const ready = order.status === 'paid' || (order.status === 'accepted' && !ONLINE_METHODS.includes(order.paymentMethod))
  if (!ready) {
    return fail(orders, listings, order.status === 'accepted' ? 'Wait for the buyer to pay before completing this order.' : 'This order cannot be completed yet.')
  }
  return { orders: replace(orders, step(order, 'completed', now)), listings, error: '' }
}

// Anything read back from storage is checked so damaged data cannot break a page.
export function cleanOrders(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  return value.filter((order) => {
    const ok = order && typeof order === 'object' && typeof order.id === 'string' && order.id && !seen.has(order.id)
      && typeof order.listingId === 'string' && STATUS_LABELS[order.status]
      && Number.isFinite(order.quantity) && Number.isFinite(order.total)
      && order.buyer && typeof order.buyer === 'object'
    if (ok) seen.add(order.id)
    return ok
  }).map((order) => ({ ...order, history: Array.isArray(order.history) ? order.history : [] }))
}

// Newest first.
export const sortOrders = (orders) => [...orders].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
