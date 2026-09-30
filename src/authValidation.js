export const MIN_PASSWORD = 8

// mode is 'signin' or 'signup'; sign-up also asks for the password twice.
export function validateCredentials(values, mode) {
  const errors = {}
  const email = values.email.trim()

  if (!email) errors.email = 'Enter your email address.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Enter a valid email address, such as name@example.com.'

  if (!values.password) errors.password = 'Enter your password.'
  else if (mode === 'signup' && values.password.length < MIN_PASSWORD) {
    errors.password = `Use at least ${MIN_PASSWORD} characters.`
  }

  if (mode === 'signup') {
    if (!values.confirm) errors.confirm = 'Enter the password again.'
    else if (values.confirm !== values.password) errors.confirm = 'The two passwords do not match.'
  }

  return errors
}
