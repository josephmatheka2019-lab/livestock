import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog.jsx'
import { moneyLabel } from './currency.js'
import {
  BOOST_DAYS, isPro, proUntil, PRO_DAYS, STORE_PRICES, VERIFICATION_LABELS, verificationStatus,
} from './store.js'
import { formatDay } from './listing.js'

// Where the seller buys the optional extras: the Verified badge and Seller Pro. Each purchase
// asks first and records a demo sale for the admin's ledger. Buyers never see these prices.
// `blocked` (suspended or terminated account) replaces the buttons with the reason.
export default function SellerStore({ admin, blocked = '', error = '', ordersSummary = null, onVerify, onStartPro, onEndPro }) {
  const [asking, setAsking] = useState(null) // { kind: 'verify' | 'pro' | 'end-pro' }
  const verification = verificationStatus(admin, 'seller')
  const pro = isPro(admin, 'seller')
  const verifyPrice = STORE_PRICES.verification
  const proPrice = STORE_PRICES.pro

  return (
    <section className="panel store-panel" aria-labelledby="store-heading">
      <p className="eyebrow">GROW YOUR SALES</p>
      <h2 id="store-heading">Extras for your shop</h2>

      <div className="store-row">
        <div>
          <h3>Verified seller <span className={`badge badge-${verification === 'verified' ? 'verified' : 'available'}`}>{VERIFICATION_LABELS[verification]}</span></h3>
          <p className="hint">
            {verification === 'verified'
              ? 'Your badge is showing to buyers on every listing.'
              : verification === 'pending'
                ? 'Requested — the admin is checking your details. Your badge appears as soon as it is approved.'
                : `A one-off ${moneyLabel(verifyPrice.amount, verifyPrice.currency, null)} (demo payment). Buyers see a Verified badge on your listings, which builds trust.`}
          </p>
        </div>
        {!blocked && verification === 'none' && (
          <button type="button" onClick={() => setAsking({ kind: 'verify' })}>
            Get verified<span className="visually-hidden"> for {moneyLabel(verifyPrice.amount, verifyPrice.currency, null)} (demo payment)</span>
          </button>
        )}
      </div>

      <div className="store-row">
        <div>
          <h3>Seller Pro <span className={`badge ${pro ? 'badge-pro' : 'badge-available'}`}>{pro ? `Active until ${formatDay(proUntil(admin, 'seller'))}` : 'Not active'}</span></h3>
          <p className="hint">
            {pro
              ? 'Your Pro badge shows on every listing, and your order summary is below.'
              : `${moneyLabel(proPrice.amount, proPrice.currency, null)} per ${PRO_DAYS} days (demo payment): a Pro badge on every listing and your order summary on this page.`}
          </p>
          {pro && ordersSummary && (
            <dl className="calc-result">
              <div><dt>Orders received</dt><dd>{ordersSummary.count}</dd></div>
              {Object.keys(ordersSummary.completed).map((code) => (
                <div key={code}>
                  <dt>Completed value ({code})</dt>
                  <dd>{moneyLabel(ordersSummary.completed[code], code, null)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        {!blocked && !pro && (
          <button type="button" onClick={() => setAsking({ kind: 'pro' })}>
            Go Pro<span className="visually-hidden"> for {moneyLabel(proPrice.amount, proPrice.currency, null)} (demo payment)</span>
          </button>
        )}
        {!blocked && pro && (
          <button type="button" className="secondary" onClick={() => setAsking({ kind: 'end-pro' })}>End plan</button>
        )}
      </div>

      <div className="store-row">
        <div>
          <h3>Boost a listing</h3>
          <p className="hint">
            {moneyLabel(STORE_PRICES.boost.amount, STORE_PRICES.boost.currency, null)} (demo payment) puts one
            listing at the top of buyer results for {BOOST_DAYS} days, with a Boosted badge. The button is on
            each listing card below.
          </p>
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {blocked && <p className="error" role="alert">{blocked}</p>}

      {asking?.kind === 'verify' && (
        <ConfirmDialog title="Get verified?" yesLabel={`Yes, pay ${moneyLabel(verifyPrice.amount, verifyPrice.currency, null)} (demo)`} noLabel="No, go back"
          onYes={() => { onVerify(); setAsking(null) }} onNo={() => setAsking(null)}>
          <p className="demo-note">Demonstration only: no real money is taken.</p>
          <p>Pay <strong>{moneyLabel(verifyPrice.amount, verifyPrice.currency, null)}</strong> once. The admin checks your details, then a <strong>Verified</strong> badge appears on all your listings to buyers.</p>
        </ConfirmDialog>
      )}
      {asking?.kind === 'pro' && (
        <ConfirmDialog title="Start Seller Pro?" yesLabel={`Yes, pay ${moneyLabel(proPrice.amount, proPrice.currency, null)} (demo)`} noLabel="No, go back"
          onYes={() => { onStartPro(); setAsking(null) }} onNo={() => setAsking(null)}>
          <p className="demo-note">Demonstration only: no real money is taken.</p>
          <p>Pay <strong>{moneyLabel(proPrice.amount, proPrice.currency, null)}</strong> for {PRO_DAYS} days: a <strong>Pro</strong> badge on your listings and your order summary on this page. You can end the plan at any time.</p>
        </ConfirmDialog>
      )}
      {asking?.kind === 'end-pro' && (
        <ConfirmDialog title="End your Pro plan?" yesLabel="Yes, end plan" noLabel="No, keep it" danger
          onYes={() => { onEndPro(); setAsking(null) }} onNo={() => setAsking(null)}>
          <p>The Pro badge disappears from your listings immediately. The rest of the site keeps working as normal.</p>
        </ConfirmDialog>
      )}
    </section>
  )
}
