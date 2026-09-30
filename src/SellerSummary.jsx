import { formatMoney } from './currency.js'
import { summarizeListings } from './listing.js'

function ValueLines({ value }) {
  const codes = Object.keys(value)
  if (codes.length === 0) return <span className="stat-none">None</span>
  return (
    <ul className="stat-lines">
      {codes.map((code) => <li key={code}>{formatMoney(value[code], code)}</li>)}
    </ul>
  )
}

// A quick view of the seller's stock. Value is quantity x price per animal, listed once per
// currency because sellers can price in different currencies and these are not mixed.
export default function SellerSummary({ records }) {
  if (records.length === 0) return null
  const summary = summarizeListings(records)

  return (
    <section className="panel summary" aria-labelledby="summary-heading">
      <p className="eyebrow">AT A GLANCE</p>
      <h2 id="summary-heading">Your listings</h2>
      <dl className="stat-grid">
        <div className="stat"><dt>Available</dt><dd className="stat-number">{summary.available}</dd></div>
        {summary.paused > 0 && (
          <div className="stat"><dt>Paused</dt><dd className="stat-number">{summary.paused}</dd></div>
        )}
        <div className="stat"><dt>Sold</dt><dd className="stat-number">{summary.sold}</dd></div>
        <div className="stat"><dt>Value of available stock</dt><dd><ValueLines value={summary.availableValue} /></dd></div>
        <div className="stat"><dt>Value of sold stock</dt><dd><ValueLines value={summary.soldValue} /></dd></div>
      </dl>
      <p className="hint">Value is quantity × price per animal. Bulk-deal prices are not applied.</p>
    </section>
  )
}
