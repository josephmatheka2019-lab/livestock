import { useEffect, useRef } from 'react'
import HeroArt from './HeroArt.jsx'
import SiteHeader from './SiteHeader.jsx'

// Small outline icons, drawn inline so they take no extra download.
const ICONS = {
  seller: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12.5V4h8.5L21 13.5 13.5 21z" />
      <circle cx="7.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  ),
  buyer: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.8-4.8" />
    </svg>
  ),
}

const ROLES = [
  {
    key: 'seller',
    title: 'I am a seller',
    text: 'List the livestock you have for sale with photos and prices, offer a bulk deal, and keep your listings up to date.',
    action: 'Continue as a seller',
  },
  {
    key: 'buyer',
    title: 'I am a buyer',
    text: 'Search livestock for sale by animal, place and price, see prices in your own currency, save the ones you like, and call or WhatsApp the seller.',
    action: 'Continue as a buyer',
  },
]

const POINTS = [
  ['Bulk friendly', 'Sellers can offer one price for the whole lot, and buyers see the saving.'],
  ['Prices in any currency', 'Buyers can view prices in dollars, euros, pounds, dinars and more.'],
  ['Straight to the seller', 'Call or WhatsApp the seller directly. No middleman.'],
]

export default function Landing() {
  const heading = useRef(null)

  useEffect(() => {
    document.title = 'Local Livestock Marketplace'
    heading.current?.focus()
  }, [])

  return (
    <main className="shell landing">
      <SiteHeader />

      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">FOR SMALL-SCALE FARMERS</p>
          <h1 ref={heading} tabIndex={-1}>Buy and sell livestock in bulk, close to home.</h1>
          <p className="intro">A simple marketplace where farmers list their animals and buyers find them. Choose how you want to use it to get started.</p>
        </div>
        <HeroArt />
      </section>

      <section aria-labelledby="role-heading">
        <h2 id="role-heading">How would you like to continue?</h2>
        <div className="role-grid">
          {ROLES.map((role) => (
            <article className={`panel role-card role-${role.key}`} key={role.key}>
              <h3>
                <span className="role-icon">{ICONS[role.key]}</span>
                {role.title}
              </h3>
              <p>{role.text}</p>
              <a className="button" href={`#/${role.key}`}>{role.action}</a>
            </article>
          ))}
        </div>
      </section>

      <ul className="points">
        {POINTS.map(([title, text]) => (
          <li key={title}><strong>{title}</strong>{text}</li>
        ))}
      </ul>

      <footer>
        <p>
          You can switch between seller and buyer at any time.{' '}
          <a href="/previous/">See the previous design</a> to compare.
        </p>
      </footer>
    </main>
  )
}
