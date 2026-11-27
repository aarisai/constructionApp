import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { syncNativeChrome } from '../lib/native'

type ThemeName = 'light' | 'dark'

interface ThemeApi {
  theme: ThemeName
  toggle: () => void
}

const ThemeContext = createContext<ThemeApi | null>(null)

function initialTheme(): ThemeName {
  const saved = localStorage.getItem('sankalpa-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(initialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('sankalpa-theme', theme)
    const themeColor = document.querySelector('meta[name="theme-color"]')
    themeColor?.setAttribute('content', theme === 'dark' ? '#101411' : '#f6f3ee')
    void syncNativeChrome(theme)
  }, [theme])

  const api = useMemo<ThemeApi>(
    () => ({
      theme,
      toggle: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={api}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeApi {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('Theme missing')
  return value
}
