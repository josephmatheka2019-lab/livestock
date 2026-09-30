import { enquiryMessage, telHref, whatsappHref } from './contact.js'
import { isProfileComplete } from './sellerProfile.js'

// Who to call about a listing. The seller's name and place are always shown; the phone number
// appears only once the buyer has added their own details, so sellers know who is asking.
export default function SellerContact({ record, seller, buyer, buyerReady, onNeedProfile }) {
  const sellerReady = Boolean(seller) && isProfileComplete(seller)

  return (
    <section className="contact" aria-labelledby="contact-heading">
      <h3 id="contact-heading">Contact the seller</h3>

      {!sellerReady && (
        <p className="hint">This seller has not added contact details yet, so there is no phone number to show.</p>
      )}

      {sellerReady && (
        <>
          <p className="contact-seller">
            <strong>{seller.businessName}</strong>
            {seller.location ? <> · {seller.location}</> : null}
          </p>

          {!buyerReady && (
            <div className="contact-locked">
              <p>Add your name and phone number to see the seller&rsquo;s phone number and get in touch.</p>
              <button type="button" onClick={onNeedProfile}>Add my details</button>
            </div>
          )}

          {buyerReady && (
            <>
              <p className="contact-phone">Phone: <strong>{seller.phone}</strong></p>
              <div className="actions">
                <a className="button" href={telHref(seller.phone)}>
                  Call<span className="visually-hidden"> {seller.businessName}</span>
                </a>
                {whatsappHref(seller.phone, record.currency, enquiryMessage(record, buyer.name)) && (
                  <a className="button button-whatsapp" target="_blank" rel="noopener noreferrer"
                    href={whatsappHref(seller.phone, record.currency, enquiryMessage(record, buyer.name))}>
                    WhatsApp<span className="visually-hidden"> {seller.businessName} (opens in a new tab)</span>
                  </a>
                )}
              </div>
              {!whatsappHref(seller.phone, record.currency, 'x') && (
                <p className="hint">
                  WhatsApp is not offered because this number has no country code. You can still call.
                </p>
              )}
            </>
          )}
        </>
      )}
    </section>
  )
}
