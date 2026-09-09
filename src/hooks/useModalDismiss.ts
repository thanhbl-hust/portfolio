import { useEffect } from 'react'
import type { Dispatch, SetStateAction } from 'react'

/** The two things every overlay on this site needs: Escape closes it, and the
 * page behind it stops scrolling (see `.scroll-locked` in index.css) so the
 * wheel can't move the content underneath instead of the overlay.
 *
 * Takes the state setter rather than a callback because React keeps setters
 * stable, which keeps the listener from being torn down on every render. */
export function useModalDismiss(open: boolean, setOpen: Dispatch<SetStateAction<boolean>>) {
  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    document.documentElement.classList.add('scroll-locked')
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.documentElement.classList.remove('scroll-locked')
    }
  }, [open, setOpen])
}
