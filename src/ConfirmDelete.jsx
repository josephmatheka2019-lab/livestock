import ConfirmDialog from './ConfirmDialog.jsx'
import { animalLabel } from './listing.js'

// The seller's "delete this listing?" question.
export default function ConfirmDelete({ record, onYes, onNo }) {
  return (
    <ConfirmDialog title="Delete this listing?" yesLabel="Yes, delete" noLabel="No, keep it" danger onYes={onYes} onNo={onNo}>
      <p>
        Do you want to delete the <strong>{animalLabel(record)}</strong> listing
        {record.location ? <> in {record.location}</> : null}? This cannot be undone.
      </p>
    </ConfirmDialog>
  )
}
