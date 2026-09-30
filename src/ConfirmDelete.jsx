import { useEffect, useRef } from 'react'
import { animalLabel } from './listing.js'

// A native modal <dialog>: it traps focus, blocks the page behind it, and closes
// on Escape (which counts as "No"). When it closes, focus returns to the button
// that opened it.
export default function ConfirmDelete({ record, onYes, onNo }) {
  const dialog = useRef(null)
  const noButton = useRef(null)

  useEffect(() => {
    const element = dialog.current
    element.showModal()
    // Default to the safe choice so an accidental Enter keeps the listing.
    noButton.current?.focus()
    return () => {
      if (element.open) element.close()
    }
  }, [])

  return (
    <dialog ref={dialog} className="confirm" aria-labelledby="confirm-heading" onCancel={(event) => { event.preventDefault(); onNo() }}>
      <h2 id="confirm-heading">Delete this listing?</h2>
      <p>
        Do you want to delete the <strong>{animalLabel(record)}</strong> listing
        {record.location ? <> in {record.location}</> : null}? This cannot be undone.
      </p>
      <div className="actions">
        <button type="button" className="danger" onClick={onYes}>Yes, delete</button>
        <button type="button" className="secondary" ref={noButton} onClick={onNo}>No, keep it</button>
      </div>
    </dialog>
  )
}
