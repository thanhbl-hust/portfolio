import { useEffect } from 'react'
import type { RefObject } from 'react'

/**
 * Lets a box that scrolls sideways - a long code line, a wide table - take
 * keyboard focus, so it can be scrolled with the arrow keys. Only while it
 * actually overflows: a tab stop on every short code block would be noise.
 */
export function useKeyboardScrollable(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current
    if (!element) return

    const sync = () => {
      if (element.scrollWidth > element.clientWidth + 1) element.tabIndex = 0
      else element.removeAttribute('tabindex')
    }

    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(element)
    // The web font landing can push a line past the edge without resizing the box.
    void document.fonts?.ready.then(sync)
    return () => observer.disconnect()
  }, [ref])
}
