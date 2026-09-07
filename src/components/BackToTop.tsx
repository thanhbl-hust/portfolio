import { useEffect, useRef, useState } from 'react'

const SHOW_AFTER_PX = 400

export function BackToTop() {
  const [visible, setVisible] = useState(false)
  const ticking = useRef(false)

  useEffect(() => {
    function update() {
      setVisible(window.scrollY > SHOW_AFTER_PX)
      ticking.current = false
    }

    function onScroll() {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      className={`back-to-top${visible ? ' back-to-top--visible' : ''}`}
      onClick={scrollToTop}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      aria-label="Back to top"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="6 11 12 5 18 11" />
      </svg>
    </button>
  )
}
