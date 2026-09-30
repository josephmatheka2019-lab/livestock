import { useSyncExternalStore } from 'react'

// A tiny hash router (#/seller/login), so the app needs no extra library and
// works on any static host without server rewrites.
function subscribe(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

function currentRoute() {
  return window.location.hash.replace(/^#/, '') || '/'
}

export function useRoute() {
  return useSyncExternalStore(subscribe, currentRoute)
}

export function navigate(path) {
  window.location.hash = path
}
