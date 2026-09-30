import ListingSummary from './ListingSummary.jsx'

// Shows the listing exactly as a buyer's list will draw it, from what has been typed
// so far, plus the seller contact details taken from the profile.
export default function ListingPreview({ form, profile }) {
  const contact = [profile.businessName, profile.phone, profile.location].filter(Boolean)

  return (
    <details className="preview">
      <summary>Preview how buyers will see this</summary>
      {form.animalType ? (
        <div className="record preview-card">
          <ListingSummary record={form} />
        </div>
      ) : (
        <p className="hint">Choose an animal type to see the preview.</p>
      )}
      <p className="preview-seller">
        <strong>Seller contact:</strong> {contact.join(' · ')}
      </p>
      <p className="hint">Change these in your seller profile at the top of the page.</p>
    </details>
  )
}
