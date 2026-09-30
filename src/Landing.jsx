import { useEffect, useRef } from 'react'

const ROLES = [
  {
    key: 'seller',
    title: 'I am a seller',
    text: 'List the livestock you have for sale, add photos and prices, and manage your listings.',
    action: 'Continue as a seller',
  },
  {
    key: 'buyer',
    title: 'I am a buyer',
    text: 'Browse livestock for sale, filter by animal and location, save favourites and contact sellers.',
    action: 'Continue as a buyer',
  },
]

export default function Landing() {
  const heading = useRef(null)

  useEffect(() => {
    document.title = 'Local Livestock Marketplace'
    heading.current?.focus()
  }, [])

  return (
    <main className="shell">
      <header className="hero">
        <p className="eyebrow">FOR SMALL-SCALE FARMERS</p>
        <h1 ref={heading} tabIndex={-1}>Local Livestock Marketplace</h1>
        <p className="intro">Buy and sell livestock in bulk. Choose how you want to use the marketplace.</p>
      </header>

      <section aria-labelledby="role-heading">
        <h2 id="role-heading">How would you like to continue?</h2>
        <div className="role-grid">
          {ROLES.map((role) => (
            <article className={`panel role-card role-${role.key}`} key={role.key}>
              <h3>{role.title}</h3>
              <p>{role.text}</p>
              <a className="button" href={`#/${role.key}`}>{role.action}</a>
            </article>
          ))}
        </div>
      </section>

      <footer><p>You can switch between seller and buyer at any time.</p></footer>
    </main>
  )
}
