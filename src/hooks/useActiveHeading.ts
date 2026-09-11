import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TocItem } from '../toc'

/** How far past its landing spot a heading may sit and still count as reached -
 * enough to absorb the rounding a smooth scroll leaves behind. */
const TOLERANCE_PX = 12

/** Quiet time after which the smooth scroll a click started counts as done. */
const SETTLE_MS = 180

/** A heading's distance from the top of the document. Read from offsetTop, not
 * getBoundingClientRect: the scroll-reveal slides headings in with an 18px
 * transform, and a heading that has just come into view can still be mid-slide.
 * Measured with the transform included it lands in the wrong place. */
function documentTop(element: HTMLElement): number {
  let top = 0
  for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) {
    top += node.offsetTop
  }
  return top
}

/** How far below the top of the viewport a heading should sit once scrolled to:
 * its scroll-margin-top, which is what keeps it clear of the fixed header. */
function landingOffset(heading: HTMLElement): number {
  return parseFloat(getComputedStyle(heading).scrollMarginTop) || 0
}

type Pin = { id: string; settledAt: number | null }

/**
 * Scroll-spy for the table of contents.
 *
 * While reading, the active section is the last heading whose top has passed the
 * line where a picked heading lands. At the very bottom of the page the last
 * entry wins, since a short final section can never scroll up to that line.
 *
 * Picking an entry pins it. The tail of an article often holds several short
 * sections that fit on one screen, and without the pin a click on the
 * second-to-last would light up the last. The pin lets go as soon as the reader
 * scrolls again.
 */
export function useActiveHeading(items: TocItem[]) {
  const ids = useMemo(
    () => items.flatMap((item) => [item.id, ...item.children.map((child) => child.id)]),
    [items],
  )
  const [activeId, setActiveId] = useState<string | undefined>(ids[0])
  const pin = useRef<Pin | null>(null)
  const settleTimer = useRef(0)

  // The smooth scroll a click starts fires scroll events of its own; the pin is
  // settled once they have been quiet for a moment.
  const armSettle = useCallback((current: Pin) => {
    window.clearTimeout(settleTimer.current)
    settleTimer.current = window.setTimeout(() => {
      current.settledAt = window.scrollY
    }, SETTLE_MS)
  }, [])

  const scrollToHeading = useCallback(
    (id: string) => {
      const heading = document.getElementById(id)
      if (!heading) return
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      // Not scrollIntoView: it would measure the heading mid-reveal and park it
      // 18px too high, partly under the fixed header.
      window.scrollTo({
        top: documentTop(heading) - landingOffset(heading),
        behavior: reduceMotion ? 'auto' : 'smooth',
      })
      const next: Pin = { id, settledAt: null }
      pin.current = next
      setActiveId(id)
      armSettle(next)
    },
    [armSettle],
  )

  useEffect(() => {
    pin.current = null
    if (ids.length === 0) return
    let frame = 0

    function update() {
      frame = 0
      if (pin.current) return
      const headings = ids
        .map((id) => document.getElementById(id))
        .filter((heading): heading is HTMLElement => heading !== null)
      if (headings.length === 0) return

      // The landing line, in document coordinates.
      const line = window.scrollY + landingOffset(headings[0]) + TOLERANCE_PX
      let current = headings[0].id
      for (const heading of headings) {
        if (documentTop(heading) > line) break
        current = heading.id
      }

      const root = document.documentElement
      if (window.scrollY > 0 && window.innerHeight + window.scrollY >= root.scrollHeight - 2) {
        current = headings[headings.length - 1].id
      }

      setActiveId(current)
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update)
    }

    function onScroll() {
      const current = pin.current
      if (current) {
        if (current.settledAt === null) {
          armSettle(current)
          return
        }
        if (Math.abs(window.scrollY - current.settledAt) < 2) return
        pin.current = null
      }
      schedule()
    }

    schedule()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', schedule)
      cancelAnimationFrame(frame)
      window.clearTimeout(settleTimer.current)
    }
  }, [ids, armSettle])

  return { activeId, scrollToHeading }
}
