import { COMMON_CURRENCIES, OTHER_CURRENCIES } from './currency.js'

// One-tap buttons for the currencies buyers ask for most, and a list for the rest.
const QUICK = ['KES', 'USD', 'EUR', 'GBP', 'KWD']

function formatRateDate(date) {
  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime())
    ? ''
    : parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function CurrencyPicker({ value, onChange, status, date, stale }) {
  const others = [...COMMON_CURRENCIES, ...OTHER_CURRENCIES].filter((currency) => !QUICK.includes(currency.code))
  const moreValue = QUICK.includes(value) ? '' : value

  return (
    <section className="bar currency-bar" aria-labelledby="currency-heading">
      <h2 id="currency-heading" className="bar-label">Show prices in</h2>
      <div className="chip-row" role="group" aria-labelledby="currency-heading">
        <button type="button" className={`chip${value === '' ? ' chip-on' : ''}`} aria-pressed={value === ''}
          onClick={() => onChange('')}>Seller's currency</button>
        {QUICK.map((code) => (
          <button type="button" key={code} className={`chip${value === code ? ' chip-on' : ''}`}
            aria-pressed={value === code} onClick={() => onChange(code)}>{code}</button>
        ))}
        <label className="visually-hidden" htmlFor="more-currency">Another currency</label>
        <select id="more-currency" className={`chip-select${moreValue ? ' chip-on' : ''}`} value={moreValue}
          onChange={(event) => onChange(event.target.value)}>
          <option value="">More currencies…</option>
          {others.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} – {currency.name}</option>)}
        </select>
      </div>
      <p className="hint currency-note" role="status">
        {value !== '' && status === 'loading' && 'Loading today’s exchange rates…'}
        {value !== '' && status === 'error' && 'Could not load exchange rates, so prices are shown in the sellers’ own currencies. Check your connection and try again.'}
        {value !== '' && status === 'ready' && (
          <>
            Converted prices are approximate, using rates{date ? ` from ${formatRateDate(date)}` : ''}
            {stale ? ' (saved earlier — could not refresh)' : ''}. You pay in the seller’s currency; the original price is in brackets.
          </>
        )}
      </p>
    </section>
  )
}
