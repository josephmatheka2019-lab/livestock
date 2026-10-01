import { useEffect, useRef, useState } from 'react'
import SiteHeader from './SiteHeader.jsx'
import { checkAdminCredentials, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from './admin.js'

// The admin sign-in. This is a demonstration: the credentials are shown on the screen and the
// check runs in the browser, so it stops casual visitors but is not real security. A real admin
// account (Supabase) replaces it before the site goes live.
export default function AdminLogin({ onSignIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const emailInput = useRef(null)

  useEffect(() => {
    document.title = 'Administration sign-in – Local Livestock Marketplace'
    emailInput.current?.focus()
  }, [])

  function submit(event) {
    event.preventDefault()
    if (!checkAdminCredentials(email, password)) {
      setError('That email address and password do not match the admin account.')
      return
    }
    onSignIn({ email: DEMO_ADMIN_EMAIL, signedInAt: new Date().toISOString() })
  }

  return (
    <main className="shell role-admin">
      <SiteHeader role="admin" />
      <div className="hero">
        <p className="eyebrow">ADMINISTRATION</p>
        <h1>Admin sign-in</h1>
        <p className="intro">Sign in to see the transactions, the fees, the escrow holds and the accounts.</p>
      </div>

      <p className="demo-note">
        Demonstration only — the credentials are below, the check runs in your browser, and this is
        not real security. A proper admin account replaces it before going live.
      </p>

      <section className="panel" aria-labelledby="signin-heading">
        <h2 id="signin-heading">Sign in</h2>
        <form onSubmit={submit} noValidate>
          <label htmlFor="admin-email">Email address</label>
          <input id="admin-email" name="email" type="email" inputMode="email" autoComplete="username"
            ref={emailInput} value={email} onChange={(event) => { setEmail(event.target.value); setError('') }}
            aria-invalid={error ? true : undefined} aria-describedby={error ? 'admin-signin-error' : undefined} />

          <label htmlFor="admin-password">Password</label>
          <input id="admin-password" name="password" type="password" autoComplete="current-password"
            value={password} onChange={(event) => { setPassword(event.target.value); setError('') }}
            aria-invalid={error ? true : undefined} aria-describedby={error ? 'admin-signin-error' : undefined} />

          {error && <p className="error" id="admin-signin-error" role="alert">{error}</p>}

          <div className="actions"><button type="submit">Sign in</button></div>
        </form>

        <p className="hint">
          Demo credentials: <strong>{DEMO_ADMIN_EMAIL}</strong> / <strong>{DEMO_ADMIN_PASSWORD}</strong>
        </p>
      </section>

      <footer>
        <p>The sign-in lasts for this tab only: it survives a refresh, and closing the tab signs you out.</p>
      </footer>
    </main>
  )
}
