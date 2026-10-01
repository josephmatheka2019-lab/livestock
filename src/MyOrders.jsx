import { useEffect, useRef, useState } from 'react'
import ConfirmDialog from './ConfirmDialog.jsx'
import OrderCard from './OrderCard.jsx'
import { moneyLabel } from './currency.js'
import { methodLabel, ONLINE_METHODS, sortOrders } from './orders.js'

// Which accepted orders have already been asked about, so a reload or a tab switch does not ask
// a second time. Session-only: a new tab of the browser may ask again, which is harmless.
const PROMPTS_KEY = 'livestock-pay-prompts'

function readPrompts() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(PROMPTS_KEY))
    return new Set(Array.isArray(saved) ? saved : [])
  } catch {
    return new Set() // storage blocked: asking again is harmless
  }
}

function rememberPrompt(ids, id) {
  ids.add(id)
  try {
    window.sessionStorage.setItem(PROMPTS_KEY, JSON.stringify([...ids]))
  } catch {
    // Nothing to do: the worst case is being asked again next time.
  }
}

// The buyer's orders and what they can do next with each one. Cancelling and paying both ask first.
// `blocked` (set when the admin has suspended the account) hides the pay button with the reason.
export default function MyOrders({ orders, display, seller, error, blocked = '', onCancel, onPay, onBrowse }) {
  const [asking, setAsking] = useState(null) // { kind: 'cancel' | 'pay', order, auto? }
  const prompted = useRef(null)
  const list = sortOrders(orders)
  const money = (order) => moneyLabel(order.total, order.currency, display)

  if (prompted.current === null) prompted.current = readPrompts()

  // The seller accepted an order paid by M-Pesa or card, so ask the buyer whether to pay now.
  // Cash is deliberately left out: it is paid on delivery, so there is nothing to ask about.
  // A blocked account is never asked.
  useEffect(() => {
    if (asking || blocked) return
    const next = sortOrders(orders).find((order) => order.status === 'accepted'
      && ONLINE_METHODS.includes(order.paymentMethod) && !prompted.current.has(order.id))
    if (!next) return
    rememberPrompt(prompted.current, next.id)
    setAsking({ kind: 'pay', order: next, auto: true })
  }, [orders, asking, blocked])

  return (
    <section className="records" aria-labelledby="orders-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR ORDERS</p>
          <h2 id="orders-heading" tabIndex={-1}>My orders <span className="count" aria-live="polite">{list.length}</span></h2>
        </div>
      </div>
      <p className="demo-note">Payments are a demonstration for now: no real money is taken.</p>
      {error && <p className="error" role="alert">{error}</p>}

      {list.length === 0 ? (
        <div className="empty">
          <h3>You have not placed any orders yet.</h3>
          <p>Open a listing and choose <strong>Place order</strong>. The seller then accepts or declines it, and you can follow it here.</p>
          <button type="button" onClick={onBrowse}>Browse listings</button>
        </div>
      ) : (
        <ul className="order-list">
          {list.map((order) => (
            <OrderCard key={order.id} order={order} role="buyer" display={display} seller={seller}>
              {order.status === 'accepted' && ONLINE_METHODS.includes(order.paymentMethod) && !blocked && (
                <button type="button" onClick={() => setAsking({ kind: 'pay', order })}>Pay now (demo)</button>
              )}
              {order.status === 'accepted' && ONLINE_METHODS.includes(order.paymentMethod) && blocked && (
                <span className="order-wait">{blocked}</span>
              )}
              {order.status === 'accepted' && !ONLINE_METHODS.includes(order.paymentMethod) && (
                <span className="order-wait">Accepted: pay the seller in cash on delivery.</span>
              )}
              {order.status === 'placed' && <span className="order-wait">Waiting for the seller to accept or decline.</span>}
              {order.status === 'declined' && (
                <span className="order-wait">The seller declined this order. Nothing has been charged.</span>
              )}
              {order.status === 'cancelled' && <span className="order-wait">You cancelled this order.</span>}
              {order.status === 'completed' && <span className="order-wait">Completed. Thank you.</span>}
              {order.status === 'paid' && <span className="order-wait">Paid. The seller will deliver, then mark it completed.</span>}
              {(order.status === 'placed' || order.status === 'accepted') && (
                <button type="button" className="secondary" onClick={() => setAsking({ kind: 'cancel', order })}>Cancel order</button>
              )}
            </OrderCard>
          ))}
        </ul>
      )}

      {asking?.kind === 'cancel' && (
        <ConfirmDialog title="Cancel this order?" yesLabel="Yes, cancel order" noLabel="No, keep it" danger
          onYes={() => { onCancel(asking.order.id); setAsking(null) }} onNo={() => setAsking(null)}>
          <p>Cancel your order for <strong>{asking.order.quantity} × {asking.order.listingLabel}</strong>?
            {asking.order.status === 'accepted' ? ' The animals the seller was holding for you go back on sale.' : ''}</p>
        </ConfirmDialog>
      )}
      {asking?.kind === 'pay' && (
        <ConfirmDialog
          title={asking.auto ? 'The seller accepted your order. Proceed with payment?' : 'Pay for this order?'}
          yesLabel="Yes, pay now (demo)" noLabel={asking.auto ? 'No, not now' : 'No, go back'}
          onYes={() => { onPay(asking.order.id); setAsking(null) }} onNo={() => setAsking(null)}>
          <p className="demo-note">Demonstration only: no real money is taken.</p>
          {asking.auto && (
            <p>Your order of {asking.order.quantity} × {asking.order.listingLabel} was accepted.</p>
          )}
          <p>Pay <strong>{money(asking.order)}</strong> by {methodLabel(asking.order.paymentMethod)} for {asking.order.quantity} × {asking.order.listingLabel}?</p>
        </ConfirmDialog>
      )}
    </section>
  )
}
