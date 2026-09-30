import { animalLabel } from './listing.js'

// Save a listing for later, or take it off the saved list. The name of the listing is added
// for screen readers, because a page full of identical "Save" buttons is hard to use.
export default function SaveButton({ record, saved, onToggle }) {
  const name = animalLabel(record)
  return (
    <button type="button" className="secondary save-button" onClick={() => onToggle(record)}>
      {saved ? 'Remove saved' : 'Save'}
      <span className="visually-hidden">{saved ? ` ${name} listing from your saved list` : ` ${name} listing for later`}</span>
    </button>
  )
}
