import { useEffect, useRef, useState } from 'react'
import { authConfigured, signIn, signUp } from './auth.js'
import SiteHeader from './SiteHeader.jsx'
import { MIN_PASSWORD, validateCredentials } from './authValidation.js'

const COPY = {
  seller: {
    name: 'seller',
    other: 'buyer',
    signupHint: 'After creating your account you will add your business name and phone number, so buyers can reach you.',
    signinIntro: 'Log in to manage your livestock listings.',
  },
  buyer: {
    name: 'buyer',
    other: 'seller',
    signupHint: 'After creating your account you will add your name and phone number, so you can contact sellers.',
    signinIntro: 'Log in to browse livestock and see your saved listings.',
  },
}

const emptyValues = { email: '', password: '', confirm: '' }
const FIELD_ORDER = ['email', 'password', 'confirm']

export default function AuthPage({ role }) {
  const copy = COPY[role]
  const [mode, setMode] = useState('signin')
  const [values, setValues] = useState(emptyValues)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const heading = useRef(null)
  const isSignup = mode === 'signup'

  useEffect(() => {
    document.title = `${isSignup ? 'Create' : 'Log in to'} ${copy.name} account – Local Livestock Marketplace`
  }, [copy.name, isSignup])

  useEffect(() => {
    heading.current?.focus()
  }, [role])

  function switchMode(next) {
    setMode(next)
    setValues(emptyValues)
    setErrors({})
    setFormError('')
  }

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      if (!current[name]) return current
      const { [name]: _cleared, ...rest } = current
      return rest
    })
    setFormError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validateCredentials(values, mode)
    const first = FIELD_ORDER.find((name) => found[name])
    if (first) {
      setErrors(found)
      document.getElementById(`auth-${first}`)?.focus()
      return
    }
    setBusy(true)
    const action = isSignup ? signUp : signIn
    const result = await action(role, values.email.trim(), values.password)
    setBusy(false)
    if (result?.error) setFormError(result.error)
  }

  function field(name) {
    return errors[name] ? { 'aria-invalid': true, 'aria-describedby': `auth-${name}-error` } : {}
  }

  return (
    <main className={`shell auth role-${role}`}>
      <SiteHeader role={role} />

      <div className="hero">
        <p className="eyebrow">{role.toUpperCase()} ACCOUNT</p>
        <h1 ref={heading} tabIndex={-1}>{isSignup ? `Create a ${copy.name} account` : `Log in as a ${copy.name}`}</h1>
        <p className="intro">{isSignup ? copy.signupHint : copy.signinIntro}</p>
      </div>

      {!authConfigured && (
        <p className="notice" role="status">
          Accounts are not connected yet, so logging in and registering are switched off for now.
        </p>
      )}

      <section className="panel" aria-label={isSignup ? 'Create account' : 'Log in'}>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="auth-email">Email address</label>
          <input id="auth-email" name="email" type="email" autoComplete="email" inputMode="email"
            value={values.email} onChange={handleChange} {...field('email')} />
          {errors.email && <p className="error" id="auth-email-error" role="alert">{errors.email}</p>}

          <label htmlFor="auth-password">Password</label>
          <input id="auth-password" name="password" type="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={values.password} onChange={handleChange} {...field('password')}
            aria-describedby={errors.password ? 'auth-password-error' : isSignup ? 'auth-password-hint' : undefined} />
          {errors.password && <p className="error" id="auth-password-error" role="alert">{errors.password}</p>}
          {isSignup && <p className="hint" id="auth-password-hint">At least {MIN_PASSWORD} characters.</p>}

          {isSignup && (
            <>
              <label htmlFor="auth-confirm">Confirm password</label>
              <input id="auth-confirm" name="confirm" type="password" autoComplete="new-password"
                value={values.confirm} onChange={handleChange} {...field('confirm')} />
              {errors.confirm && <p className="error" id="auth-confirm-error" role="alert">{errors.confirm}</p>}
            </>
          )}

          {formError && <p className="error form-error" role="alert">{formError}</p>}

          <div className="actions">
            <button type="submit" disabled={busy}>
              {busy ? 'Please wait…' : isSignup ? `Create ${copy.name} account` : 'Log in'}
            </button>
          </div>
        </form>

        <p className="switch-mode">
          {isSignup ? 'Already have an account? ' : `New ${copy.name}? `}
          <button type="button" className="link" onClick={() => switchMode(isSignup ? 'signin' : 'signup')}>
            {isSignup ? 'Log in' : 'Create an account'}
          </button>
        </p>
      </section>

      <footer>
        <p>This is the {copy.name} area. Looking to {copy.other === 'seller' ? 'sell' : 'buy'} instead?{' '}
          <a href={`#/${copy.other}/login`}>Go to the {copy.other} login</a>.</p>
      </footer>
    </main>
  )
}
