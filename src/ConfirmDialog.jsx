import { useEffect, useRef } from 'react'

// A native modal <dialog> for yes/no questions: it traps focus, blocks the page behind it, and closes on
// Escape (which counts as "No"). Focus starts on "No", the safe answer, so an accidental Enter changes nothing.
// `danger` makes the "Yes" button red, for things that cannot be undone.
export default function ConfirmDialog({ title, children, yesLabel, noLabel, danger = false, onYes, onNo }) {
  const dialog = useRef(null)
  const noButton = useRef(null)

  useEffect(() => {
    const element = dialog.current
    element.showModal()
    noButton.current?.focus()
    return () => {
      if (element.open) element.close()
    }
  }, [])

  return (
    <dialog ref={dialog} className="confirm" aria-labelledby="confirm-heading" onCancel={(event) => { event.preventDefault(); onNo() }}>
      <h2 id="confirm-heading">{title}</h2>
      <div className="confirm-body">{children}</div>
      <div className="actions">
        <button type="button" className={danger ? 'danger' : undefined} onClick={onYes}>{yesLabel}</button>
        <button type="button" className="secondary" ref={noButton} onClick={onNo}>{noLabel}</button>
      </div>
    </dialog>
  )
}
