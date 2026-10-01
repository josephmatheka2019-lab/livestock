import { useEffect, useState } from 'react'
import AdminLogin from './AdminLogin.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import OrderCard from './OrderCard.jsx'
import SiteHeader from './SiteHeader.jsx'
import { formatMoney, moneyLabel } from './currency.js'
import {
  ACCOUNT_STATUS_LABELS, accountStatus, cleanAdminState, feeFor, holdPayment, isHeld,
  PLATFORM_FEE_RATE, releasePayment, setAccountStatus, summarizeForAdmin,
} from './admin.js'
import { sortOrders } from './orders.js'
import {
  clearAdminSession, readAdmin, readAdminSession, readBuyerProfile, readOrders, readProfile, writeAdmin,
  writeAdminSession,
} from './storage.js'

function ValueLines({ value }) {
  const codes = Object.keys(value)
  if (codes.length === 0) return <span className="stat-none">None</span>
  return (
    <ul className="stat-lines">
      {codes.map((code) => <li key={code}>{formatMoney(value[code], code)}</li>)}
    </ul>
  )
}

// The platform's own view: every order with its fee, the money being held in escrow, and the
// power to suspend or terminate an account. Reached at #/admin — the demo sign-in gates it,
// and it is not linked from the buyer or seller pages (see the README limits).
export default function AdminPage() {
  const [session, setSession] = useState(() => readAdminSession())

  function signIn(next) {
    writeAdminSession(next)
    setSession(next)
  }

  function signOut() {
    clearAdminSession()
    setSession(null)
  }

  if (!session) return <AdminLogin onSignIn={signIn} />
  return <AdminDashboard session={session} onSignOut={signOut} />
}

function AdminDashboard({ session, onSignOut }) {
  const [orders, setOrders] = useState(() => sortOrders(readOrders() ?? []))
  const [admin, setAdmin] = useState(() => cleanAdminState(readAdmin()))
  const [error, setError] = useState('')
  const [announcement, setAnnouncement] = useState({ text: '', count: 0 })
  // { kind: 'hold' | 'release' | 'status', ... } — every admin action asks first.
  const [asking, setAsking] = useState(null)

  const seller = readProfile()
  const buyer = readBuyerProfile()
  const summary = summarizeForAdmin(orders, admin)

  useEffect(() => {
    document.title = 'Administration – Local Livestock Marketplace'
    const refresh = () => {
      setOrders(sortOrders(readOrders() ?? []))
      setAdmin(cleanAdminState(readAdmin()))
    }
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [])

  useEffect(() => {
    writeAdmin(admin)
  }, [admin])

  function announce(text) {
    setAnnouncement((current) => ({ text, count: current.count + 1 }))
  }

  function saveAdmin(next, message) {
    if (!writeAdmin(next)) {
      setError('This browser could not save the change. Check that storage is not blocked, then try again.')
      return
    }
    setAdmin(next)
    setError('')
    announce(message)
  }

  function changeStatus(accountId, status) {
    const result = setAccountStatus(admin, accountId, status)
    setAsking(null)
    if (result.error) { setError(result.error); return }
    const who = accountId === 'seller' ? seller?.businessName || 'the seller' : buyer?.name || 'the buyer'
    saveAdmin(result.admin, `${who} is now ${ACCOUNT_STATUS_LABELS[status].toLowerCase()}.`)
  }

  function changeHold(order, held) {
    const result = held ? holdPayment(admin, order.id) : releasePayment(admin, order.id)
    setAsking(null)
    if (result.error) { setError(result.error); return }
    saveAdmin(result.admin, held
      ? `Payment for order ${order.id.slice(0, 8).toUpperCase()} is now held by the platform.`
      : `The hold on order ${order.id.slice(0, 8).toUpperCase()} was released.`)
  }

  // One row of buttons per account: whatever the status allows right now.
  function statusActions(accountId) {
    const status = accountStatus(admin, accountId)
    return (
      <div className="actions">
        {status !== 'active' && (
          <button type="button" onClick={() => setAsking({ kind: 'status', accountId, status: 'active' })}>
            Reinstate
          </button>
        )}
        {status === 'active' && (
          <button type="button" className="secondary"
            onClick={() => setAsking({ kind: 'status', accountId, status: 'suspended' })}>
            Suspend
          </button>
        )}
        {status !== 'terminated' && (
          <button type="button" className="danger"
            onClick={() => setAsking({ kind: 'status', accountId, status: 'terminated' })}>
            Terminate
          </button>
        )}
      </div>
    )
  }

  const accounts = [
    {
      id: 'seller',
      label: 'Seller',
      who: seller ? `${seller.businessName}${seller.location ? ` · ${seller.location}` : ''}` : 'No seller profile in this browser yet',
      contact: seller?.phone ?? '',
    },
    {
      id: 'buyer',
      label: 'Buyer',
      who: buyer ? `${buyer.name}${buyer.location ? ` · ${buyer.location}` : ''}` : 'No buyer profile in this browser yet',
      contact: buyer?.phone ?? '',
    },
  ]

  const held = asking?.kind === 'hold' || asking?.kind === 'release'

  return (
    <main className="shell role-admin">
      <SiteHeader role="admin" />
      <div className="hero">
        <p className="eyebrow">ADMINISTRATION</p>
        <h1>Platform administration</h1>
        <p className="intro">
          Every order with the platform fee on it, the payments being held in escrow, and the
          accounts that can be suspended or terminated. Each action asks for confirmation first.
        </p>
      </div>

      <section className="panel summary admin-session" aria-label="Signed in">
        <p className="order-ref" style={{ margin: 0 }}>
          Signed in as <strong>{session.email}</strong> · demo session, this tab only
        </p>
        <div className="actions" style={{ marginTop: 0 }}>
          <button type="button" className="secondary" onClick={onSignOut}>Sign out</button>
        </div>
      </section>

      <p className="demo-note">
        Demonstration only: no real money moves, and the sign-in checks your browser rather than a
        server — see the README limits before relying on it.
      </p>
      {error && <p className="error" role="alert">{error}</p>}

      <section className="panel summary" aria-labelledby="admin-stats-heading">
        <h2 id="admin-stats-heading" className="visually-hidden">The platform at a glance</h2>
        <dl className="stat-grid">
          <div className="stat">
            <dt>Orders</dt>
            <dd className="stat-number">{summary.count}</dd>
            <dd className="stat-none">{summary.open} open · {summary.completed} completed</dd>
          </div>
          <div className="stat"><dt>Value of completed orders</dt><dd><ValueLines value={summary.totals} /></dd></div>
          <div className="stat"><dt>Platform fees ({PLATFORM_FEE_RATE * 100}%)</dt><dd><ValueLines value={summary.fees} /></dd></div>
          <div className="stat">
            <dt>Held in escrow</dt>
            <dd className="stat-number">{summary.heldCount}</dd>
            <dd><ValueLines value={summary.heldTotals} /></dd>
          </div>
        </dl>
        <p className="hint">
          Fees are charged on M-Pesa and card orders once paid; cash orders carry no fee because
          the money never passes through the platform.
        </p>
      </section>

      <section className="records" aria-labelledby="accounts-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ACCOUNTS</p>
            <h2 id="accounts-heading" tabIndex={-1}>Who can trade</h2>
          </div>
        </div>
        <ul className="order-list">
          {accounts.map((account) => {
            const status = accountStatus(admin, account.id)
            const badge = status === 'active' ? 'status-completed' : status === 'suspended' ? 'status-placed' : 'status-cancelled'
            return (
              <li className="order-card" key={account.id}>
                <div className="order-head">
                  <h3>{account.label}</h3>
                  <span className={`badge order-status ${badge}`}>{ACCOUNT_STATUS_LABELS[status]}</span>
                </div>
                <p className="order-ref">{account.who}{account.contact ? ` · ${account.contact}` : ''}</p>
                {status === 'suspended' && <p className="order-wait">Suspended: cannot place, post or accept orders until reinstated.</p>}
                {status === 'terminated' && <p className="order-wait">Terminated: locked out for good. Only a new account can trade.</p>}
                {statusActions(account.id)}
              </li>
            )
          })}
        </ul>
      </section>


      <section className="records" aria-labelledby="transactions-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TRANSACTIONS</p>
            <h2 id="transactions-heading" tabIndex={-1}>Orders and fees <span className="count" aria-live="polite">{orders.length}</span></h2>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="empty">
            <h3>No transactions yet.</h3>
            <p>Orders appear here as soon as a buyer places one.</p>
          </div>
        ) : (
          <ul className="order-list">
            {orders.map((order) => {
              const fee = feeFor(order)
              const heldNow = isHeld(admin, order.id)
              return (
                <OrderCard key={order.id} order={order} role="admin" seller={seller}>
                  <dl className="admin-fee">
                    <div><dt>Platform fee</dt>
                      <dd>{fee > 0 ? moneyLabel(fee, order.currency, null) : 'None (cash)'}</dd></div>
                    <div><dt>Escrow</dt>
                      <dd>{heldNow ? 'Held by the platform' : 'Not held'}</dd></div>
                  </dl>
                  {order.status === 'paid' && !heldNow && (
                    <button type="button" className="danger"
                      onClick={() => setAsking({ kind: 'hold', order })}>
                      Hold payment<span className="visually-hidden"> for order {order.id.slice(0, 8).toUpperCase()}</span>
                    </button>
                  )}
                  {heldNow && (
                    <>
                      <span className="order-wait">Payment held: the seller cannot complete this order.</span>
                      <button type="button" onClick={() => setAsking({ kind: 'release', order })}>
                        Release payment<span className="visually-hidden"> for order {order.id.slice(0, 8).toUpperCase()}</span>
                      </button>
                    </>
                  )}
                </OrderCard>
              )
            })}
          </ul>
        )}
      </section>

      <footer>
        <p>
          Fees follow the monetisation plan in <code>docx/Monetisation Plan.md</code>. A hold is
          escrow: the money stays with the platform until the admin releases it.
        </p>
      </footer>

      <div className="visually-hidden" role="status" aria-live="polite">
        <span key={announcement.count}>{announcement.text}</span>
      </div>

      {asking?.kind === 'status' && (
        <ConfirmDialog
          title={asking.status === 'active'
            ? `Reinstate this ${asking.accountId} account?`
            : asking.status === 'suspended' ? 'Suspend this account?' : 'Terminate this account?'}
          yesLabel={asking.status === 'active' ? 'Yes, reinstate' : asking.status === 'suspended' ? 'Yes, suspend' : 'Yes, terminate'}
          noLabel="No, go back"
          danger={asking.status !== 'active'}
          onYes={() => changeStatus(asking.accountId, asking.status)}
          onNo={() => setAsking(null)}>
          <p>
            {asking.status === 'active'
              ? 'The account can place, post and accept orders again.'
              : asking.status === 'suspended'
                ? 'They keep their data but cannot place, post or accept orders until you reinstate them.'
                : 'This cannot be undone: the account is locked out for good and only a new account can trade again.'}
          </p>
        </ConfirmDialog>
      )}
      {held && (
        <ConfirmDialog
          title={asking.kind === 'hold' ? 'Hold this payment?' : 'Release this payment?'}
          yesLabel={asking.kind === 'hold' ? 'Yes, hold payment' : 'Yes, release'}
          noLabel="No, go back"
          danger={asking.kind === 'hold'}
          onYes={() => changeHold(asking.order, asking.kind === 'hold')}
          onNo={() => setAsking(null)}>
          <p className="demo-note">Demonstration only: no real money is taken or held.</p>
          <p>
            {asking.kind === 'hold'
              ? <>Hold <strong>{moneyLabel(asking.order.total, asking.order.currency, null)}</strong> for {asking.order.quantity} × {asking.order.listingLabel}? The seller cannot complete this order until you release it.</>
              : <>Release the hold on <strong>{moneyLabel(asking.order.total, asking.order.currency, null)}</strong>? The seller can then complete the order as normal.</>}
          </p>
        </ConfirmDialog>
      )}
    </main>
  )
}

