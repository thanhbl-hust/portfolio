import { useSyncExternalStore } from 'react'

function readTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark'
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

/** Tracks the site theme, which lives on <html data-theme>, so components
 * outside the toggle can react to it. */
export function useIsDarkTheme(): boolean {
  return useSyncExternalStore(subscribe, readTheme)
}
