import { isProfileComplete } from './sellerProfile.js'

// Contact details never cross sides: the buyer never sees the seller's phone number and the
// seller never sees the buyer's, so neither deal can be taken off the platform. Everything is
// arranged through the order (its note and delivery address), and payment happens on the site.
export default function SellerContact({ seller }) {
  const sellerReady = Boolean(seller) && isProfileComplete(seller)

  return (
    <section className="contact" aria-labelledby="contact-heading">
      <h3 id="contact-heading">Contact stays on the platform</h3>

      <p className="contact-seller">
        {sellerReady ? (
          <>
            <strong>{seller.businessName}</strong>
            {seller.location ? <> · {seller.location}</> : null}
          </>
        ) : (
          <>This seller has not added business details yet.</>
        )}
      </p>

      <p className="hint">
        Phone numbers are hidden on both sides. Put any questions in your order&rsquo;s note, and pay
        through the order &mdash; the platform holds the payment until the animals are delivered.
      </p>
    </section>
  )
}
