import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/figtree/wght'
import App from './App.jsx'
import { applyDisplayPreferences } from './storage.js'
import './styles.css'

// Set the theme and text size before the first paint: no flash of the wrong mode.
applyDisplayPreferences()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
