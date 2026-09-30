// Sign-in and registration for the seller and buyer accounts.
//
// The accounts service (Supabase) is not connected yet, so these calls report that
// plainly instead of pretending to sign anyone in. Once the project URL and public key
// are in .env.local, the real calls replace the two functions below.
export const authConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY,
)

const NOT_CONNECTED =
  'Accounts are not connected yet, so nobody can sign in or register. This page is ready and will work once the accounts service is set up.'

export async function signIn() {
  return { error: NOT_CONNECTED }
}

export async function signUp() {
  return { error: NOT_CONNECTED }
}
