import { useEffect, useState } from 'react'
import { applyDisplayPreferences, readTextSize, readTheme, writeTextSize, writeTheme } from './storage.js'

const SIZES = [
  { value: 'small', label: 'A−', title: 'Smaller text' },
  { value: 'normal', label: 'A', title: 'Default text size' },
  { value: 'large', label: 'A+', title: 'Larger text' },
]

// Theme and text-size switches for the header. main.jsx applies the stored choices before the
// first paint; this component updates them live (and follows changes made in other tabs).
// Both choices are remembered in the browser, so every page opens the way the user left it.
export default function DisplayControls() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light')
  const [textSize, setTextSize] = useState(() => document.documentElement.dataset.textsize || 'normal')

  useEffect(() => {
    const sync = () => {
      const root = applyDisplayPreferences()
      setTheme(root.dataset.theme)
      setTextSize(root.dataset.textsize)
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  function chooseTheme(value) {
    writeTheme(value) // if storage is blocked, the choice still applies until reload
    document.documentElement.dataset.theme = value
    setTheme(value)
  }

  function chooseSize(value) {
    writeTextSize(value)
    document.documentElement.dataset.textsize = value
    setTextSize(value)
  }

  return (
    <div className="display-controls">
      <div className="display-group" role="group" aria-label="Light or dark appearance">
        <button type="button" aria-pressed={theme === 'light'} onClick={() => chooseTheme('light')}>Light</button>
        <button type="button" aria-pressed={theme === 'dark'} onClick={() => chooseTheme('dark')}>Dark</button>
      </div>
      <div className="display-group" role="group" aria-label="Text size">
        {SIZES.map((size) => (
          <button
            key={size.value}
            type="button"
            aria-pressed={textSize === size.value}
            aria-label={size.title}
            title={size.title}
            onClick={() => chooseSize(size.value)}
          >
            {size.label}
          </button>
        ))}
      </div>
    </div>
  )
}
