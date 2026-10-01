import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog.jsx'
import OrderCard from './OrderCard.jsx'
import { moneyLabel } from './currency.js'
import { isOpen, ONLINE_METHODS, sortOrders } from './orders.js'

// The seller's orders, open ones first. Every decision asks "are you sure?" before it happens.
export default function OrdersPanel({ orders, listings, error, onAccept, onDecline, onCancel, onComplete }) {
  const [asking, setAsking] = useState(null) // { kind, order }
  const sorted = sortOrders(orders)
  const list = [...sorted.filter(isOpen), ...sorted.filter((order) => !isOpen(order))]
  const stockOf = (order) => Number(listings.find((listing) => listing.id === order.listingId)?.quantity)

  const run = (kind, order) => {
    ;({ accept: onAccept, decline: onDecline, cancel: onCancel, complete: onComplete })[kind](order.id)
    setAsking(null)
  }

  const dialogs = {
    accept: (order) => ({
      title: 'Accept this order?',
      yes: 'Yes, accept order',
      no: 'No, go back',
      danger: false,
      body: (
        <p>
          Accepting holds <strong>{order.quantity} × {order.listingLabel}</strong> for {order.buyer.name}.
          {Number.isFinite(stockOf(order)) ? ` Your stock goes from ${stockOf(order)} to ${stockOf(order) - order.quantity}.` : ''}
        </p>
      ),
    }),
    decline: (order) => ({
      title: 'Decline this order?',
      yes: 'Yes, decline order',
      no: 'No, go back',
      danger: true,
      body: <p>Decline the order from {order.buyer.name} for {order.quantity} × {order.listingLabel}? They will see that it was declined.</p>,
    }),
    cancel: (order) => ({
      title: 'Cancel this order?',
      yes: 'Yes, cancel order',
      no: 'No, keep it',
      danger: true,
      body: <p>Cancel the order from {order.buyer.name}? The {order.quantity} animals you were holding go back on sale.</p>,
    }),
    complete: (order) => ({
      title: 'Mark this order completed?',
      yes: 'Yes, mark completed',
      no: 'No, go back',
      danger: false,
      body: <p>Only do this once the animals have been delivered{order.paymentMethod === 'cash' ? ' and you have been paid in cash' : ''}.</p>,
    }),
  }
  const dialog = asking ? dialogs[asking.kind](asking.order) : null

  return (
    <section className="records" aria-labelledby="orders-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">FROM BUYERS</p>
          <h2 id="orders-heading" tabIndex={-1}>Orders <span className="count" aria-live="polite">{list.length}</span></h2>
        </div>
      </div>
      <p className="demo-note">Payments are a demonstration for now: no real money is taken.</p>
      {error && <p className="error" role="alert">{error}</p>}

      {list.length === 0 ? (
        <div className="empty">
          <h3>No orders yet.</h3>
          <p>When a buyer places an order on one of your listings, it appears here for you to accept or decline.</p>
        </div>
      ) : (
        <ul className="order-list">
          {list.map((order) => {
            const online = ONLINE_METHODS.includes(order.paymentMethod)
            return (
              <OrderCard key={order.id} order={order} role="seller">
                {order.status === 'placed' && (
                  <>
                    <button type="button" onClick={() => setAsking({ kind: 'accept', order })}>Accept<span className="visually-hidden"> order from {order.buyer.name}</span></button>
                    <button type="button" className="secondary" onClick={() => setAsking({ kind: 'decline', order })}>Decline<span className="visually-hidden"> order from {order.buyer.name}</span></button>
                  </>
                )}
                {order.status === 'accepted' && online && <span className="order-wait">Waiting for the buyer to pay ({moneyLabel(order.total, order.currency)}).</span>}
                {((order.status === 'accepted' && !online) || order.status === 'paid') && (
                  <button type="button" onClick={() => setAsking({ kind: 'complete', order })}>Mark completed<span className="visually-hidden"> order from {order.buyer.name}</span></button>
                )}
                {order.status === 'accepted' && (
                  <button type="button" className="secondary" onClick={() => setAsking({ kind: 'cancel', order })}>Cancel order<span className="visually-hidden"> from {order.buyer.name}</span></button>
                )}
              </OrderCard>
            )
          })}
        </ul>
      )}

      {dialog && (
        <ConfirmDialog title={dialog.title} yesLabel={dialog.yes} noLabel={dialog.no} danger={dialog.danger}
          onYes={() => run(asking.kind, asking.order)} onNo={() => setAsking(null)}>
          {dialog.body}
        </ConfirmDialog>
      )}
    </section>
  )
}
