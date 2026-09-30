import { animalLabel, listingState } from './listing.js'

// A buyer's saved listings: [{ id, savedAt, label }], newest first. The label is kept so a
// listing that has since been sold or deleted can still be named on the Saved page.

export function isSaved(list, id) {
  return list.some((entry) => entry.id === id)
}

export function addSaved(list, record, now = new Date()) {
  if (isSaved(list, record.id)) return list
  return [{ id: record.id, savedAt: now.toISOString(), label: animalLabel(record) }, ...list]
}

export function removeSaved(list, id) {
  return list.filter((entry) => entry.id !== id)
}

// Anything read back from storage is checked: keep entries that have an id, drop repeats,
// and fill in a missing date or name so a half-damaged list still works.
export function cleanSaved(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  const clean = []
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string' || !entry.id || seen.has(entry.id)) continue
    seen.add(entry.id)
    clean.push({
      id: entry.id,
      savedAt: typeof entry.savedAt === 'string' ? entry.savedAt : '',
      label: typeof entry.label === 'string' && entry.label ? entry.label : 'Listing',
    })
  }
  return clean
}

// Each saved entry paired with its listing, if it still exists, and whether a buyer can still buy it.
export function savedView(list, records) {
  return [...list]
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .map((entry) => {
      const record = records.find((item) => item.id === entry.id) ?? null
      // 'available', 'paused' or 'sold' while the listing exists; 'removed' once the seller deletes it.
      const state = record ? listingState(record) : 'removed'
      return { entry, record, state, available: state === 'available', label: record ? animalLabel(record) : entry.label }
    })
}
