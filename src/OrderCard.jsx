import { moneyLabel } from './currency.js'
import { formatDay } from './listing.js'
import { methodLabel, mpesaChannelLabel, STATUS_LABELS } from './orders.js'

// One order, as either side sees it. `children` holds the buttons for whoever is looking.
// Phone numbers never appear here: neither side learns the other's contact details, so the
// deal cannot be taken off the platform. (The admin page shows them for support.)
export default function OrderCard({ order, role, display = null, seller = null, children = null }) {
  const money = (value) => moneyLabel(value, order.currency, display)
  const reference = order.id.slice(0, 8).toUpperCase()
  const showSeller = role === 'buyer' && seller?.businessName && order.status !== 'placed' && order.status !== 'declined' && order.status !== 'cancelled'
  const stage = order.history.map((entry) => `${STATUS_LABELS[entry.status]} ${formatDay(entry.at)}`).join(' · ')

  return (
    <li className="order-card">
      <div className="order-head">
        <h3>{order.quantity} × {order.listingLabel}</h3>
        <span className={`badge order-status status-${order.status}`}>{STATUS_LABELS[order.status]}</span>
      </div>
      <p className="order-ref">Order {reference} · placed {formatDay(order.createdAt)}</p>

      <dl className="order-grid">
        <div><dt>Total</dt><dd className="order-total">{money(order.total)}</dd></div>
        <div><dt>Price each</dt><dd>{money(order.unitPrice)}{order.usedBulk ? ' (bulk deal applied)' : ''}</dd></div>
        <div><dt>Payment</dt><dd>{methodLabel(order.paymentMethod)}{order.mpesaChannel ? ` · ${mpesaChannelLabel(order.mpesaChannel)}` : ''}{order.paymentMethod === 'cash' ? ' on delivery' : ''}</dd></div>
        <div><dt>Delivery</dt><dd>{order.delivery ? `To ${order.delivery}` : 'Buyer collects'}</dd></div>
        {role === 'seller' && (
          <div><dt>Buyer</dt><dd>{order.buyer.name}{order.buyer.location ? ` · ${order.buyer.location}` : ''}</dd></div>
        )}
        {showSeller && (
          <div><dt>Seller</dt><dd>{seller.businessName}</dd></div>
        )}
        {order.note && <div className="order-wide"><dt>Note</dt><dd>{order.note}</dd></div>}
      </dl>

      <p className="order-history">{stage}</p>
      {children && <div className="actions">{children}</div>}
    </li>
  )
}
