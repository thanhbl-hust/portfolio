import { useEffect } from 'react'
import type { RefObject } from 'react'

/** Fades in the direct children of a container as they scroll into view,
 * in either direction. The "hidden" starting state lives in CSS (see
 * `.reveal-group > *` in index.css) so there's no flash of fully-visible
 * content before this effect has a chance to run. */
export function useRevealChildren(ref: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useEffect(() => {
    const container = ref.current
    if (!container) return

    const children = Array.from(container.children) as HTMLElement[]
    if (children.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' },
    )

    children.forEach((child) => observer.observe(child))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
