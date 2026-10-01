import DisplayControls from './DisplayControls.jsx'

// The mark: a barn. Simple shapes, so it stays sharp at any size and costs almost nothing to load.
function BrandMark() {
  return (
    <svg className="brand-mark" width="38" height="38" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect width="40" height="40" rx="11" fill="#2d6a3e" />
      <path d="M7.5 19.5 20 8.5l12.5 11V32h-25z" fill="#fff" />
      <path d="M7.5 19.5 20 8.5l12.5 11" fill="none" stroke="#f4b942" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      <rect x="15.5" y="21.5" width="9" height="10.5" rx="1" fill="#2d6a3e" />
      <path d="M15.5 21.5 24.5 32M24.5 21.5 15.5 32" stroke="#fff" strokeWidth="1.4" />
    </svg>
  )
}

// Shown at the top of every page. On the seller, buyer and admin pages it also says which side you are
// on, offers the way back to the first screen, and carries the theme and text-size controls.
export default function SiteHeader({ role = null }) {
  return (
    <header className="site-header">
      <a className="brand" href="#/" aria-label="Local Livestock Marketplace, back to the first screen">
        <BrandMark />
        <span className="brand-name">Local Livestock<br />Marketplace</span>
      </a>
      {role && (
        <div className="header-tools">
          <DisplayControls />
          <p className="role-pill" style={{ margin: 0 }}>
            <span>{role === 'seller' ? 'Seller' : role === 'admin' ? 'Admin' : 'Buyer'}</span>
            <a href="#/">{role === 'admin' ? 'Back to the site' : 'Switch role'}</a>
          </p>
        </div>
      )}
    </header>
  )
}
