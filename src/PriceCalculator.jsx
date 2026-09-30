import { useState } from 'react'
import { moneyLabel } from './currency.js'
import { quoteFor } from './listing.js'

// "How many do you want?" A buyer types a number and sees what it would cost; taking the
// whole lot also shows the seller's bulk price and how much it saves.
export default function PriceCalculator({ record, display = null }) {
  const [wanted, setWanted] = useState('')
  const quote = quoteFor(record, wanted)
  const available = Number(record.quantity)
  const money = (value) => moneyLabel(value, record.currency, display)

  if (!(available >= 1)) return null

  return (
    <section className="calc" aria-labelledby="calc-heading">
      <h3 id="calc-heading">How many do you want?</h3>
      <div className="calc-row">
        <label className="visually-hidden" htmlFor="calc-quantity">Number of animals you want</label>
        <input id="calc-quantity" type="number" inputMode="numeric" min="1" max={available} step="1"
          value={wanted} onChange={(event) => setWanted(event.target.value)}
          aria-invalid={quote.state === 'error'} aria-describedby={quote.state === 'error' ? 'calc-error' : undefined} />
        <span className="calc-of">of {available} available</span>
        {available > 1 && (
          <button type="button" className="secondary" onClick={() => setWanted(String(available))}>
            Whole lot ({available})
          </button>
        )}
      </div>

      <div role="status" aria-live="polite">
        {quote.state === 'empty' && <p className="hint">Enter a number to see the price.</p>}
        {quote.state === 'error' && <p className="error" id="calc-error">{quote.message}</p>}
        {quote.state === 'no-price' && <p className="hint">The seller has not given a price yet. Contact them to ask.</p>}
        {quote.state === 'ok' && (
          <dl className="calc-result">
            <div><dt>Price each</dt><dd>{money(record.price)}</dd></div>
            <div><dt>Total for {quote.quantity}</dt><dd className="calc-total">{money(quote.fullPrice)}</dd></div>
            {quote.isWholeLot && quote.bulk != null && (
              <div><dt>Bulk price for the whole lot</dt><dd className="calc-total">{money(quote.bulk)}</dd></div>
            )}
            {quote.saving > 0 && <div><dt>You save</dt><dd className="saving">{money(quote.saving)}</dd></div>}
          </dl>
        )}
        {quote.state === 'ok' && !quote.isWholeLot && record.bulkPrice && (
          <p className="hint">
            The seller&rsquo;s bulk price of {money(record.bulkPrice)} is for all {available}. Choose the whole lot to see your saving.
          </p>
        )}
        {quote.state === 'ok' && record.negotiable && <p className="hint">The seller says the price is negotiable.</p>}
      </div>
    </section>
  )
}
