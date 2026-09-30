import { ANIMAL_GROUPS } from './listing.js'

// Grouped <option>s shared by the listing form and the filter bar.
export default function AnimalTypeOptions() {
  return (
    <>
      {ANIMAL_GROUPS.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.types.map((type) => <option key={type} value={type}>{type}</option>)}
        </optgroup>
      ))}
      <option value="Other">Other</option>
    </>
  )
}
