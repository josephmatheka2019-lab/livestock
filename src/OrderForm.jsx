import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog.jsx'
import { moneyLabel } from './currency.js'
import { animalLabel, PAYMENT_METHODS } from './listing.js'
import {
  createOrder, emptyOrderForm, isOpen, MAX_ADDRESS, MAX_NOTE, methodLabel, ONLINE_METHODS, orderQuote, STATUS_LABELS,
  validateOrder,
} from './orders.js'

// "How many do you want?" through to placing the order. The price works out as the buyer types; pressing
// Place order checks everything, then asks "Place this order?" before anything is sent to the seller.
export default function OrderForm({ record, display = null, buyer, buyerReady, orders, seller, onPlace, onNeedProfile, onViewOrders }) {
  const [form, setForm] = useState(emptyOrderForm)
  const [errors, setErrors] = useState({})
  const [confirming, setConfirming] = useState(false)
  const available = Number(record.quantity)
  const money = (value) => moneyLabel(value, record.currency, display)
  const open = orders.find((order) => order.listingId === record.id && isOpen(order))
  const methods = PAYMENT_METHODS.filter((method) => (record.paymentMethods ?? []).includes(method.value))
  const quote = /^\d+$/.test(form.quantity.trim()) && Number(form.quantity) >= 1 && Number(form.quantity) <= available
    ? orderQuote(record, form.quantity)
    : null

  if (!(available >= 1)) return null

  if (open) {
    return (
      <section className="calc order" aria-labelledby="order-heading">
        <h3 id="order-heading">Your order</h3>
        <p>
          You have an open order for this listing: <strong>{open.quantity} × {open.listingLabel}</strong>,
          status <strong>{STATUS_LABELS[open.status]}</strong>.
        </p>
        <div className="actions"><button type="button" onClick={onViewOrders}>View my orders</button></div>
      </section>
    )
  }

  function change(event) {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setErrors((current) => {
      const { [name]: _a, listing: _b, ...rest } = current
      return rest
    })
  }

  function submit(event) {
    event.preventDefault()
    const found = validateOrder(record, form, buyer, orders)
    // The buyer-details and duplicate messages have their own place on the page; the rest sit by their fields.
    setErrors(found)
    const fieldIds = { quantity: 'order-quantity', paymentMethod: 'order-payment', address: 'order-address', note: 'order-note' }
    const first = Object.keys(fieldIds).find((name) => found[name])
    if (first) document.getElementById(fieldIds[first])?.focus()
    if (Object.keys(found).length === 0) setConfirming(true)
  }

  function place() {
    setConfirming(false)
    onPlace(createOrder(record, form, buyer))
    setForm(emptyOrderForm)
    setErrors({})
  }

  const field = (name, id) => (errors[name] ? { 'aria-invalid': true, 'aria-describedby': id } : {})
  const onlineMethod = ONLINE_METHODS.includes(form.paymentMethod)

  return (
    <section className="calc order" aria-labelledby="order-heading">
      <h3 id="order-heading">Order this</h3>
      {errors.listing && <p className="error" role="alert">{errors.listing}</p>}

      <form onSubmit={submit} noValidate>
        <div className="calc-row">
          <label className="visually-hidden" htmlFor="order-quantity">Number of animals you want</label>
          <input id="order-quantity" name="quantity" type="number" inputMode="numeric" min="1" max={available} step="1"
            value={form.quantity} onChange={change} {...field('quantity', 'order-quantity-error')} />
          <span className="calc-of">of {available} available</span>
          {available > 1 && (
            <button type="button" className="secondary" onClick={() => change({ target: { name: 'quantity', value: String(available), type: 'text' } })}>
              Whole lot ({available})
            </button>
          )}
        </div>
        {errors.quantity && <p className="error" id="order-quantity-error" role="alert">{errors.quantity}</p>}

        <div role="status" aria-live="polite">
          {!form.quantity.trim() && !errors.quantity && <p className="hint">Enter a number to see the price.</p>}
          {quote && (
            <dl className="calc-result">
              <div><dt>Price each</dt><dd>{money(quote.unitPrice)}</dd></div>
              {quote.usedBulk && <div><dt>Whole lot, bulk price</dt><dd>{money(quote.total)}</dd></div>}
              {quote.usedBulk && <div><dt>You save</dt><dd className="saving">{money(quote.saving)}</dd></div>}
              <div><dt>Order total</dt><dd className="calc-total">{money(quote.total)}</dd></div>
            </dl>
          )}
          {quote && !quote.usedBulk && record.bulkPrice && Number(form.quantity) !== available && (
            <p className="hint">The seller&rsquo;s bulk price of {money(record.bulkPrice)} is for all {available}. Choose the whole lot to use it.</p>
          )}
        </div>

        <label htmlFor="order-payment">How will you pay? <span aria-hidden="true">*</span></label>
        <select id="order-payment" name="paymentMethod" value={form.paymentMethod} onChange={change} {...field('paymentMethod', 'order-payment-error')}>
          <option value="">Choose a payment method</option>
          {methods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
        </select>
        {errors.paymentMethod && <p className="error" id="order-payment-error" role="alert">{errors.paymentMethod}</p>}
        {form.paymentMethod && (
          <p className="hint">
            {onlineMethod
              ? `You pay by ${methodLabel(form.paymentMethod)} after the seller accepts your order (a demonstration for now: no money is taken).`
              : 'You pay the seller in cash when the animals are delivered.'}
          </p>
        )}

        {record.delivery && (
          <>
            <label className="check" htmlFor="order-delivery">
              <input id="order-delivery" name="wantsDelivery" type="checkbox" checked={form.wantsDelivery} onChange={change} />
              Deliver to me (the seller offers delivery)
            </label>
            {form.wantsDelivery && (
              <>
                <label htmlFor="order-address">Delivery address <span aria-hidden="true">*</span></label>
                <input id="order-address" name="address" value={form.address} onChange={change} maxLength={MAX_ADDRESS}
                  {...field('address', 'order-address-error')} />
                {errors.address && <p className="error" id="order-address-error" role="alert">{errors.address}</p>}
              </>
            )}
          </>
        )}

        <label htmlFor="order-note">Note for the seller</label>
        <textarea id="order-note" name="note" rows="2" value={form.note} onChange={change} maxLength={MAX_NOTE}
          {...field('note', 'order-note-error')} />
        {errors.note && <p className="error" id="order-note-error" role="alert">{errors.note}</p>}
        <p className="hint">Optional, for example when you can collect.</p>

        {errors.duplicate && <p className="error" role="alert">{errors.duplicate}</p>}
        {errors.buyer && <p className="error" role="alert">{errors.buyer}</p>}

        {buyerReady ? (
          <div className="actions"><button type="submit">Place order</button></div>
        ) : (
          <div className="contact-locked">
            <p>Add your name and phone number so the seller knows who is ordering.</p>
            <button type="button" onClick={onNeedProfile}>Add my details</button>
          </div>
        )}
      </form>

      {confirming && (
        <ConfirmDialog title="Place this order?" yesLabel="Yes, place order" noLabel="No, go back" onYes={place} onNo={() => setConfirming(false)}>
          <ul className="confirm-lines">
            <li><strong>{form.quantity} × {animalLabel(record)}</strong>{seller?.businessName ? ` from ${seller.businessName}` : ''}{record.location ? `, ${record.location}` : ''}</li>
            <li>Total: <span className="confirm-total">{money(orderQuote(record, form.quantity).total)}</span>{orderQuote(record, form.quantity).usedBulk ? ' (bulk price for the whole lot)' : ''}</li>
            <li>Payment: {methodLabel(form.paymentMethod)}{onlineMethod ? ' (after the seller accepts)' : ' on delivery'}</li>
            {form.wantsDelivery && <li>Deliver to: {form.address.trim()}</li>}
            {form.note.trim() && <li>Note: {form.note.trim()}</li>}
          </ul>
          <p>The seller will accept or decline your order. Nothing is charged until they accept.</p>
        </ConfirmDialog>
      )}
    </section>
  )
}
