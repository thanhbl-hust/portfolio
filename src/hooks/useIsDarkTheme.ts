import { useEffect, useState } from 'react'

function readTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark'
}

/** Tracks the site theme, which lives on <html data-theme>, so components
 * outside the toggle can react to it. */
export function useIsDarkTheme(): boolean {
  const [isDark, setIsDark] = useState(readTheme)

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => setIsDark(readTheme()))
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    setIsDark(readTheme())
    return () => observer.disconnect()
  }, [])

  return isDark
}
