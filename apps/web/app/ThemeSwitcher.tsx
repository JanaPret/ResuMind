"use client"

import { useEffect, useState } from 'react'

const THEMES = [
  { id: 'brand', label: 'Brand' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'forest', label: 'Forest' },
  { id: 'emerald', label: 'Emerald' },
  { id: 'violet', label: 'Violet' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'gold', label: 'Gold' },
]

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<string>('emerald')

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    const initial = stored && stored !== 'gold' ? stored : 'emerald'
    setTheme(initial)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', initial)
    }
  }, [])

  const onChange = (value: string) => {
    setTheme(value)
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', value)
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', value)
    }
  }

  return (
    <label className="flex items-center gap-2">
      <span className="sr-only">Theme</span>
      <select
        aria-label="Theme"
        className="rounded-lg border border-gray-200 bg-white/70 px-2 py-1 text-gray-700 outline-none focus:ring-2 focus:ring-indigo-400"
        value={theme}
        onChange={(e) => onChange(e.target.value)}
      >
        {THEMES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </label>
  )
}
